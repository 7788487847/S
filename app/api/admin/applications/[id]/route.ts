import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { notifications, profiles, verificationApplications, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { adminApiError } from "@/lib/api-error";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params, { action } = await request.json();
    if (!['approve','reject'].includes(action)) return NextResponse.json({ error: "审核操作无效" }, { status: 400 });
    const status = action === "approve" ? 1 : 2, db = await getDb();
    const result = await db.transaction(async tx => {
      const [application] = await tx.update(verificationApplications).set({ status, reviewedAt: new Date() }).where(and(eq(verificationApplications.id, Number(id)), eq(verificationApplications.status, 0))).returning();
      if (!application) return null;
      const [user] = await tx.select().from(users).where(eq(users.id, application.userId));
      if (!user) throw new Error("VERIFICATION_USER_MISSING");
      let artistNumber = user.artistNumber;
      if (status === 1 && !artistNumber) {
        const [numberRow] = await tx.select({ next: sql<number>`coalesce(max(${users.artistNumber}), 0) + 1` }).from(users);
        artistNumber = Number(numberRow.next);
      }
      const [updated] = await tx.update(users).set({ isVerified: status === 1, profileStatus: status === 1 ? 1 : 2, verificationRequestedAt: null, artistNumber: status === 1 ? artistNumber : null }).where(eq(users.id, application.userId)).returning();
      await tx.insert(profiles).values({ userId: updated.id, displayName: updated.displayName, isVerified: status === 1, profileStatus: status === 1 ? 1 : 2 }).onConflictDoUpdate({ target: profiles.userId, set: { displayName: updated.displayName, isVerified: status === 1, profileStatus: status === 1 ? 1 : 2, updatedAt: new Date() } });
      await tx.insert(notifications).values({ userId: application.userId, type: "verification", title: status === 1 ? "画师认证已通过" : "画师认证未通过", body: status === 1 && artistNumber ? `你的认证编号为 No.${String(artistNumber).padStart(2,"0")}` : "你可以调整代表作品后重新提交认证申请。", targetUrl: status === 1 ? `/u/${application.userId}` : "/dashboard" });
      return { application, artistNumber };
    });
    if (!result) return NextResponse.json({ error: "这条申请已经处理，请刷新列表" }, { status: 409 });
    await logAudit("admin", "verification", result.application.id, action);
    return NextResponse.json({ ok: true, message: status === 1 ? "认证已通过" : "认证已驳回，画师可以重新申请", artistNumber: result.artistNumber });
  } catch (error) { return adminApiError(error, "admin-verification"); }
}
