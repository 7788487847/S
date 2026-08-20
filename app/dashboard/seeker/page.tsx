"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProfileResponse = { user?: { displayName?: string; role?: string } };

export default function SeekerDashboardPage() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const token = localStorage.getItem("palette_token") || "";
    const timer = window.setTimeout(() => { if (!token) setError("请先登录"); }, 0);
    if (token) fetch("/api/profile", { cache: "no-store", headers: { authorization: `Bearer ${token}` } })
      .then(async response => response.ok ? await response.json() as ProfileResponse : null)
      .then(result => result?.user ? setName(result.user.displayName || "寻光者") : setError("资料加载失败"))
      .catch(() => setError("资料加载失败，请稍后重试"));
    return () => window.clearTimeout(timer);
  }, []);
  if (error) return <p className="p-20 text-center">{error}</p>;
  if (!name) return <p className="p-20 text-center">正在加载寻光者中心…</p>;
  return <section className="rounded-3xl bg-white p-8 shadow-sm dark:bg-[#1a1a1a]">
    <h1 className="text-3xl font-bold">你好，{name}</h1>
    <p className="mt-2 text-stone-500">发现作品、收藏灵感，并管理你的账号。</p>
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      <Link href="/" className="rounded-2xl border p-5 text-center hover:border-orange-300"><b>浏览作品首页</b><small className="mt-1 block text-stone-500">继续发现画师与作品</small></Link>
      <Link href="/library" className="rounded-2xl border p-5 text-center hover:border-orange-300"><b>收藏与足迹</b><small className="mt-1 block text-stone-500">查看喜欢过的灵感</small></Link>
      <Link href="/account" className="rounded-2xl border p-5 text-center hover:border-orange-300"><b>账号设置</b><small className="mt-1 block text-stone-500">管理账号与安全</small></Link>
    </div>
  </section>;
}
