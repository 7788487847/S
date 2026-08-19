"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/Header";

type Role = "artist" | "seeker";

export default function Page() {
  const [form, setForm] = useState({ displayName: "", email: "", password: "", consent: false, age14Confirmed: false, adultConfirmed: false, role: "" as Role | "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (values: Partial<typeof form>) => setForm(current => ({ ...current, ...values }));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.role) return setMessage("请选择你的身份");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const text = await response.text();
      const result: { message?: string; error?: string; activationUrl?: string } = text ? JSON.parse(text) : {};
      setMessage(`${result.message || result.error || (response.ok ? "注册成功" : "注册失败，请稍后再试")}${result.activationUrl ? `：${result.activationUrl}` : ""}`);
      if (response.ok && result.message?.includes("账号已创建")) update({ password: "" });
    } catch { setMessage("注册失败，请检查网络后重试"); }
    finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/resend-activation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.email }) });
      const result = await response.json();
      setMessage(result.message || result.error || "发送失败");
    } catch { setMessage("发送失败，请检查网络后重试"); }
    finally { setBusy(false); }
  }
  return <><Header/><main className="grid min-h-[75vh] place-items-center p-5"><form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-8 shadow dark:bg-[#1a1a1a]">
    <h1 className="text-3xl font-bold">加入灵犀</h1>
    <div className="grid gap-3 sm:grid-cols-2">{([{ role:"artist", icon:"🎨", title:"我是画师", text:"手画作品发布、认证与接稿" },{ role:"seeker", icon:"🔍", title:"我是寻光者", text:"来找灵感 / 约稿" }] as const).map(item => <button key={item.role} type="button" onClick={() => update({ role:item.role })} className={`rounded-2xl border-2 p-4 text-left ${form.role===item.role?"border-[var(--brand)] brand-soft":"border-stone-200"}`}><span className="text-2xl">{item.icon}</span><b className="mt-2 block">{item.title}</b><small className="text-stone-500">{item.text}</small></button>)}</div>
    {form.role==="artist"&&<p className="rounded-2xl bg-orange-50 p-3 text-sm text-orange-800">画师可发布手画作品、申请认证并自主开启约稿状态。</p>}
    <input required className="input" placeholder="昵称" value={form.displayName} onChange={e=>update({displayName:e.target.value})}/>
    <input required className="input" type="email" placeholder="邮箱" value={form.email} onChange={e=>update({email:e.target.value})}/>
    <input required className="input" type="password" minLength={8} placeholder="密码，至少8位" value={form.password} onChange={e=>update({password:e.target.value})}/>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.age14Confirmed} onChange={e=>update({age14Confirmed:e.target.checked})}/>我确认已年满14周岁</label>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.adultConfirmed} onChange={e=>update({adultConfirmed:e.target.checked})}/>我确认已年满18周岁（未勾选仍可注册，但不能发起约稿或提交联系方式）</label>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.consent} onChange={e=>update({consent:e.target.checked})}/>我已阅读并同意<Link className="brand-text" href="/terms">《用户协议》</Link>、<Link className="brand-text" href="/privacy">《隐私政策》</Link>及<Link className="brand-text" href="/disclaimer">《免责声明》</Link></label>
    <button disabled={busy} className="btn w-full">{busy?"处理中...":"注册并发送激活邮件"}</button>{message&&<p className="break-all text-sm text-orange-700">{message}</p>}
    <button type="button" disabled={busy||!form.email} onClick={resend} className="w-full text-sm brand-text disabled:opacity-50">没有收到邮件？重新发送激活邮件</button>
  </form></main></>;
}
