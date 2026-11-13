"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  // Pana la hidratare nu stim tema (e citita din localStorage de scriptul din <head>).
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Fara localStorage tema tine doar pana la reincarcare.
    }
    setTheme(next);
  };

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Activează modul luminos" : "Activează modul întunecat"}
      title={isDark ? "Mod luminos" : "Mod întunecat"}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-white text-slate-700 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
    >
      {theme === null ? null : isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
