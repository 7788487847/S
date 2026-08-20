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

function errorDetails(error: unknown) {
  const values: unknown[] = [error];
  const seen = new Set<unknown>();
  let message = "", code = "";
  while (values.length) {
    const current = values.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);
    const item = current as { message?: unknown; code?: unknown; cause?: unknown };
    if (typeof item.message === "string") message += ` ${item.message}`;
    if (!code && (typeof item.code === "string" || typeof item.code === "number")) code = String(item.code);
    if (item.cause) values.push(item.cause);
  }
  return { message, code };
}

function registrationError(error: unknown) {
  const { message, code } = errorDetails(error);
  if (message.includes("DATABASE_URL_NOT_CONFIGURED")) return "数据库连接未配置，请联系站长";
  if (code === "42P01" || /relation .* does not exist|table .* does not exist/i.test(message)) return "Supabase 已连接，但数据表尚未创建，请先执行数据库迁移";
  if (code === "42703" || /column .* does not exist/i.test(message)) return "Supabase 数据表版本过旧，请执行最新数据库迁移";
  if (code === "28P01" || /password authentication failed|invalid password/i.test(message)) return "Supabase 数据库密码错误，请更新 DATABASE_URL";
  if (["ENETUNREACH", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"].includes(code) || /connect timeout|network is unreachable|getaddrinfo/i.test(message)) return "Vercel 无法连接 Supabase，请将 DATABASE_URL 改为 Supabase Transaction pooler 地址";
  if (message.includes("PERSONAL_DATA_SECRET_NOT_CONFIGURED")) return "个人信息加密密钥未配置，请检查 PERSONAL_DATA_SECRET";
  if (code === "23505") return "该邮箱或昵称已被使用，请更换后重试";
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

  const activationToken = crypto.randomBytes(32).toString("hex");
  const activationUrl = `${publicSiteUrl()}/activate?token=${activationToken}`;

  try {
    const emailHash = blindIndex(email);
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
