"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { percent } from "@/server/insights/format";

export interface BarItem {
  id: string;
  name: string;
  count: number;
}

/** Horizontal single-series bars with the value at the tip and share on hover/focus. */
export function BarList({ items, unit, title }: { items: BarItem[]; unit: string; title: string }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(0, ...items.map((item) => item.count));
  const total = items.reduce((sum, item) => sum + item.count, 0);

  if (items.length === 0) {
    return <p className="text-muted">No data yet.</p>;
  }

  return (
    <ul className="space-y-2" aria-label={title}>
      {items.map((item) => (
        <li
          key={item.id}
          tabIndex={0}
          aria-label={`${item.name}: ${item.count} ${unit}, ${percent(item.count, total)}%`}
          onPointerEnter={() => setActive(item.id)}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(item.id)}
          onBlur={() => setActive(null)}
          className="relative grid grid-cols-[minmax(0,8rem)_1fr] items-center gap-3 rounded-lg outline-none focus-visible:bg-surface-muted"
        >
          <span className="truncate text-sm font-bold">{item.name}</span>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "h-5 rounded-r-[4px] bg-chart-mark transition-opacity",
                active === item.id && "opacity-80",
              )}
              style={{ width: max === 0 ? 0 : `${(item.count / max) * 85}%` }}
            />
            <span className="text-sm tabular-nums">{item.count}</span>
          </span>
          {active === item.id && (
            <span
              role="tooltip"
              className="pointer-events-none absolute right-0 bottom-full z-10 mb-1 rounded-xl border-2 border-border bg-surface px-3 py-1.5 text-sm whitespace-nowrap shadow-card"
            >
              <span className="font-bold">
                {item.count} {unit}
              </span>{" "}
              <span className="text-muted">
                · {percent(item.count, total)}% of {total}
              </span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
