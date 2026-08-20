import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { artworkFavorites, artworks, notifications } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { userApiError } from "@/lib/api-error";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request), { id } = await params, artworkId = Number(id), db = await getDb();
    const result = await db.transaction(async tx => {
      const [work] = await tx.select().from(artworks).where(and(eq(artworks.id, artworkId), eq(artworks.status, 1)));
      if (!work) return { error: "作品不存在", status: 404 } as const;
      const [existing] = await tx.select({ id: artworkFavorites.id }).from(artworkFavorites).where(and(eq(artworkFavorites.userId, auth.userId), eq(artworkFavorites.artworkId, artworkId)));
      if (existing) {
        await tx.delete(artworkFavorites).where(eq(artworkFavorites.id, existing.id));
        const [updated] = await tx.update(artworks).set({ favoriteCount: sql`greatest(${artworks.favoriteCount}-1,0)` }).where(eq(artworks.id, artworkId)).returning({ favoriteCount: artworks.favoriteCount });
        return { favorited: false, favoriteCount: updated?.favoriteCount || 0 } as const;
      }
      await tx.insert(artworkFavorites).values({ userId: auth.userId, artworkId });
      const [updated] = await tx.update(artworks).set({ favoriteCount: sql`${artworks.favoriteCount}+1` }).where(eq(artworks.id, artworkId)).returning({ favoriteCount: artworks.favoriteCount });
      if (work.userId !== auth.userId) await tx.insert(notifications).values({ userId: work.userId, type: "favorite", title: "你的作品被收藏了", body: work.title, targetUrl: `/artwork/${work.id}` });
      return { favorited: true, favoriteCount: updated?.favoriteCount || 0 } as const;
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) { return userApiError(error, "artwork-favorite", "请先登录后收藏"); }
}
