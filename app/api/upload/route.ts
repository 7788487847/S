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
import { putObject, remoteStorageEnabled, removeObjects } from "@/lib/object-storage";

const formats = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
type Variant = { thumbnailUrl: string; displayUrl: string; originalUrl: string; originalName: string };
const localRoot = () => process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
const localPath = (name: string) => path.join(/* turbopackIgnore: true */ localRoot(), name);
const removeLocalFiles = async (names: string[]) => { await Promise.all(names.map(name => unlink(localPath(name)).catch(() => undefined))); };

export async function POST(request: NextRequest) {
  const created: string[] = [];
  let useRemote = false;
  try {
    const auth = await requireUser(request);
    const limited = rateLimit(request, "upload", 20, 3_600_000, auth.userId);
    if (!limited.allowed) return NextResponse.json({ error: "上传过于频繁，请稍后再试" }, { status: 429 });
    useRemote = remoteStorageEnabled();
    if (process.env.VERCEL && !useRemote) return NextResponse.json({ error: "图片存储尚未配置，请站长在 Vercel 添加 SUPABASE_URL、SUPABASE_SECRET_KEY，并在 Supabase 创建公开的 artworks 存储桶" }, { status: 503 });
    if (!useRemote) await cleanupExpiredUploads().catch(() => undefined);

    const form = await request.formData();
    const files = form.getAll("images");
    const db = await getDb();
    if (!files.length) return NextResponse.json({ error: "请选择图片" }, { status: 400 });
    if (files.length > 10) return NextResponse.json({ error: "单次最多上传 10 张图片" }, { status: 400 });
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, auth.userId));
    if (user?.role !== "artist") return NextResponse.json({ error: "只有画师可以上传作品" }, { status: 403 });
    const owned = await db.select({ imageUrl: artworks.imageUrl, images: artworks.images, imageVariants: artworks.imageVariants }).from(artworks).where(eq(artworks.userId, auth.userId));
    const used = owned.reduce((sum, artwork) => sum + countArtworkImages(artwork), 0);
    if (used + files.length > 100) return NextResponse.json({ error: `最多上传 100 张图片，你还可上传 ${Math.max(0, 100 - used)} 张` }, { status: 409 });
    if (!useRemote) await mkdir(localRoot(), { recursive: true });

    const existing = await db.select({ hashes: artworks.imageHashes }).from(artworks);
    const known = new Set(existing.flatMap(item => { try { return JSON.parse(item.hashes); } catch { return []; } }));
    const variants: Variant[] = [], hashes: string[] = [];
    for (const item of files) {
      if (!(item instanceof File) || !formats.has(item.type) || item.size > 10_485_760) throw new Error("仅支持 10MB 以内的 JPG、PNG、WebP");
      const source = Buffer.from(await item.arrayBuffer());
      const verified = await verifyImageContent(source, item.type);
      if (!verified.ok) throw new Error(verified.error);
      const hash = crypto.createHash("md5").update(source).digest("hex");
      if (known.has(hash) || hashes.includes(hash)) throw new Error("同一张图片不能重复上传");
      const ext = formats.get(item.type)!;
      const base = `${auth.userId}-${Date.now()}-${crypto.randomUUID()}`;
      const originalName = `${base}-original.${ext}`, thumbnailName = `${base}-thumb.webp`, displayName = `${base}-display.webp`;
      const pipeline = sharp(source).rotate();
      const [original, thumbnail, display] = await Promise.all([
        pipeline.clone().toFormat(ext === "jpg" ? "jpeg" : ext as "png" | "webp").toBuffer(),
        pipeline.clone().resize({ width: 400, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
        pipeline.clone().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(),
      ]);
      let thumbnailUrl: string, displayUrl: string, originalUrl: string;
      if (useRemote) {
        [originalUrl, thumbnailUrl, displayUrl] = await Promise.all([putObject(originalName, original, item.type), putObject(thumbnailName, thumbnail, "image/webp"), putObject(displayName, display, "image/webp")]);
      } else {
        await Promise.all([writeFile(localPath(originalName), original), writeFile(localPath(thumbnailName), thumbnail), writeFile(localPath(displayName), display)]);
        originalUrl = `/api/uploads/${originalName}?download=1`;
        thumbnailUrl = `/api/uploads/${thumbnailName}`;
        displayUrl = `/api/uploads/${displayName}`;
      }
      created.push(originalName, thumbnailName, displayName);
      variants.push({ thumbnailUrl, displayUrl, originalUrl, originalName: item.name });
      hashes.push(hash);
    }
    const uploadTicket = await createUploadTicket(auth.userId, created);
    return NextResponse.json({ uploadTicket, urls: variants.map(item => item.thumbnailUrl), displayUrls: variants.map(item => item.displayUrl), originalUrls: variants.map(item => item.originalUrl), variants, hashes, usedImages: used, remainingImages: 100 - used - files.length });
  } catch (error) {
    if (created.length) { if (useRemote) await removeObjects(created); else await removeLocalFiles(created); }
    return userApiError(error, "upload", "图片处理失败，请检查文件后重试");
  }
}
