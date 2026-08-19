import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { sendActivationEmail } from "@/lib/mailer";
import { blindIndex, decryptPersonal } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { reportServerError } from "@/lib/server-error";

const message = "如果该邮箱已注册，重置邮件将会发送";
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "forgot-password", 3, 3_600_000);
  if (!limited.allowed) return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.emailHash, blindIndex(email)));
    if (!user || user.isBanned) return NextResponse.json({ ok: true, message });
    const token = crypto.randomBytes(32).toString("hex");
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    await sendActivationEmail(decryptPersonal(user.email), `${origin}/reset-password?token=${token}`);
    await db.update(users).set({ resetToken: token, resetExpiresAt: new Date(Date.now() + 3_600_000) }).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true, message, resetUrl: process.env.NODE_ENV !== "production" ? `${origin}/reset-password?token=${token}` : undefined });
  } catch (error) {
    reportServerError("forgot-password", error);
    return NextResponse.json({ error: "重置邮件服务暂时不可用，请稍后重试" }, { status: 503 });
  }
}
