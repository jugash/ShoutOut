import { describe, expect, it } from "vitest";
import { quarterBounds } from "./quarter";

describe("quarterBounds", () => {
  it.each([
    ["2026-01-01T00:00:00Z", "2026-01-01", "2026-04-01"],
    ["2026-03-31T23:59:59Z", "2026-01-01", "2026-04-01"],
    ["2026-09-17T10:00:00Z", "2026-07-01", "2026-10-01"],
    ["2026-12-31T23:59:59Z", "2026-10-01", "2027-01-01"],
  ])("%s is in [%s, %s)", (now, start, end) => {
    const bounds = quarterBounds(new Date(now));
    expect(bounds.start.toISOString().slice(0, 10)).toBe(start);
    expect(bounds.end.toISOString().slice(0, 10)).toBe(end);
  });
});
