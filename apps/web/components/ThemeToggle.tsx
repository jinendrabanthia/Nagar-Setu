"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, mounted } = useTheme();
  const active = mounted ? theme : "light";

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex items-center rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-0.5 shadow-xs"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={active === "light"}
        aria-label="Porcelain Light theme"
        title="Porcelain Light"
        className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
          active === "light"
            ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`}
      >
        <Sun className="h-3.5 w-3.5" aria-hidden="true" />
        {!compact && <span className="hidden sm:inline">Porcelain</span>}
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={active === "dark"}
        aria-label="Graphite Dark theme"
        title="Graphite Dark"
        className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
          active === "dark"
            ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs"
            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        }`}
      >
        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
        {!compact && <span className="hidden sm:inline">Graphite</span>}
      </button>
    </div>
  );
}
