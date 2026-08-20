import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auditLogs, profiles, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { adminApiError } from "@/lib/api-error";
import { validateNoContact, validateSafeText } from "@/lib/validation";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const body = await request.json(), { id } = await params, userId = Number(id), action = String(body.action || ""), db = await getDb();
    if (!Number.isInteger(userId)) return NextResponse.json({ error: "用户编号无效" }, { status: 400 });
    const result = await db.transaction(async tx => {
      let updated;
      if (action === "edit") {
        const displayName = String(body.displayName || "").trim(), bio = String(body.bio || "").trim();
        if (!displayName || displayName.length > 30 || bio.length > 500) throw new Error("INVALID_PROFILE");
        const unsafe = validateSafeText(`${displayName} ${bio}`); if (unsafe || validateNoContact(`${displayName} ${bio}`, "资料")) throw new Error("UNSAFE_PROFILE");
        [updated] = await tx.update(users).set({ displayName, bio: bio || null }).where(eq(users.id, userId)).returning();
        if (updated) await tx.insert(profiles).values({ userId, displayName, profileStatus: updated.profileStatus, isVerified: updated.isVerified }).onConflictDoUpdate({ target: profiles.userId, set: { displayName, updatedAt: new Date() } });
      } else if (action === "reset-name") [updated] = await tx.update(users).set({ displayName: `灵犀用户${userId}`, profileStatus: 2 }).where(eq(users.id, userId)).returning();
      else if (["approve", "reject"].includes(action)) [updated] = await tx.update(users).set({ profileStatus: action === "approve" ? 1 : 2 }).where(eq(users.id, userId)).returning();
      else throw new Error("INVALID_ACTION");
      if (!updated) return null;
      await tx.insert(auditLogs).values({ actor: "admin", targetType: "artist", targetId: userId, action }); return updated;
    });
    return result ? NextResponse.json({ ok: true, profile: result }) : NextResponse.json({ error: "用户不存在" }, { status: 404 });
  } catch (error) {
    if (error instanceof Error && ["INVALID_ACTION", "INVALID_PROFILE", "UNSAFE_PROFILE"].includes(error.message)) return NextResponse.json({ error: error.message === "UNSAFE_PROFILE" ? "资料包含不适合公开的内容或联系方式" : "提交内容无效" }, { status: 400 });
    return adminApiError(error, "admin-profile");
  }
}
