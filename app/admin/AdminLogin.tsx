"use client";

import { useState } from "react";

export default function AdminLogin({ onSuccess }: { onSuccess: (token: string) => Promise<void> }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) return setError(result.error || "登录失败");
      sessionStorage.setItem("palette_admin_token", result.token);
      await onSuccess(result.token);
    } catch { setError("登录服务暂时不可用"); }
    finally { setBusy(false); }
  }
  return <main className="grid min-h-screen place-items-center"><form onSubmit={submit} className="w-80 space-y-4 rounded-3xl bg-white p-8"><h1 className="text-2xl font-bold">灵犀 · 站长后台</h1><input className="input" placeholder="账号" onChange={e=>setForm({...form,username:e.target.value})}/><input className="input" type="password" placeholder="密码" onChange={e=>setForm({...form,password:e.target.value})}/>{error&&<p className="text-sm text-red-600">{error}</p>}<button disabled={busy} className="btn w-full">{busy?"登录中...":"登录"}</button></form></main>;
}
