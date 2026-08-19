"use client";

import { useEffect, useState } from "react";
import ProfileEditor from "./ProfileEditor";
import ArtworkList, { Work } from "./ArtworkList";

type Profile = Record<string, unknown> & {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  commissionStatus?: number;
};

type ProfileResponse = { user: Profile; artworks: Work[] };

export default function ArtistDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("palette_token") || "";
    if (!token) return;
    fetch("/api/profile", { headers: { authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() as Promise<ProfileResponse> : null)
      .then(result => {
        if (!result) return;
        setProfile(result.user);
        setWorks(result.artworks);
      })
      .catch(() => setMessage("资料加载失败，请稍后重试"));
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    const token = localStorage.getItem("palette_token") || "";
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(profile),
    });
    const result = await response.json();
    setMessage(result.message || result.error || "资料保存失败");
  }

  if (!profile) return <p className="p-20 text-center">正在加载画师工作台…</p>;
  return <>
    <div className="flex flex-wrap justify-between gap-4">
      <div><h1 className="text-3xl font-bold">你好，{String(profile.displayName || "画师")}</h1><p className="mt-2 text-stone-500">画师工作台</p></div>
    </div>
    {message && <p className="mt-5 rounded-xl bg-orange-100 p-3 text-orange-800">{message}</p>}
    <section className="py-8"><ArtworkList works={works} /></section>
    <ProfileEditor profile={profile} onChange={setProfile} onSave={save} />
  </>;
}
