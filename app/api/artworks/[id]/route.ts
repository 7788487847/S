import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { artworkFavorites, artworkLikes, artworks, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { verifyJwt } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "作品不存在" }, { status: 404 });
  const artworkId = Number(id);
  const db = await getDb();
  const [artwork] = await db.select({
    id: artworks.id,
    title: artworks.title,
    imageUrl: artworks.imageUrl,
    thumbnailUrl: artworks.thumbnailUrl,
    displayUrl: artworks.displayUrl,
    images: artworks.images,
    imageVariants: artworks.imageVariants,
    originalUrl: artworks.originalUrl,
    tags: artworks.tags,
    description: artworks.description,
    userId: users.id,
    artistName: users.displayName,
    commissionStatus: users.commissionStatus,
    miyousheUrl: users.miyousheUrl,
    weiboUrl: users.weiboUrl,
    bilibiliUrl: users.bilibiliUrl,
    xiaohongshuUrl: users.xiaohongshuUrl,
    douyinUrl: users.douyinUrl,
    pixivUrl: users.pixivUrl,
    twitterUrl: users.twitterUrl,
    websiteUrl: users.websiteUrl,
    viewCount: artworks.viewCount,
    favoriteCount: artworks.favoriteCount,
    likeCount: artworks.likeCount,
  }).from(artworks).innerJoin(users, eq(artworks.userId, users.id)).where(and(eq(artworks.id, artworkId), eq(artworks.status, 1)));
  if (!artwork) return NextResponse.json({ error: "作品不存在" }, { status: 404 });
  let favorited = false, liked = false, isOwner = false;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (token) try {
    const auth = await verifyJwt(token);
    isOwner = auth.userId === artwork.userId;
    favorited = !!(await db.select({ id: artworkFavorites.id }).from(artworkFavorites).where(and(eq(artworkFavorites.userId, auth.userId), eq(artworkFavorites.artworkId, artworkId))))[0];
    liked = !!(await db.select({ id: artworkLikes.id }).from(artworkLikes).where(and(eq(artworkLikes.userId, auth.userId), eq(artworkLikes.artworkId, artworkId))))[0];
  } catch {}
  const siblings = await db.select({ id: artworks.id }).from(artworks).where(and(eq(artworks.userId, artwork.userId), eq(artworks.status, 1))).orderBy(asc(artworks.createdAt));
  return NextResponse.json({ artwork, favorited, liked, siblings, isOwner });
}
