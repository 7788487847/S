import{Resend}from"resend";

const FROM="灵犀 <noreply@mail.rinsea.cn>";

function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]||char)}

export async function sendActivationEmail(email:string,url:string){
  const apiKey=process.env.RESEND_API_KEY;
  if(!apiKey){
    if(process.env.NODE_ENV==="production")throw new Error("RESEND_API_KEY 未配置");
    process.stderr.write("[mail] activation-email generated in development mode\n");
    return{delivered:false};
  }
  const safeUrl=escapeHtml(url);
  const{data,error}=await new Resend(apiKey).emails.send({
    from:FROM,
    to:[email],
    subject:"验证你的灵犀账号",
    html:`<!doctype html><html lang="zh-CN"><body style="margin:0;background:#f7f5f2;font-family:Arial,'PingFang SC',sans-serif;color:#292524"><div style="max-width:560px;margin:32px auto;background:#fff;border-radius:24px;padding:40px"><div style="font-size:28px;font-weight:700;color:#f97316">灵犀</div><h1 style="font-size:24px;margin:28px 0 12px">欢迎加入灵犀</h1><p style="line-height:1.8;color:#57534e">请点击下方按钮验证邮箱并激活账号。验证链接将在 24 小时后失效。</p><p style="margin:30px 0"><a href="${safeUrl}" style="display:inline-block;border-radius:999px;background:#f97316;padding:13px 24px;color:#fff;text-decoration:none;font-weight:700">验证邮箱</a></p><p style="font-size:12px;line-height:1.7;color:#a8a29e">如果这不是你的操作，可以忽略本邮件。按钮无法打开时，请复制此链接：<br><a href="${safeUrl}" style="color:#f97316;word-break:break-all">${safeUrl}</a></p></div></body></html>`,
    text:`欢迎加入灵犀。请打开以下链接验证邮箱并激活账号（24小时内有效）：${url}`
  });
  if(error)throw new Error(`验证邮件发送失败：${error.message}`);
  return{delivered:true,id:data?.id};
}
