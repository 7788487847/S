import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auditLogs, reports, artworks, users, notifications } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { adminApiError } from "@/lib/api-error";
import { removeArtworkFiles } from "@/lib/artwork-storage";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request); const { id } = await params, { action } = await request.json();
    if (!["resolve", "take-down"].includes(action)) return NextResponse.json({ error: "无效操作" }, { status: 400 });
    const db = await getDb(), result = await db.transaction(async tx => {
      const [report] = await tx.select().from(reports).where(eq(reports.id, Number(id))); if (!report || report.status !== 0) return null;
      let removedWork: typeof artworks.$inferSelect | null = null;
      if (action === "take-down") {
        if (report.targetType === "artwork") { [removedWork] = await tx.delete(artworks).where(eq(artworks.id, report.targetId)).returning(); if (removedWork) await tx.insert(notifications).values({userId:removedWork.userId,type:"moderation",title:"作品因违规举报被下线",body:"作品记录和相关图片已删除。",targetUrl:"/dashboard"}); }
        else if (report.targetType === "artist") await tx.update(users).set({ isBanned: true }).where(eq(users.id, report.targetId));
      }
      await tx.update(reports).set({ status: 1 }).where(eq(reports.id, report.id)); await tx.insert(auditLogs).values({ actor: "admin", targetType: report.targetType, targetId: report.targetId, action: action === "take-down" ? "report-take-down" : "report-resolve" }); return {report,removedWork};
    });
    if (!result) return NextResponse.json({ error: "举报不存在或已处理" }, { status: 409 });
    if (result.removedWork) await removeArtworkFiles(result.removedWork);
    return NextResponse.json({ ok: true, message: result.removedWork ? "违规作品及全部图片已清理" : "举报已处理" });
  } catch (error) { return adminApiError(error, "admin-report"); }
}
