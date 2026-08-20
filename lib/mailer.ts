import { Resend } from "resend";

const DEFAULT_FROM = "灵犀 <noreply@rinsea.cn>";

export class MailConfigurationError extends Error {
  constructor(public code: "MAIL_API_KEY_MISSING" | "MAIL_FROM_INVALID", message: string) {
    super(message);
    this.name = "MailConfigurationError";
  }
}

export class MailProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MailProviderError";
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}

function config() {
  // Vercel 直接读取 RESEND_API_KEY；compose 部署可将 RESEND_API_TOKEN 映射到它。
  const apiKey = process.env.RESEND_API_KEY?.trim() || process.env.RESEND_API_TOKEN?.trim();
  const from = process.env.MAIL_FROM?.trim() || DEFAULT_FROM;
  if (!apiKey) throw new MailConfigurationError("MAIL_API_KEY_MISSING", "Resend API Key 未配置");
  if (!/^.+<[^<>\s]+@[^<>\s]+>$/.test(from)) throw new MailConfigurationError("MAIL_FROM_INVALID", "MAIL_FROM 格式无效");
  return { apiKey, from };
}

async function send(to: string, subject: string, html: string, text: string) {
  const { apiKey, from } = config();
  try {
    const { data, error } = await new Resend(apiKey).emails.send({ from, to: [to], subject, html, text });
    if (error) throw new MailProviderError(error.message || "Resend 拒绝发送邮件");
    if (!data?.id) throw new MailProviderError("Resend 未返回邮件编号");
    return { id: data.id, from };
  } catch (error) {
    if (error instanceof MailProviderError) throw error;
    throw new MailProviderError(error instanceof Error ? error.message : "无法连接 Resend");
  }
}

export async function sendActivationEmail(email: string, url: string) {
  const safeUrl = escapeHtml(url);
  return send(email, "验证你的灵犀账号", `<!doctype html><html lang="zh-CN"><body style="margin:0;background:#f7f5f2;font-family:Arial,'PingFang SC',sans-serif;color:#292524"><div style="max-width:560px;margin:32px auto;background:#fff;border-radius:24px;padding:40px"><div style="font-size:28px;font-weight:700;color:#f97316">灵犀</div><h1 style="font-size:24px;margin:28px 0 12px">欢迎加入灵犀</h1><p style="line-height:1.8;color:#57534e">请点击下方按钮验证邮箱并激活账号。验证链接将在 24 小时后失效。</p><p style="margin:30px 0"><a href="${safeUrl}" style="display:inline-block;border-radius:999px;background:#f97316;padding:13px 24px;color:#fff;text-decoration:none;font-weight:700">验证邮箱</a></p><p style="font-size:12px;line-height:1.7;color:#a8a29e">如果这不是你的操作，可以忽略本邮件。按钮无法打开时，请复制此链接：<br><a href="${safeUrl}" style="color:#f97316;word-break:break-all">${safeUrl}</a></p></div></body></html>`, `欢迎加入灵犀。请打开以下链接验证邮箱并激活账号（24小时内有效）：${url}`);
}

export async function sendMailTest(email: string) {
  return send(email, "灵犀邮件服务测试", "<p>如果你收到这封邮件，说明灵犀的发件密钥、发件域名和收件地址已经连通。</p>", "如果你收到这封邮件，说明灵犀邮件服务已连通。");
}

export function publicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.rinsea.cn").replace(/\/$/, "");
}
