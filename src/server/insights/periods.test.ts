import { describe, expect, it } from "vitest";
import {
  parseAnalyticsRange,
  parsePeriod,
  PERIOD_LABELS,
  periodRange,
  rollingRange,
} from "./periods";

const iso = (d?: Date) => d?.toISOString().slice(0, 10);

describe("periods", () => {
  it("parses periods, defaulting to month", () => {
    expect(parsePeriod("week")).toBe("week");
    expect(parsePeriod("all")).toBe("all");
    expect(parsePeriod("decade")).toBe("month");
    expect(parsePeriod(undefined)).toBe("month");
    expect(PERIOD_LABELS.quarter).toBe("This quarter");
  });

  it.each([
    ["2026-09-17T10:00:00Z", "2026-09-14", "2026-09-21"], // Thursday
    ["2026-09-14T00:00:00Z", "2026-09-14", "2026-09-21"], // Monday
    ["2026-09-20T23:59:00Z", "2026-09-14", "2026-09-21"], // Sunday
    ["2026-01-01T12:00:00Z", "2025-12-29", "2026-01-05"], // across a year
  ])("week containing %s is [%s, %s)", (now, start, end) => {
    const range = periodRange("week", new Date(now));
    expect([iso(range.start), iso(range.end)]).toEqual([start, end]);
  });

  it("covers month, quarter and all time", () => {
    const now = new Date("2026-12-17T10:00:00Z");
    expect(periodRange("month", now)).toEqual({
      start: new Date("2026-12-01T00:00:00Z"),
      end: new Date("2027-01-01T00:00:00Z"),
    });
    expect(iso(periodRange("quarter", now).start)).toBe("2026-10-01");
    expect(periodRange("all", now)).toEqual({});
    expect(periodRange("month").start).toBeInstanceOf(Date);
  });

  it("parses analytics ranges, defaulting to 90 days", () => {
    expect(parseAnalyticsRange("30")).toBe(30);
    expect(parseAnalyticsRange(["365"])).toBe(365);
    expect(parseAnalyticsRange("7")).toBe(90);
    expect(parseAnalyticsRange(undefined)).toBe(90);
  });

  it("builds rolling ranges with the previous period", () => {
    const now = new Date("2026-09-17T00:00:00Z");
    expect(rollingRange(30, now)).toEqual({
      current: { start: new Date("2026-08-18T00:00:00Z"), end: now },
      previous: { start: new Date("2026-07-19T00:00:00Z"), end: new Date("2026-08-18T00:00:00Z") },
    });
    expect(rollingRange(1).current.end).toBeInstanceOf(Date);
  });
});
