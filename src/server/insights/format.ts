/** Whole-number percentage, 0 when the whole is 0. Safe to use in client components. */
export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}
