import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { profiles, verificationApplications, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { encryptPersonal } from "@/lib/crypto";
import { userApiError } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request), body = await request.json(), urls = Array.isArray(body.images) ? body.images : [], db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, auth.userId));
    if (!user || user.role !== "artist") return NextResponse.json({ error: "只有手画创作者可以申请画师认证" }, { status: 403 });
    if (urls.length < 3 || urls.length > 5) return NextResponse.json({ error: "请选择3-5张代表作品" }, { status: 400 });
    if (!body.originalityPromise) return NextResponse.json({ error: "请确认手画原创或合法授权承诺" }, { status: 400 });
    if ((await db.select({ id: verificationApplications.id }).from(verificationApplications).where(and(eq(verificationApplications.userId, auth.userId), eq(verificationApplications.status, 0)))).length) return NextResponse.json({ error: "申请正在审核中" }, { status: 409 });
    await db.transaction(async tx => {
      await tx.insert(profiles).values({ userId: user.id, displayName: user.displayName, profileStatus: 0 }).onConflictDoUpdate({ target: profiles.userId, set: { displayName: user.displayName, profileStatus: 0, updatedAt: new Date() } });
      await tx.insert(verificationApplications).values({ userId: auth.userId, realName: body.realName ? encryptPersonal(String(body.realName)) : null, representativeImages: JSON.stringify(urls) });
      await tx.update(users).set({ verificationRequestedAt: new Date() }).where(eq(users.id, auth.userId));
    });
    return NextResponse.json({ ok: true, message: "申请已提交，等待审核" });
  } catch (error) { return userApiError(error, "verification-application", "请先登录"); }
}
