import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { profiles, users } from "@/db/schema";
import { MailConfigurationError, MailProviderError, publicSiteUrl, sendActivationEmail } from "@/lib/mailer";
import { validateNickname } from "@/lib/validation";
import { blindIndex, encryptPersonal } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { reportServerError } from "@/lib/server-error";

function registrationError(error: unknown) {
  if (error instanceof Error && error.message === "DATABASE_URL_NOT_CONFIGURED") return "数据库连接未配置，请联系站长";
  if (error instanceof Error && /relation .* does not exist|table .* does not exist/i.test(error.message)) return "数据库尚未初始化，请联系站长完成数据表迁移";
  return "注册服务暂时不可用，请稍后重试";
}

function mailError(error: unknown) {
  if (error instanceof MailConfigurationError && error.code === "MAIL_API_KEY_MISSING") return "Resend 密钥未配置，请联系站长";
  if (error instanceof MailConfigurationError && error.code === "MAIL_FROM_INVALID") return "发件邮箱格式配置错误，请联系站长";
  if (error instanceof MailProviderError) return `Resend 拒绝发送：${error.message}`;
  return "邮件发送失败，请稍后点击重新发送激活邮件";
}

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
  const activationUrl = `${publicSiteUrl()}/activate?token=${activationToken}`;

  try {
    const db = await getDb();
    if ((await db.select({ id: users.id }).from(users).where(eq(users.emailHash, emailHash))).length) {
      return NextResponse.json({ error: "该邮箱已注册，请直接登录或重新发送激活邮件" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await db.transaction(async tx => {
      const [user] = await tx.insert(users).values({
        email: encryptPersonal(email), emailHash, passwordHash, displayName, role,
        age14Confirmed: true, adultConfirmed: body.adultConfirmed === true,
        profileStatus: 0, emailActivated: false, activationToken,
        activationExpiresAt: new Date(Date.now() + 86_400_000),
        consentAgreedAt: new Date(), consentVersion: "2026-08-19"
      }).returning({ id: users.id });
      if (role === "artist") await tx.insert(profiles).values({ userId: user.id, displayName });
    });
  } catch (error) {
    reportServerError("register-account", error);
    return NextResponse.json({ error: registrationError(error) }, { status: 503 });
  }

  try {
    await sendActivationEmail(email, activationUrl);
    return NextResponse.json({ ok: true, emailSent: true, message: "注册成功，激活邮件已发送，请检查收件箱和垃圾邮件" });
  } catch (error) {
    reportServerError("register-mail", error);
    return NextResponse.json({ ok: true, emailSent: false, message: `账号已创建，但${mailError(error)}。请在本页点击“重新发送激活邮件”` }, { status: 202 });
  }
}
