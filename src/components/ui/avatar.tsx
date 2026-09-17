import { cn } from "@/lib/cn";

const AVATAR_TONES = [
  "bg-coral-soft text-coral-strong",
  "bg-lilac-soft text-lilac-strong",
  "bg-teal-soft text-teal-strong",
  "bg-sunny-soft text-on-sunny dark:text-sunny",
  "bg-sky-soft text-sky-strong",
  "bg-leaf-soft text-leaf-strong",
];

export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Stable colour per person so avatars are recognisable at a glance. */
export function avatarTone(name: string | null | undefined): string {
  let hash = 0;
  for (const char of name ?? "") {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

const SIZES = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" } as const;

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={name ?? "Unknown person"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold",
        avatarTone(name),
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
