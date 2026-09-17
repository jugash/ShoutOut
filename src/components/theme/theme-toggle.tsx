"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { applyThemePreference, THEME_PREFERENCES, type ThemePreference } from "@/lib/theme";

const LABELS: Record<ThemePreference, string> = {
  system: "Match system theme",
  light: "Light theme",
  dark: "Dark theme",
};

function ThemeIcon({ preference }: { preference: ThemePreference }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      {preference === "light" && (
        <>
          <circle cx={12} cy={12} r={4} {...common} />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            {...common}
          />
        </>
      )}
      {preference === "dark" && (
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" {...common} />
      )}
      {preference === "system" && (
        <>
          <rect x={3} y={4} width={18} height={12} rx={2} {...common} />
          <path d="M8 20h8M12 16v4" {...common} />
        </>
      )}
    </svg>
  );
}

export function ThemeToggle({ initial }: { initial: ThemePreference }) {
  const [preference, setPreference] = useState<ThemePreference>(initial);

  function choose(next: ThemePreference) {
    setPreference(next);
    applyThemePreference(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-full border-2 border-border bg-surface p-0.5"
    >
      {THEME_PREFERENCES.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={preference === option}
          aria-label={LABELS[option]}
          title={LABELS[option]}
          onClick={() => choose(option)}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-full transition",
            preference === option ? "bg-sunny text-on-sunny" : "text-muted hover:text-foreground",
          )}
        >
          <ThemeIcon preference={option} />
        </button>
      ))}
    </div>
  );
}
