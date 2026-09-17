/** A round axis maximum at or above `max`: 1, 2, 2.5, 5 or 10 times a power of ten. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= max)!;
  return step * magnitude;
}

const COMPACT_UNITS = [
  { size: 1e9, suffix: "B" },
  { size: 1e6, suffix: "M" },
  { size: 1e3, suffix: "K" },
] as const;

/**
 * Compact number for tiles: 1,284 / 12.9K / 4.2M. Done by hand because ICU's
 * compact notation differs between Node builds ("12.9K" vs "12.9k").
 */
export function compactNumber(value: number): string {
  if (Math.abs(value) < 10_000) return value.toLocaleString("en-GB");
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const index = COMPACT_UNITS.findIndex(({ size }) => abs >= size);
  const rounded = Math.round((abs / COMPACT_UNITS[index].size) * 10) / 10;
  // 999,960 would round to "1000K"; show "1M" instead.
  if (rounded >= 1000 && index > 0) {
    return `${sign}${rounded / 1000}${COMPACT_UNITS[index - 1].suffix}`;
  }
  return `${sign}${rounded}${COMPACT_UNITS[index].suffix}`;
}
