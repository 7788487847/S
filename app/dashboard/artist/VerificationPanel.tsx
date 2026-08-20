"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { getArtworkThumbnail } from "@/lib/image";
import type { Work } from "./ArtworkList";

type Props = { works: Work[]; pending: boolean; verified: boolean; onSubmitted: () => void };

async function readJson(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { error: "服务器响应异常，请稍后重试" }; }
}

export default function VerificationPanel({ works, pending, verified, onSubmitted }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [realName, setRealName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const available = works.filter(work => work.status !== 2);

  function toggle(id: number) {
    setMessage("");
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length >= 5 ? current : [...current, id]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (selected.length < 3 || selected.length > 5) return setMessage("请勾选 3–5 件代表作品");
    if (!agreed) return setMessage("请先确认原创或合法授权承诺");
    setBusy(true); setMessage("正在提交认证申请，请稍候…");
    try {
      const token = localStorage.getItem("palette_token") || "";
      const response = await fetch("/api/profile/verify", { method: "POST", cache: "no-store", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ artworkIds: selected, realName, originalityPromise: agreed }) });
      const result = await readJson(response);
      if (!response.ok) return setMessage(result.error || "提交失败，请稍后重试");
      setMessage(result.message || "申请已提交，等待审核");
      onSubmitted();
    } catch { setMessage("网络连接失败，请检查网络后重试"); }
    finally { setBusy(false); }
  }

  if (verified) return <div className="rounded-2xl bg-green-50 p-4 text-sm text-green-700">✓ 你已经通过画师认证</div>;
  if (pending) return <div className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-700">认证申请正在审核中，审核结果会显示在账号中心。</div>;
  return <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-[#1a1a1a]">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">画师认证</h2><p className="mt-1 text-sm text-stone-500">从已上传作品中选择 3–5 件代表作，无需重复上传图片。</p></div><button type="button" onClick={() => setOpen(!open)} className="btn">{open ? "收起申请" : "开始申请"}</button></div>
    {open && <form onSubmit={submit} className="mt-6 space-y-5">
      {available.length < 3 ? <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-stone-500">请先上传至少 3 件作品，再提交认证申请。</div> : <div><div className="mb-3 flex items-center justify-between"><b>选择代表作品</b><span className={selected.length >= 3 ? "text-green-600" : "text-orange-600"}>已选 {selected.length}/5</span></div><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{available.map(work => <button key={work.id} type="button" onClick={() => toggle(work.id)} className={`relative overflow-hidden rounded-2xl border-2 text-left ${selected.includes(work.id) ? "border-orange-500 ring-2 ring-orange-100" : "border-transparent"}`}><img src={getArtworkThumbnail(work)} alt={work.title} className="aspect-square w-full object-cover"/><span className="block truncate p-2 text-sm">{work.title}</span>{selected.includes(work.id) && <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-orange-500 text-white">✓</span>}</button>)}</div></div>}
      <label className="block text-sm">真实姓名（选填，仅用于认证审核，不公开）<input className="input mt-2" value={realName} onChange={event => setRealName(event.target.value)} maxLength={50}/></label>
      <label className="flex gap-3 rounded-2xl border p-4 text-sm"><input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)}/><span>我确认所选作品为本人手画原创，或已获得合法授权，并愿意对提交内容负责。</span></label>
      {message && <p aria-live="polite" className={`rounded-xl p-3 text-sm ${message.includes("已提交") ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>{message}</p>}
      <button disabled={busy || available.length < 3 || selected.length < 3 || !agreed} className="btn w-full disabled:cursor-not-allowed disabled:opacity-50">{busy ? "正在提交…" : selected.length < 3 ? `还需选择 ${3-selected.length} 件作品` : "提交认证申请"}</button>
    </form>}
  </section>;
}
