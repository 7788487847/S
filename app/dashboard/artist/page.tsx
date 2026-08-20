"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProfileEditor from "./ProfileEditor";
import ArtworkList, { Work } from "./ArtworkList";
import VerificationPanel from "./VerificationPanel";
import ArtworkCreatePanel from "./ArtworkCreatePanel";

type Profile = Record<string, unknown> & {
  displayName?: string; avatarUrl?: string | null; bio?: string | null; commissionStatus?: number;
  verificationRequestedAt?: string | null; isVerified?: boolean;
};
type ProfileResponse = { user: Profile; artworks: Work[] };

async function readJson(response: Response) { const text=await response.text(); try{return text?JSON.parse(text):{}}catch{return{error:"服务器响应异常，请稍后重试"}} }

export default function ArtistDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem("palette_token") || "";
    if (!token) { setMessage("登录已过期，请重新登录"); setLoading(false); return; }
    try {
      const response = await fetch("/api/profile", { cache:"no-store", headers: { authorization: `Bearer ${token}` } });
      const result = await readJson(response) as ProfileResponse & { error?: string };
      if (!response.ok) { setMessage(result.error || "资料加载失败"); return; }
      setProfile(result.user); setWorks(result.artworks || []);
    } catch { setMessage("网络连接失败，请稍后重试"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || saving) return;
    setSaving(true); setMessage("正在保存资料…");
    try {
      const token = localStorage.getItem("palette_token") || "";
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(profile) });
      const result = await readJson(response);
      setMessage(result.message || result.error || (response.ok ? "资料已保存" : "资料保存失败"));
      if (response.ok) await load();
    } catch { setMessage("网络连接失败，资料尚未保存"); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="p-20 text-center">正在加载创作中心…</p>;
  if (!profile) return <div className="rounded-3xl bg-white p-8 text-center shadow"><p>{message || "资料加载失败"}</p><Link href="/login" className="btn mt-5 inline-block">重新登录</Link></div>;
  return <div className="space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">你好，{String(profile.displayName || "画师")}</h1><p className="mt-2 text-stone-500">管理作品、认证和公开资料。</p></div><Link href="/studio" className="rounded-full border px-5 py-3">进入数据工作台</Link></div>
    {message && <p aria-live="polite" className="rounded-xl bg-orange-50 p-3 text-sm text-orange-800">{message}</p>}
    <ArtworkCreatePanel onCreated={() => void load()}/>
    <VerificationPanel works={works} pending={Boolean(profile.verificationRequestedAt)} verified={Boolean(profile.isVerified)} onSubmitted={() => { setMessage("认证申请已提交"); void load(); }}/>
    <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-[#1a1a1a]"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">我的作品</h2><p className="text-sm text-stone-500">共 {works.length} 件作品</p></div>{works.length < 3 && <span className="rounded-full bg-orange-50 px-4 py-2 text-sm text-orange-700">认证前至少上传 3 件作品</span>}</div><ArtworkList works={works}/>{!works.length && <p className="rounded-2xl border border-dashed p-10 text-center text-stone-500">还没有作品，请从创作中心上传第一件作品。</p>}</section>
    <div><div className="mb-3"><h2 className="text-xl font-bold">公开资料</h2><p className="text-sm text-stone-500">修改后提交审核，通过后展示在画师主页。</p></div><ProfileEditor profile={profile} onChange={setProfile} onSave={save} saving={saving}/></div>
  </div>;
}
