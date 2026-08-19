import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { blindIndex, decryptPersonal } from "@/lib/crypto";
import { sendActivationEmail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rate-limit";
import { reportServerError } from "@/lib/server-error";

const genericMessage = "如果该邮箱存在未激活账号，激活邮件将会发送";
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "resend-activation", 3, 3_600_000);
  if (!limited.allowed) return NextResponse.json({ error: "发送过于频繁，请稍后再试" }, { status: 429 });
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.emailHash, blindIndex(email)));
    if (!user || user.emailActivated) return NextResponse.json({ ok: true, message: genericMessage });
    const newToken = crypto.randomBytes(32).toString("hex");
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    await sendActivationEmail(decryptPersonal(user.email), `${origin}/activate?token=${newToken}`);
    await db.update(users).set({ activationToken: newToken, activationExpiresAt: new Date(Date.now() + 86_400_000) }).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true, message: genericMessage });
  } catch (error) {
    reportServerError("resend-activation", error);
    return NextResponse.json({ error: "激活邮件发送失败，请稍后重试" }, { status: 503 });
  }
}
