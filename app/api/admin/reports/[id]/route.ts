import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auditLogs, reports, artworks, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { adminApiError } from "@/lib/api-error";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params, { action } = await request.json();
    if (!["resolve", "take-down"].includes(action)) return NextResponse.json({ error: "无效操作" }, { status: 400 });
    const db = await getDb(), result = await db.transaction(async tx => {
      const [report] = await tx.select().from(reports).where(eq(reports.id, Number(id)));
      if (!report || report.status !== 0) return null;
      if (action === "take-down") {
        if (report.targetType === "artwork") await tx.update(artworks).set({ status: 2 }).where(eq(artworks.id, report.targetId));
        else if (report.targetType === "artist") await tx.update(users).set({ isBanned: true }).where(eq(users.id, report.targetId));
      }
      await tx.update(reports).set({ status: 1 }).where(eq(reports.id, report.id));
      await tx.insert(auditLogs).values({ actor: "admin", targetType: report.targetType, targetId: report.targetId, action: action === "take-down" ? "report-take-down" : "report-resolve" });
      return report;
    });
    return result ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "举报不存在或已处理" }, { status: 404 });
  } catch (error) { return adminApiError(error, "admin-report"); }
}
