"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ActivationResult = { error?: string; token?: string; user?: unknown };

function Inner() {
  const activationToken = useSearchParams().get("token");
  const router = useRouter();
  const [state, setState] = useState(activationToken ? "正在激活邮箱…" : "激活链接缺少验证信息");
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!activationToken) return;
    const controller = new AbortController();
    fetch("/api/auth/activate", { method: "POST", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: activationToken }), signal: controller.signal }).then(async response => {
      const text = await response.text();
      let result: ActivationResult = {};
      try { result = text ? JSON.parse(text) : {}; } catch {}
      if (!response.ok || !result.token) {
        setState(result.error || "激活失败，请重新发送激活邮件");
        return;
      }
      localStorage.setItem("palette_auth_version", "2");
      localStorage.setItem("palette_token", result.token);
      localStorage.setItem("palette_user", JSON.stringify(result.user || {}));
      dispatchEvent(new Event("palette-auth"));
      setOk(true);
      setState("邮箱激活成功，正在进入账号…");
      window.setTimeout(() => router.replace("/dashboard"), 700);
    }).catch(error => { if (error?.name !== "AbortError") setState("网络连接失败，请稍后重试"); });
    return () => controller.abort();
  }, [activationToken, router]);
  return <div className="text-center"><div className="mx-auto grid size-16 place-items-center rounded-full bg-orange-100 text-3xl">✦</div><h1 className="mt-5 text-2xl font-bold">{state}</h1>{!ok && <Link href="/register" className="btn mt-7 inline-block">返回注册页</Link>}</div>;
}

export default function Activate() { return <main className="grid min-h-screen place-items-center px-5"><Suspense><Inner/></Suspense></main>; }
