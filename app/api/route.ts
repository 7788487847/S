import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, nickname, activateLink } = await request.json();

    const { data, error } = await resend.emails.send({
      from: '灵犀平台 <onboarding@resend.dev>',
      to: email,
      subject: '请激活你的灵犀账号',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>你好，${nickname}</h2>
          <p>欢迎加入灵犀，请点击下方链接激活你的账号：</p>
          <a 
            href="${activateLink}" 
            style="display: inline-block; padding: 12px 24px; background: #ff7a00; color: white; border-radius: 8px; text-decoration: none; margin: 16px 0;"
          >
            立即激活账号
          </a>
          <p>如果链接无法点击，请复制下面的地址到浏览器打开：</p>
          <p style="word-break: break-all; color: #666;">${activateLink}</p>
          <p style="margin-top: 40px; color: #999; font-size: 12px;">
            这是系统自动发送的邮件，请勿直接回复。
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: '邮件发送失败', error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '邮件发送成功', data });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: '服务器异常' },
      { status: 500 }
    );
  }
}
