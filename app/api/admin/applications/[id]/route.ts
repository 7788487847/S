import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { notifications, profiles, verificationApplications, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { adminApiError } from "@/lib/api-error";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params, { action } = await request.json(), status = action === "approve" ? 1 : 2, db = await getDb();
    const result = await db.transaction(async tx => {
      const [application] = await tx.update(verificationApplications).set({ status, reviewedAt: new Date() }).where(and(eq(verificationApplications.id, Number(id)), eq(verificationApplications.status, 0))).returning();
      if (!application) return null;
      const [user] = await tx.select().from(users).where(eq(users.id, application.userId));
      if (!user) return null;
      let artistNumber = user.artistNumber;
      if (status === 1 && !artistNumber) {
        const used = await tx.select({ number: users.artistNumber }).from(users).where(eq(users.isVerified, true));
        const numbers = new Set(used.map(item => item.number).filter((value): value is number => value !== null));
        artistNumber = 1; while (numbers.has(artistNumber)) artistNumber++;
      }
      const [updated] = await tx.update(users).set({ isVerified: status === 1, profileStatus: status === 1 ? 1 : 2, verificationRequestedAt: null, artistNumber: status === 1 ? artistNumber : null }).where(eq(users.id, application.userId)).returning();
      await tx.insert(profiles).values({ userId: updated.id, displayName: updated.displayName, isVerified: status === 1, profileStatus: status === 1 ? 1 : 2 }).onConflictDoUpdate({ target: profiles.userId, set: { displayName: updated.displayName, isVerified: status === 1, profileStatus: status === 1 ? 1 : 2, updatedAt: new Date() } });
      if (status === 1) await tx.insert(notifications).values({ userId: application.userId, type: "verification", title: "画师认证已通过", body: artistNumber ? `你的认证编号为 No.${String(artistNumber).padStart(2, "0")}` : null, targetUrl: `/u/${application.userId}` });
      return { application, artistNumber };
    });
    if (!result) return NextResponse.json({ error: "申请已处理或用户不存在" }, { status: 404 });
    await logAudit("admin", "verification", result.application.id, action);
    return NextResponse.json({ ok: true, artistNumber: result.artistNumber });
  } catch (error) { return adminApiError(error, "admin-verification"); }
}
