import { formatDayMonth } from "@/lib/format";
import { cn } from "@/lib/cn";

export function BudgetMeter({
  allowance,
  remaining,
  resetsAt,
  className,
}: {
  allowance: number;
  remaining: number;
  resetsAt: Date;
  className?: string;
}) {
  const percent = allowance === 0 ? 0 : Math.round((remaining / allowance) * 100);
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold">
          <span className="font-display text-2xl">{remaining}</span>
          <span className="text-muted"> of {allowance} shoutouts left</span>
        </p>
        <p className="text-sm text-muted">Resets {formatDayMonth(resetsAt)}</p>
      </div>
      <div
        role="progressbar"
        aria-label="Shoutouts left this quarter"
        aria-valuemin={0}
        aria-valuemax={allowance}
        aria-valuenow={remaining}
        className="h-3 overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className={cn("h-full rounded-full", remaining === 0 ? "bg-coral" : "bg-sunny")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
