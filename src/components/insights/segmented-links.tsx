import Link from "next/link";
import { cn } from "@/lib/cn";

/** A row of mutually exclusive filter links (e.g. time periods). */
export function SegmentedLinks({
  label,
  options,
  current,
}: {
  label: string;
  options: { value: string; label: string; href: string }[];
  current: string;
}) {
  return (
    <nav
      aria-label={label}
      className="inline-flex flex-wrap gap-1 rounded-full border-2 border-border bg-surface p-1"
    >
      {options.map((option) => (
        <Link
          key={option.value}
          href={option.href}
          aria-current={option.value === current ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-bold transition",
            option.value === current
              ? "bg-sunny text-on-sunny"
              : "text-muted hover:text-foreground",
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
