import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const redirect = vi.fn(() => {
  throw new Error("NEXT_REDIRECT");
});
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
const getSummary = vi.fn();
const getTrend = vi.fn();
const getValueBreakdown = vi.fn();
const getCardBreakdown = vi.fn();
const getUnrecognised = vi.fn();
const ColumnChart = vi.fn((props: { title: string; points: { label: string; tick: string }[] }) => (
  <figure aria-label={props.title} />
));

vi.mock("@/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect, notFound }));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@/server/insights/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/insights/analytics")>()),
  getSummary,
  getTrend,
  getValueBreakdown,
  getCardBreakdown,
  getUnrecognised,
}));
vi.mock("@/components/layout/app-header", () => ({ AppHeader: () => <header /> }));
vi.mock("@/components/charts/column-chart", () => ({ ColumnChart }));
vi.mock("@/components/charts/bar-list", () => ({
  BarList: ({ title }: { title: string }) => <ul aria-label={title} />,
}));

const { default: AnalyticsPage, metadata } = await import("./page");
const props = (days?: string) =>
  ({
    params: Promise.resolve({}),
    searchParams: Promise.resolve(days ? { days } : {}),
  }) as PageProps<"/analytics">;
const admin = { id: "u1", roles: ["shoutout-admin"] };
const member = { id: "u2", roles: ["shoutout-user"] };

describe("AnalyticsPage", () => {
  beforeEach(() => {
    auth.mockResolvedValue({ user: admin });
    getSummary
      .mockResolvedValueOnce({
        shoutouts: 12,
        recognitions: 15,
        activePeople: 8,
        givers: 6,
        receivers: 4,
      })
      .mockResolvedValueOnce({
        shoutouts: 10,
        recognitions: 0,
        activePeople: 8,
        givers: 1,
        receivers: 1,
      });
    getTrend.mockResolvedValue([{ start: new Date("2026-09-14T00:00:00Z"), count: 3 }]);
    getValueBreakdown.mockResolvedValue([]);
    getCardBreakdown.mockResolvedValue([]);
    getUnrecognised.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    getSummary.mockReset();
  });

  it("redirects anonymous visitors", async () => {
    auth.mockResolvedValue(null);
    await expect(AnalyticsPage(props())).rejects.toThrow("NEXT_REDIRECT");
  });

  it("is hidden from non-admins by default and visible when configured for everyone", async () => {
    auth.mockResolvedValue({ user: member });
    await expect(AnalyticsPage(props())).rejects.toThrow("NEXT_NOT_FOUND");

    vi.stubEnv("SHOUTOUT_ANALYTICS_VISIBILITY", "everyone");
    render(await AnalyticsPage(props()));
    expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument();
    // The "not recognised" list stays admin-only.
    expect(
      screen.queryByRole("heading", { name: "Not recognised recently" }),
    ).not.toBeInTheDocument();
    expect(getUnrecognised).not.toHaveBeenCalled();
  });

  it("shows stats, weekly trend and breakdowns for admins", async () => {
    render(await AnalyticsPage(props()));
    expect(metadata.title).toBe("Analytics");
    expect(screen.getByRole("link", { name: "Last 90 days" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Shoutouts sent").parentElement).toHaveTextContent(
      "12▲ +20% vs previous period",
    );
    expect(screen.getByText("People recognised").parentElement).toHaveTextContent(
      "No earlier data",
    );
    expect(screen.getByText("Giving recognition").parentElement).toHaveTextContent(
      "75%6 of 8 people sent one",
    );
    expect(screen.getByText("Received recognition").parentElement).toHaveTextContent("50%");
    expect(screen.getByRole("heading", { name: "Shoutouts per week" })).toBeInTheDocument();
    expect(ColumnChart.mock.calls[0][0].points).toEqual([
      { label: "Week of 14 Sep", tick: "14 Sep", value: 3 },
    ]);
    expect(getTrend.mock.calls[0][2]).toBe("week");
    expect(screen.getByRole("list", { name: "Shoutouts per company value" })).toBeInTheDocument();
    expect(screen.getByText(/Everyone has been recognised/)).toBeInTheDocument();
  });

  it("uses monthly buckets for a year and lists people waiting for recognition", async () => {
    getTrend.mockResolvedValue([{ start: new Date("2026-09-01T00:00:00Z"), count: 3 }]);
    getUnrecognised.mockResolvedValue([
      { id: "u5", name: "Erin Evans", email: "e@x", lastRecognisedAt: null },
      {
        id: "u6",
        name: "Frank Fischer",
        email: "f@x",
        lastRecognisedAt: new Date(Date.now() - 3 * 86_400_000),
      },
    ]);
    render(await AnalyticsPage(props("365")));
    expect(getTrend.mock.calls[0][2]).toBe("month");
    expect(ColumnChart.mock.calls[0][0].points[0]).toMatchObject({ label: "Sep 26" });
    expect(screen.getByRole("heading", { name: "Shoutouts per month" })).toBeInTheDocument();
    expect(screen.getByText("Calendar months (UTC)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Erin Evans/ })).toHaveTextContent("Never recognised");
    expect(screen.getByRole("link", { name: /Frank Fischer/ })).toHaveTextContent(
      "Last recognised 3d ago",
    );
  });
});
