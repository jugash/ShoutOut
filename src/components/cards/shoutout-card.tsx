import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { TONE_CLASSES, type CardDesign } from "./designs";
import { CardIllustration } from "./illustrations";

export interface ShoutoutCardProps {
  design: CardDesign;
  message: string;
  from: string;
  to: string[];
  value?: string;
  className?: string;
  /** Shown next to the recipients, e.g. time and privacy. */
  meta?: ReactNode;
  /** Shown under the card body, e.g. edit/delete buttons. */
  actions?: ReactNode;
  /** "horizontal" puts the artwork beside the message on wider screens (used in the feed). */
  layout?: "stacked" | "horizontal";
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function ShoutoutCard({
  design,
  message,
  from,
  to,
  value,
  className,
  meta,
  actions,
  layout = "stacked",
}: ShoutoutCardProps) {
  const horizontal = layout === "horizontal";
  const tone = TONE_CLASSES[design.tone];
  return (
    <article
      aria-label={`${design.title} from ${from} to ${joinNames(to)}`}
      className={cn(
        "overflow-hidden rounded-[var(--radius-card)] border-2 border-border bg-surface shadow-card",
        horizontal && "sm:flex",
        className,
      )}
    >
      <div
        className={cn(
          "relative px-6 pt-5 pb-2",
          horizontal && "sm:flex sm:w-52 sm:shrink-0 sm:flex-col sm:justify-center sm:pb-5",
          tone.soft,
        )}
      >
        <p className={cn("font-display text-2xl font-semibold", tone.strong)}>{design.title}</p>
        <CardIllustration
          name={design.illustration}
          className={cn("mx-auto h-32 w-auto", horizontal && "sm:h-28")}
        />
      </div>
      <div className={cn("space-y-4 p-6", horizontal && "sm:min-w-0 sm:flex-1")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            To <span className="font-bold text-foreground">{joinNames(to)}</span>
          </p>
          {meta}
        </div>
        <p className="text-lg leading-relaxed break-words whitespace-pre-line">{message}</p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Avatar name={from} size="sm" />
            <span className="text-sm">
              <span className="text-muted">From </span>
              <span className="font-bold">{from}</span>
            </span>
          </div>
          {value && (
            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-muted">
              #{value}
            </span>
          )}
        </div>
        {actions}
      </div>
    </article>
  );
}

export { joinNames };
