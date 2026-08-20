"use client";

import { useEffect, useState } from "react";
import ArtistDashboardPage from "./artist/page";
import SeekerDashboardPage from "./seeker/page";

type Role = "artist" | "seeker";

export default function DashboardPage() {
  const [role, setRole] = useState<Role | "loading">("loading");
  useEffect(() => {
    let savedRole: Role | undefined;
    try { savedRole = JSON.parse(localStorage.getItem("palette_user") || "{}").role; } catch {}
    if (savedRole === "artist" || savedRole === "seeker") {
      const timer = window.setTimeout(() => setRole(savedRole as Role), 0);
      return () => window.clearTimeout(timer);
    }
    const token = localStorage.getItem("palette_token") || "";
    if (!token) { location.replace("/login"); return; }
    const controller = new AbortController();
    fetch("/api/auth/session", { cache: "no-store", headers: { authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(result => {
        const current = result?.user?.role;
        if (current === "artist" || current === "seeker") setRole(current);
        else location.replace("/login");
      }).catch(error => { if (error?.name !== "AbortError") location.replace("/login"); });
    return () => controller.abort();
  }, []);
  if (role === "loading") return <p className="p-20 text-center">正在进入账号中心…</p>;
  return role === "artist" ? <ArtistDashboardPage/> : <SeekerDashboardPage/>;
}
