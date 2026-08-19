"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/Header";

type Role = "artist" | "seeker";

export default function Page() {
  const [form, setForm] = useState<{
    displayName: string;
    email: string;
    password: string;
    consent: boolean;
    age14Confirmed: boolean;
    adultConfirmed: boolean;
    role: Role | "";
  }>({
    displayName: "",
    email: "",
    password: "",
    consent: false,
    age14Confirmed: false,
    adultConfirmed: false,
    role: "",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (values: Partial<typeof form>) =>
    setForm((current) => ({ ...current, ...values }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.role) {
      setMessage("请选择你的身份");
      return;
    }
    setBusy(true);
    try {
      // 1. 调用注册接口，创建账号并生成激活链接
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const text = await response.text();
      const result: {
        message?: string;
        error?: string;
        activationUrl?: string;
      } = text ? JSON.parse(text) : {};

      // 注册失败，直接提示错误
      if (!response.ok || result.error) {
        setMessage(result.message || result.error || "注册失败，请稍后再试");
        return;
      }

      // 2. 注册成功，调用发邮件接口发送激活邮件
      if (result.activationUrl) {
        try {
          const emailRes = await fetch("/api/send-activate-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: form.email,
              nickname: form.displayName,
              activateLink: result.activationUrl,
            }),
          });
          const emailResult = await emailRes.json();
          if (emailResult.success) {
            setMessage("注册成功，激活邮件已发送到你的邮箱，请查收");
          } else {
            setMessage(
              `注册成功，但邮件发送失败：${
                emailResult.message || "未知错误"
              }，你可以点击下方按钮重新发送`
            );
          }
        } catch {
          setMessage("注册成功，但邮件发送失败，请点击下方按钮重新发送");
        }
      } else {
        setMessage(result.message || "注册成功");
      }
    } catch {
      setMessage("注册失败，请检查网络后重试");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/resend-activation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const result = await response.json();
      setMessage(result.message || result.error || "发送失败");
    } catch {
      setMessage("发送失败，请检查网络后重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="grid min-h-[75vh] place-items-center p-5">
        <form
          onSubmit={submit}
          className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-8 shadow dark:bg-[#1a1a1a]"
        >
          <h1 className="text-3xl font-bold">加入灵犀</h1>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                role: "artist" as const,
                icon: "🎨",
                title: "我是画师",
                text: "手画作品发布、认证与接稿",
              },
              {
                role: "seeker" as const,
                icon: "🔍",
                title: "我是寻光者",
                text: "来找灵感 / 约稿",
              },
            ].map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => update({ role: item.role })}
                className={`rounded-2xl border-2 p-4 text-left ${
                  form.role === item.role
                    ? "border-[var(--brand)] brand-soft"
                    : "border-stone-200"
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <b className="mt-2 block">{item.title}</b>
                <small className="text-stone-500">{item.text}</small>
              </button>
            ))}
          </div>

          {form.role === "artist" && (
            <p className="rounded-2xl bg-orange-50 p-3 text-sm text-orange-800">
              画师可发布手画作品、申请认证并自主开启约稿状态。
            </p>
          )}

          <input
            required
            className="input"
            placeholder="昵称"
            value={form.displayName}
            onChange={(e) => update({ displayName: e.target.value })}
          />
          <input
            required
            className="input"
            type="email"
            placeholder="邮箱"
            value={form.email}
            onChange={(e) => update({ email: e.target.value })}
          />
          <input
            required
            className="input"
            type="password"
            minLength={8}
            placeholder="密码，至少8位"
            value={form.password}
            onChange={(e) => update({ password: e.target.value })}
          />

          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.age14Confirmed}
              onChange={(e) => update({ age14Confirmed: e.target.checked })}
            />
            我已满14周岁
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.adultConfirmed}
              onChange={(e) => update({ adultConfirmed: e.target.checked })}
            />
            我已阅读并同意用户协议和隐私政策
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => update({ consent: e.target.checked })}
            />
            同意接收相关通知邮件
          </label>

          <button
            type="submit"
            disabled={busy}
            className="btn w-full"
          >
            {busy ? "处理中..." : "注册并发送激活邮件"}
          </button>
          <button
            type="button"
            disabled={busy || !form.email}
            onClick={resend}
            className="w-full text-sm brand-text disabled:opacity-50"
          >
            没有收到邮件？重新发送激活邮件
          </button>

          {message && (
            <p className="break-all text-center text-sm">{message}</p>
          )}
        </form>
      </main>
    </>
  );
}