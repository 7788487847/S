import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { profiles, users } from "@/db/schema";
import { sendActivationEmail } from "@/lib/mailer";
import { validateNickname } from "@/lib/validation";
import { blindIndex, encryptPersonal } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { reportServerError } from "@/lib/server-error";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "register", 5, 3_600_000);
  if (!limited.allowed) return NextResponse.json({ error: "注册请求过于频繁，请稍后再试" }, { status: 429 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "注册信息格式无效" }, { status: 400 }); }

  const role = body.role === "seeker" ? "seeker" : body.role === "artist" ? "artist" : null;
  const email = String(body.email || "").trim().toLowerCase();
  const displayName = String(body.displayName || "").trim();
  const password = String(body.password || "");
  if (!role) return NextResponse.json({ error: "请选择画师或寻光者身份" }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "密码至少需要8位" }, { status: 400 });
  if (body.age14Confirmed !== true) return NextResponse.json({ error: "本站仅面向年满14周岁的用户" }, { status: 400 });
  if (typeof body.adultConfirmed !== "boolean") return NextResponse.json({ error: "请选择是否已满18周岁" }, { status: 400 });
  if (!body.consent) return NextResponse.json({ error: "请同意用户协议、隐私政策和免责声明" }, { status: 400 });
  const nicknameError = validateNickname(displayName);
  if (nicknameError) return NextResponse.json({ error: nicknameError }, { status: 400 });

  const emailHash = blindIndex(email);
  const activationToken = crypto.randomBytes(32).toString("hex");
  try {
    const db = await getDb();
    if ((await db.select({ id: users.id }).from(users).where(eq(users.emailHash, emailHash))).length) return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    await db.transaction(async transaction => {
      const [user] = await transaction.insert(users).values({
        email: encryptPersonal(email), emailHash, passwordHash: await bcrypt.hash(password, 12), displayName, role,
        age14Confirmed: true, adultConfirmed: body.adultConfirmed === true, profileStatus: 0, emailActivated: false,
        activationToken, activationExpiresAt: new Date(Date.now() + 86_400_000), consentAgreedAt: new Date(), consentVersion: "2026-01",
      }).returning({ id: users.id });
      if (role === "artist") await transaction.insert(profiles).values({ userId: user.id, displayName });
      return user.id;
    });
  } catch (error) {
    reportServerError("register-account", error);
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "23505") return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    return NextResponse.json({ error: "账号创建失败，请稍后再试" }, { status: 500 });
  }

  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const activationUrl = `${origin}/activate?token=${activationToken}`;
  try {
    await sendActivationEmail(email, activationUrl);
    return NextResponse.json({ ok: true, accountCreated: true, emailSent: true, message: "注册成功，请到邮箱查收激活邮件", activationUrl: process.env.NODE_ENV !== "production" ? activationUrl : undefined });
  } catch (error) {
    reportServerError("register-email", error);
    return NextResponse.json({ ok: true, accountCreated: true, emailSent: false, message: "账号已创建，但激活邮件暂未送达，请稍后重新发送" });
  }
}
