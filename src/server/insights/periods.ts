import { quarterBounds } from "../shoutouts/quarter";

export const LEADERBOARD_PERIODS = ["week", "month", "quarter", "all"] as const;
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

export interface DateRange {
  /** Inclusive; undefined means "from the beginning". */
  start?: Date;
  /** Exclusive; undefined means "until now". */
  end?: Date;
}

export const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  week: "This week",
  month: "This month",
  quarter: "This quarter",
  all: "All time",
};

export function parsePeriod(value: unknown): LeaderboardPeriod {
  return (LEADERBOARD_PERIODS as readonly unknown[]).includes(value)
    ? (value as LeaderboardPeriod)
    : "month";
}

/** Calendar periods in UTC; weeks start on Monday. */
export function periodRange(period: LeaderboardPeriod, now = new Date()): DateRange {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  switch (period) {
    case "week": {
      const daysSinceMonday = (now.getUTCDay() + 6) % 7;
      return {
        start: new Date(Date.UTC(year, month, day - daysSinceMonday)),
        end: new Date(Date.UTC(year, month, day - daysSinceMonday + 7)),
      };
    }
    case "month":
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month + 1, 1)),
      };
    case "quarter":
      return quarterBounds(now);
    case "all":
      return {};
  }
}

export const ANALYTICS_RANGES = [30, 90, 365] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export function parseAnalyticsRange(value: unknown): AnalyticsRange {
  const days = Number(value);
  return (ANALYTICS_RANGES as readonly number[]).includes(days) ? (days as AnalyticsRange) : 90;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The last `days` days up to now, and the equally long period before it. */
export function rollingRange(
  days: number,
  now = new Date(),
): { current: Required<DateRange>; previous: Required<DateRange> } {
  const start = new Date(now.getTime() - days * DAY_MS);
  return {
    current: { start, end: now },
    previous: { start: new Date(start.getTime() - days * DAY_MS), end: start },
  };
}
