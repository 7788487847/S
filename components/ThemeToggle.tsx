"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      aria-label="切换明暗主题"
      title="切换明暗主题"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="grid size-9 place-items-center rounded-full border border-stone-200 bg-white text-base dark:border-stone-700 dark:bg-[#1a1a1a]"
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
}
