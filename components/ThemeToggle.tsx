"use client";

import { Icon } from "./icons";
import { THEME_KEY } from "@/lib/theme";

// Icons swap via the `dark:` variant, so the server and client render identical
// markup and the correct icon shows before hydration (no mismatch, no flicker).
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark");
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {}
  };

  return (
    <button type="button" onClick={toggle} className={`btn-ghost !px-2 ${className}`} aria-label="Toggle light/dark theme" title="Toggle theme">
      <Icon name="moon" className="size-5 dark:hidden" />
      <Icon name="sun" className="hidden size-5 dark:block" />
    </button>
  );
}
