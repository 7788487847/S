"use client";

import { useEffect } from "react";

const AUTH_VERSION = "2";
const clearAuth = () => {
  localStorage.removeItem("palette_token");
  localStorage.removeItem("palette_user");
  localStorage.setItem("palette_auth_version", AUTH_VERSION);
  dispatchEvent(new Event("palette-auth"));
};

export default function AuthStateGuard() {
  useEffect(() => {
    const token = localStorage.getItem("palette_token");
    const version = localStorage.getItem("palette_auth_version");
    if (version !== AUTH_VERSION) {
      clearAuth();
      return;
    }
    if (!token) return;
    const controller = new AbortController();
    fetch("/api/auth/session", {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then(async response => {
      if (response.status === 401 || response.status === 403) return clearAuth();
      if (!response.ok) return;
      const result = await response.json();
      if (result.user) localStorage.setItem("palette_user", JSON.stringify(result.user));
      dispatchEvent(new Event("palette-auth"));
    }).catch(() => undefined);
    return () => controller.abort();
  }, []);
  return null;
}
