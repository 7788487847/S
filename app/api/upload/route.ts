import { NextRequest, NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { artworks, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { verifyImageContent } from "@/lib/upload-security";
import { countArtworkImages } from "@/lib/image";
import { userApiError } from "@/lib/api-error";
import { createUploadTicket } from "@/lib/upload-ticket";
import { cleanupExpiredUploads } from "@/lib/upload-cleanup";

const formats = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
type Variant = { thumbnailUrl: string; displayUrl: string; originalUrl: string; originalName: string };
const removeFiles = async (folder: string, names: string[]) => { await Promise.all(names.map(name => unlink(path.join(folder, name)).catch(() => undefined))); };

export async function POST(request: NextRequest) {
  const created: string[] = [];
  try {
    const auth = await requireUser(request), limited = rateLimit(request, "upload", 20, 3_600_000, auth.userId);
    if (!limited.allowed) return NextResponse.json({ error: "上传过于频繁，请稍后再试" }, { status: 429 });
    await cleanupExpiredUploads().catch(() => undefined);
    const form = await request.formData(), files = form.getAll("images"), folder = process.env.UPLOAD_DIR || "./data/uploads", db = await getDb();
    if (!files.length) return NextResponse.json({ error: "请选择图片" }, { status: 400 });
    if (files.length > 10) return NextResponse.json({ error: "单次最多上传 10 张图片，请分批上传" }, { status: 400 });
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, auth.userId));
    if (user?.role !== "artist") return NextResponse.json({ error: "只有手画画师可以上传作品" }, { status: 403 });
    const owned = await db.select({ imageUrl: artworks.imageUrl, images: artworks.images, imageVariants: artworks.imageVariants }).from(artworks).where(eq(artworks.userId, auth.userId));
    const used = owned.reduce((sum, artwork) => sum + countArtworkImages(artwork), 0);
    if (used + files.length > 100) return NextResponse.json({ error: `每位画师最多上传 100 张图片，你已使用 ${used} 张，本次最多还可上传 ${Math.max(0, 100 - used)} 张` }, { status: 409 });
    await mkdir(folder, { recursive: true });
    const existing = await db.select({ hashes: artworks.imageHashes }).from(artworks), known = new Set(existing.flatMap(item => { try { return JSON.parse(item.hashes); } catch { return []; } })), variants: Variant[] = [], hashes: string[] = [];
    for (const item of files) {
      if (!(item instanceof File) || !formats.has(item.type) || item.size > 10_485_760) throw new Error("仅支持10MB以内的 JPG、PNG、WebP");
      const source = Buffer.from(await item.arrayBuffer()), verified = await verifyImageContent(source, item.type);
      if (!verified.ok) throw new Error(verified.error);
      const hash = crypto.createHash("md5").update(source).digest("hex");
      if (known.has(hash) || hashes.includes(hash)) throw new Error("同一张图片不能重复上传");
      const ext = formats.get(item.type)!, base = `${Date.now()}-${crypto.randomUUID()}`, originalName = `${base}-original.${ext}`, thumbnailName = `${base}-thumb.webp`, displayName = `${base}-display.webp`, pipeline = sharp(source).rotate();
      const [original, thumbnail, display] = await Promise.all([pipeline.clone().toFormat(ext === "jpg" ? "jpeg" : ext as "png" | "webp").toBuffer(), pipeline.clone().resize({ width: 400, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(), pipeline.clone().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()]);
      await Promise.all([writeFile(path.join(folder, originalName), original), writeFile(path.join(folder, thumbnailName), thumbnail), writeFile(path.join(folder, displayName), display)]);
      created.push(originalName, thumbnailName, displayName);
      variants.push({ thumbnailUrl: `/api/uploads/${thumbnailName}`, displayUrl: `/api/uploads/${displayName}`, originalUrl: `/api/uploads/${originalName}?download=1`, originalName: item.name }); hashes.push(hash);
    }
    const uploadTicket = await createUploadTicket(auth.userId, created);
    return NextResponse.json({ uploadTicket, urls: variants.map(item => item.thumbnailUrl), displayUrls: variants.map(item => item.displayUrl), originalUrls: variants.map(item => item.originalUrl), variants, hashes, usedImages: used, remainingImages: 100 - used - files.length });
  } catch (error) {
    const folder = process.env.UPLOAD_DIR || "./data/uploads";
    if (created.length) await removeFiles(folder, created);
    return userApiError(error, "upload", "图片处理失败，请检查文件后重试");
  }
}
