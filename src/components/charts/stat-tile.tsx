import { cn } from "@/lib/cn";
import { compactNumber } from "./scale";

export function StatTile({
  label,
  value,
  suffix,
  change,
  changeLabel = "vs previous period",
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  /** Percentage change; null when there is nothing to compare. */
  change?: number | null;
  changeLabel?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-border bg-surface p-5">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="mt-1 text-4xl font-bold">
        {compactNumber(value)}
        {suffix && <span className="text-2xl text-muted">{suffix}</span>}
      </p>
      {change !== undefined && (
        <p className="mt-1 text-sm">
          {change === null ? (
            <span className="text-muted">No earlier data</span>
          ) : (
            <>
              <span
                className={cn(
                  "font-bold",
                  change > 0 && "text-leaf-strong",
                  change < 0 && "text-coral-strong",
                  change === 0 && "text-muted",
                )}
              >
                <span aria-hidden>{change > 0 ? "▲ " : change < 0 ? "▼ " : ""}</span>
                {change > 0 ? "+" : ""}
                {change}%
              </span>{" "}
              <span className="text-muted">{changeLabel}</span>
            </>
          )}
        </p>
      )}
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}
