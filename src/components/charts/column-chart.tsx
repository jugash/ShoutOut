"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { niceMax } from "./scale";

export interface ColumnPoint {
  /** Full label for tooltips and the table, e.g. "Week of 1 Sep". */
  label: string;
  /** Short axis label, e.g. "1 Sep". */
  tick: string;
  value: number;
}

/** Single-series column chart with hover/focus tooltips and a table view. */
export function ColumnChart({
  points,
  unit,
  title,
}: {
  points: ColumnPoint[];
  /** Plural unit for values, e.g. "shoutouts". */
  unit: string;
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const top = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const ticks = [top, top / 2, 0];
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <figure className="space-y-3">
      <div className="flex gap-2">
        <div
          className="relative h-48 w-8 shrink-0 text-right text-xs text-muted tabular-nums"
          aria-hidden
        >
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${100 - (tick / top) * 100}%` }}
            >
              {Number.isInteger(tick) ? tick : tick.toFixed(1)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-48">
            {ticks.map((tick) => (
              <div
                key={tick}
                aria-hidden
                className="absolute inset-x-0 border-t border-border"
                style={{ top: `${100 - (tick / top) * 100}%` }}
              />
            ))}
            <div
              className="absolute inset-0 flex items-end gap-[2px]"
              role="list"
              aria-label={title}
            >
              {points.map((point, index) => (
                <div
                  key={point.label}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${point.label}: ${point.value} ${unit}`}
                  onPointerEnter={() => setActive(index)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  className="relative flex h-full flex-1 items-end justify-center outline-none focus-visible:bg-surface-muted"
                >
                  <div
                    className={cn(
                      "w-full max-w-6 rounded-t-[4px] bg-chart-mark transition-opacity",
                      active === index && "opacity-80",
                    )}
                    style={{ height: `${(point.value / top) * 100}%` }}
                  />
                  {active === index && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full z-10 mb-2 rounded-xl border-2 border-border bg-surface px-3 py-2 text-center whitespace-nowrap shadow-card"
                    >
                      <span className="block font-bold">
                        {point.value} {unit}
                      </span>
                      <span className="block text-xs text-muted">{point.label}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1 flex gap-[2px] text-xs text-muted" aria-hidden>
            {points.map((point, index) => (
              <span key={point.label} className="flex-1 truncate text-center">
                {index % labelEvery === 0 ? point.tick : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-bold text-muted">View as table</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-muted">
              <th className="py-1 font-bold">Period</th>
              <th className="py-1 text-right font-bold capitalize">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.label} className="border-t border-border">
                <td className="py-1">{point.label}</td>
                <td className="py-1 text-right tabular-nums">{point.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
