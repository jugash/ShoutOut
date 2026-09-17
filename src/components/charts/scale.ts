/** A round axis maximum at or above `max`: 1, 2, 2.5, 5 or 10 times a power of ten. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= max)!;
  return step * magnitude;
}

/** Compact number for tiles: 1,284 / 12.9K / 4.2M. */
export function compactNumber(value: number): string {
  if (Math.abs(value) < 10_000) return value.toLocaleString("en-GB");
  return new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}
