import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { blindIndex, decryptPersonal } from "@/lib/crypto";
import { MailConfigurationError, MailProviderError, publicSiteUrl, sendActivationEmail } from "@/lib/mailer";
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
    const savedEmail = decryptPersonal(user.email);
    if (!savedEmail) throw new Error("PERSONAL_DATA_DECRYPT_FAILED");
    const newToken = crypto.randomBytes(32).toString("hex");
    const oldToken = user.activationToken;
    const oldExpiresAt = user.activationExpiresAt;

    // 先保存可用 Token，确保用户收到邮件后链接一定能在数据库中找到。
    await db.update(users).set({ activationToken: newToken, activationExpiresAt: new Date(Date.now() + 86_400_000) }).where(eq(users.id, user.id));
    try {
      await sendActivationEmail(savedEmail, `${publicSiteUrl()}/activate?token=${newToken}`);
    } catch (error) {
      await db.update(users).set({ activationToken: oldToken, activationExpiresAt: oldExpiresAt }).where(eq(users.id, user.id)).catch(() => undefined);
      throw error;
    }
    return NextResponse.json({ ok: true, message: "激活邮件已发送，请检查收件箱和垃圾邮件" });
  } catch (error) {
    reportServerError("resend-activation", error);
    let message = "激活邮件发送失败，请稍后重试";
    if (error instanceof MailConfigurationError && error.code === "MAIL_API_KEY_MISSING") message = "Resend 密钥未配置，请联系站长";
    else if (error instanceof MailConfigurationError && error.code === "MAIL_FROM_INVALID") message = "发件邮箱格式配置错误，请联系站长";
    else if (error instanceof MailProviderError) message = `Resend 拒绝发送：${error.message}`;
    else if (error instanceof Error && error.message === "DATABASE_URL_NOT_CONFIGURED") message = "数据库连接未配置，请联系站长";
    else if (error instanceof Error && /relation .* does not exist|table .* does not exist/i.test(error.message)) message = "数据库尚未初始化，请联系站长完成数据表迁移";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
