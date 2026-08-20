"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const themes = [
  { id: "orange", name: "暖橙", color: "#f97316" },
  { id: "sky", name: "浅蓝", color: "#38bdf8" },
  { id: "blue", name: "深蓝", color: "#2563eb" },
  { id: "pink", name: "柔粉", color: "#ec4899" },
  { id: "blush", name: "浅粉", color: "#fb7185" },
  { id: "mint", name: "薄荷绿", color: "#34d399" },
  { id: "lime", name: "嫩芽绿", color: "#84cc16" },
  { id: "violet", name: "香芋紫", color: "#a78bfa" },
] as const;

const eventName = "lingxi-color-theme-change";
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(eventName, callback);
  };
};
const getSnapshot = () => localStorage.getItem("lingxi-color-theme") || "orange";
const getServerSnapshot = () => "orange";

export default function ColorThemePicker() {
  const [open, setOpen] = useState(false);
  const active = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.setAttribute("data-color-theme", active);
  }, [active]);

  function choose(id: string) {
    localStorage.setItem("lingxi-color-theme", id);
    window.dispatchEvent(new Event(eventName));
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        aria-label="选择主题颜色"
        title="选择主题颜色"
        onClick={() => setOpen(!open)}
        className="grid size-9 place-items-center rounded-full border border-stone-200 bg-white dark:border-stone-700 dark:bg-[#1a1a1a]"
      >
        <span className="size-4 rounded-full bg-[var(--brand)]" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-40 rounded-2xl border bg-white p-2 shadow-xl dark:border-stone-700 dark:bg-[#1a1a1a]">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => choose(theme.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-stone-50 dark:hover:bg-stone-800 ${active === theme.id ? "font-bold" : ""}`}
            >
              <span className="size-4 rounded-full" style={{ background: theme.color }} />
              {theme.name}
              {active === theme.id && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
