import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const redirect = vi.fn(() => {
  throw new Error("NEXT_REDIRECT");
});
const topRecipients = vi.fn();
const topSenders = vi.fn();
const topValues = vi.fn();
const LeaderboardBoard = vi.fn((props: { title: string; viewerId?: string; people?: boolean }) => (
  <section aria-label={props.title} />
));

vi.mock("@/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@/server/insights/leaderboard", () => ({ topRecipients, topSenders, topValues }));
vi.mock("@/components/layout/app-header", () => ({ AppHeader: () => <header /> }));
vi.mock("@/components/insights/leaderboard-board", () => ({ LeaderboardBoard }));

const { default: LeaderboardPage, metadata } = await import("./page");
const props = (period?: string) =>
  ({
    params: Promise.resolve({}),
    searchParams: Promise.resolve(period ? { period } : {}),
  }) as PageProps<"/leaderboard">;
const empty = { entries: [], viewer: null, max: 0 };

describe("LeaderboardPage", () => {
  beforeEach(() => {
    auth.mockResolvedValue({ user: { id: "u1", roles: [] } });
    for (const fn of [topRecipients, topSenders, topValues]) fn.mockResolvedValue(empty);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects anonymous visitors", async () => {
    auth.mockResolvedValue(null);
    await expect(LeaderboardPage(props())).rejects.toThrow("NEXT_REDIRECT");
  });

  it("defaults to this month and shows the three boards", async () => {
    render(await LeaderboardPage(props()));
    expect(metadata.title).toBe("Leaderboard");
    expect(screen.getByRole("link", { name: "This month" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(LeaderboardBoard.mock.calls.map((c) => c[0].title)).toEqual([
      "Most recognised",
      "Top recognisers",
      "Top values",
    ]);
    expect(LeaderboardBoard.mock.calls[0][0].viewerId).toBe("u1");
    expect(LeaderboardBoard.mock.calls[2][0].people).toBe(false);
    const [, range, limit, viewer] = topRecipients.mock.calls[0];
    expect(range.start).toBeInstanceOf(Date);
    expect([limit, viewer]).toEqual([10, "u1"]);
  });

  it("uses the chosen period", async () => {
    render(await LeaderboardPage(props("all")));
    expect(screen.getByRole("link", { name: "All time" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "This week" })).toHaveAttribute(
      "href",
      "/leaderboard?period=week",
    );
    expect(topValues).toHaveBeenCalledWith({}, {});
  });
});
