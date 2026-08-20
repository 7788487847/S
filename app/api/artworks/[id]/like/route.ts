import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { artworkLikes, artworks, notifications } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { userApiError } from "@/lib/api-error";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request), { id } = await params, artworkId = Number(id), db = await getDb();
    const result = await db.transaction(async tx => {
      const [work] = await tx.select().from(artworks).where(and(eq(artworks.id, artworkId), eq(artworks.status, 1)));
      if (!work) return { error: "作品不存在", status: 404 } as const;
      const [existing] = await tx.select({ id: artworkLikes.id }).from(artworkLikes).where(and(eq(artworkLikes.userId, auth.userId), eq(artworkLikes.artworkId, artworkId)));
      if (existing) {
        await tx.delete(artworkLikes).where(eq(artworkLikes.id, existing.id));
        const [updated] = await tx.update(artworks).set({ likeCount: sql`greatest(${artworks.likeCount}-1,0)` }).where(eq(artworks.id, artworkId)).returning({ likeCount: artworks.likeCount });
        return { liked: false, likeCount: updated?.likeCount || 0 } as const;
      }
      await tx.insert(artworkLikes).values({ userId: auth.userId, artworkId });
      const [updated] = await tx.update(artworks).set({ likeCount: sql`${artworks.likeCount}+1` }).where(eq(artworks.id, artworkId)).returning({ likeCount: artworks.likeCount });
      if (work.userId !== auth.userId) await tx.insert(notifications).values({ userId: work.userId, type: "like", title: "你的作品收到了喜欢", body: work.title, targetUrl: `/artwork/${work.id}` });
      return { liked: true, likeCount: updated?.likeCount || 0 } as const;
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) { return userApiError(error, "artwork-like", "请先登录后点赞"); }
}
