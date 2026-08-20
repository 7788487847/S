import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { complaints, artworks, users, notifications } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { adminApiError } from "@/lib/api-error";
import { removeArtworkFiles } from "@/lib/artwork-storage";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request); const { id } = await params, { artworkId } = await request.json(), db = await getDb();
    const result = await db.transaction(async tx => { const [work] = await tx.delete(artworks).where(eq(artworks.id, Number(artworkId))).returning(); if (!work) return null; await tx.update(complaints).set({ status: 1 }).where(eq(complaints.id, Number(id))); const [user] = await tx.update(users).set({ copyrightStrikeCount: sql`${users.copyrightStrikeCount}+1` }).where(eq(users.id, work.userId)).returning(); if (user && user.copyrightStrikeCount >= 3) await tx.update(users).set({ isBanned: true }).where(eq(users.id, user.id)); await tx.insert(notifications).values({userId:work.userId,type:"moderation",title:"作品因侵权投诉被下线",body:"作品记录和相关图片已删除。",targetUrl:"/dashboard"}); return { work, user }; });
    if (!result) return NextResponse.json({ error: "作品不存在或已处理" }, { status: 409 });
    await removeArtworkFiles(result.work); await logAudit("admin", "artwork", result.work.id, "copyright-takedown", `complaint:${id}`);
    return NextResponse.json({ ok: true, banned: !!result.user && result.user.copyrightStrikeCount >= 3, message: "侵权作品及全部图片已清理" });
  } catch (error) { return adminApiError(error, "admin-complaint"); }
}
