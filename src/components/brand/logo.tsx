import { cn } from "@/lib/cn";
import { WORDMARK_OUT, WORDMARK_SHOUT } from "./wordmark-paths";

const line = { stroke: "var(--line)", strokeLinejoin: "round", strokeLinecap: "round" } as const;

/** The megaphone mark, drawn in a 64x64 box. */
export function MarkShapes() {
  return (
    <>
      <g transform="rotate(-14 30 34)">
        <path
          d="M22 40L25.5 51.5Q26.5 54.5 29.5 53.5L31 53Q34 52 33 49L30.5 41.5"
          fill="var(--teal)"
          strokeWidth={2.6}
          {...line}
        />
        <rect
          x={7}
          y={25}
          width={12}
          height={16}
          rx={4}
          fill="var(--teal)"
          strokeWidth={2.6}
          {...line}
        />
        <path
          d="M18 26L40 14.5Q44 12.5 44 17V49Q44 53.5 40 51.5L18 40Z"
          fill="var(--sunny)"
          strokeWidth={2.6}
          {...line}
        />
        <ellipse
          cx={44}
          cy={33}
          rx={4.2}
          ry={16.5}
          fill="var(--sunny-soft)"
          strokeWidth={2.6}
          {...line}
        />
      </g>
      <path
        d="M55 14.5C55 11.5 51 10.5 50 13.5C49 10.5 45 11.5 45 14.5C45 17.5 50 20.5 50 20.5C50 20.5 55 17.5 55 14.5Z"
        fill="var(--coral)"
        strokeWidth={2}
        {...line}
      />
      <path
        d="M55 29L61 27M54.5 38L60.5 40.5"
        stroke="var(--foreground)"
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </>
  );
}

export function Logo({
  variant = "full",
  className,
  title = "ShoutOut",
}: {
  variant?: "full" | "mark";
  className?: string;
  title?: string;
}) {
  const full = variant === "full";
  return (
    <svg
      viewBox={full ? "0 0 282 64" : "0 0 64 64"}
      role="img"
      aria-label={title}
      className={cn(full ? "h-9 w-auto" : "size-10", className)}
    >
      <MarkShapes />
      {full && (
        <g transform="translate(74 8.8)">
          <path fill="var(--foreground)" d={WORDMARK_SHOUT} />
          <path fill="var(--teal)" d={WORDMARK_OUT} />
        </g>
      )}
    </svg>
  );
}
