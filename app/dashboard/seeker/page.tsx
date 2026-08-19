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
    if (token) fetch("/api/profile", { headers: { authorization: `Bearer ${token}` } })
      .then(async response => response.ok ? await response.json() as ProfileResponse : null)
      .then(result => result?.user ? setName(result.user.displayName || "寻光者") : setError("资料加载失败"))
      .catch(() => setError("资料加载失败，请稍后重试"));
    return () => window.clearTimeout(timer);
  }, []);
  if (error) return <p className="p-20 text-center">{error}</p>;
  if (!name) return <p className="p-20 text-center">正在加载寻光者中心…</p>;
  return <section className="rounded-3xl bg-white p-8 shadow-sm dark:bg-[#1a1a1a]"><h1 className="text-3xl font-bold">你好，{name}</h1><p className="mt-2 text-stone-500">管理你的灵犀账号。</p><div className="mt-8 rounded-2xl border border-dashed border-orange-200 p-12 text-center text-stone-500"><Link href="/library" className="brand-text">收藏夹 / 浏览记录</Link><span className="mx-2">·</span><Link href="/account" className="brand-text">账号设置</Link></div></section>;
}
