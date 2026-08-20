import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, lt, or } from "drizzle-orm";
import { artworks, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { validateNoContact } from "@/lib/validation";
import { countArtworkImages } from "@/lib/image";
import { userApiError } from "@/lib/api-error";
import { verifyUploadTicket } from "@/lib/upload-ticket";

const risk = /(迪士尼|宝可梦|官方|同人)/i;

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim();
  const sort = params.get("sort") || "latest";
  const limit = Math.min(Math.max(Number(params.get("limit") || 24), 1), 48);
  const cursor = Number(params.get("cursor") || 0);
  const db = await getDb();
  const baseCondition = query
    ? and(
        eq(artworks.status, 1),
        or(ilike(artworks.title, `%${query}%`), ilike(artworks.tags, `%${query}%`), ilike(users.displayName, `%${query}%`)),
      )
    : eq(artworks.status, 1);
  const condition = cursor>0&&sort==="latest"?and(baseCondition,lt(artworks.id,cursor)):baseCondition;
  const order = sort === "popular"
    ? desc(artworks.viewCount)
    : sort === "favorites"
      ? desc(artworks.favoriteCount)
      : desc(artworks.createdAt);
  const rows = await db
    .select({
      id: artworks.id,
      title: artworks.title,
      thumbnailUrl: artworks.thumbnailUrl,
      legacyImageUrl: artworks.imageUrl,
      tags: artworks.tags,
      imageCount: artworks.images,
      userId: users.id,
      artistName: users.displayName,
      artistAvatar: users.avatarUrl,
      viewCount: artworks.viewCount,
      favoriteCount: artworks.favoriteCount,
      likeCount: artworks.likeCount,
      createdAt: artworks.createdAt,
    })
    .from(artworks)
    .innerJoin(users, eq(artworks.userId, users.id))
    .where(condition)
    .orderBy(order, desc(artworks.createdAt))
    .limit(limit);
  return NextResponse.json(rows.map(({ thumbnailUrl, legacyImageUrl, ...row }) => ({
    ...row,
    imageUrl: thumbnailUrl || legacyImageUrl,
  })));
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    const body = await request.json();
    const db = await getDb();
    const variants = Array.isArray(body.variants) ? body.variants : [];
    const urls = Array.isArray(body.images) ? body.images : [];
    const displayUrls = Array.isArray(body.displayUrls) ? body.displayUrls : [];
    const originalUrls = Array.isArray(body.originalUrls) ? body.originalUrls : [];
    const hashes = Array.isArray(body.hashes) ? body.hashes : [];
    if (!body.uploadTicket) return NextResponse.json({ error: "上传凭证已失效，请重新选择图片" }, { status: 400 });
    const ticketNames = await verifyUploadTicket(String(body.uploadTicket), auth.userId);
    const submittedNames = new Set([...urls, ...displayUrls, ...originalUrls].map(value => String(value).split("/").pop()?.split("?")[0]).filter((name): name is string => Boolean(name)));
    if (ticketNames.length !== submittedNames.size || ticketNames.some(name => !submittedNames.has(name)) || [...submittedNames].some(name => !ticketNames.includes(name))) return NextResponse.json({ error: "上传内容与凭证不一致，请重新上传" }, { status: 400 });
    const title = String(body.title || "").trim();
    const tags = String(body.tags || "");
    const description = String(body.description || "");
    const [user] = await db.select().from(users).where(eq(users.id, auth.userId));
    if (!user?.emailActivated) return NextResponse.json({ error: "请先到邮箱查收激活邮件" }, { status: 403 });
    if (user.role !== "artist") return NextResponse.json({ error: "只有手画画师可以发布作品" }, { status: 403 });
    if (!body.agreed) return NextResponse.json({ error: "请先同意《用户协议》和《社区规范》" }, { status: 400 });
    if (validateNoContact(`${title} ${tags} ${description}`, "内容")) return NextResponse.json({ error: "内容包含违规联系方式" }, { status: 400 });
    if (!title || !urls.length) return NextResponse.json({ error: "请填写标题并上传图片" }, { status: 400 });
    if (urls.length > 10) return NextResponse.json({ error: "单次最多提交 10 张图片，请分批上传" }, { status: 400 });
    const owned = await db.select({ imageUrl: artworks.imageUrl, images: artworks.images, imageVariants: artworks.imageVariants }).from(artworks).where(eq(artworks.userId, auth.userId));
    const usedImages = owned.reduce((sum, artwork) => sum + countArtworkImages(artwork), 0);
    if (usedImages + urls.length > 100) return NextResponse.json({ error: "每位画师最多上传 100 张图片" }, { status: 409 });
    const copyrightRisk = risk.test(`${title} ${tags}`);
    const publishedCount = (await db.select({ id: artworks.id }).from(artworks).where(and(eq(artworks.userId, auth.userId), eq(artworks.status, 1)))).length;
    const autoPass = !copyrightRisk && (user.trustLevel >= 1 || publishedCount >= 3);
    const status = autoPass ? 1 : 0;
    const [artwork] = await db.insert(artworks).values({
      userId: auth.userId,
      title,
      tags,
      description: description || null,
      imageUrl: urls[0],
      thumbnailUrl: urls[0] || null,
      displayUrl: displayUrls[0] || urls[0] || null,
      originalUrl: originalUrls[0] || urls[0] || null,
      images: JSON.stringify(displayUrls.length ? displayUrls : urls),
      imageVariants: JSON.stringify(variants),
      imageHashes: JSON.stringify(hashes),
      artworkType: "original",
      copyrightRisk,
      autoPass,
      status,
    }).returning();
    if (publishedCount >= 3 && user.trustLevel < 1) await db.update(users).set({ trustLevel: 1 }).where(eq(users.id, user.id));
    return NextResponse.json({ artwork, message: autoPass ? "上传成功，作品已自动发布" : copyrightRisk ? "作品疑似存在侵权风险，已转人工审核" : "上传成功，等待审核" });
  } catch (error) { return userApiError(error, "artwork-create", "请先登录后提交作品"); }
}
