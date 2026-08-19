import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { reportServerError } from "@/lib/server-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token || "");
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: "激活链接无效或已过期" }, { status: 400 });
    const db = await getDb();
    const [user] = await db.select({ id: users.id, activationExpiresAt: users.activationExpiresAt }).from(users).where(eq(users.activationToken, token));
    if (!user || !user.activationExpiresAt || user.activationExpiresAt < new Date()) return NextResponse.json({ error: "激活链接无效或已过期" }, { status: 400 });
    await db.update(users).set({ emailActivated: true, activationToken: null, activationExpiresAt: null }).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    reportServerError("activate", error);
    return NextResponse.json({ error: "激活服务暂时不可用，请稍后重试" }, { status: 503 });
  }
}
