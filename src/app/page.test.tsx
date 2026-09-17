import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedItem } from "@/server/shoutouts/feed";

const auth = vi.fn();
const redirect = vi.fn(() => {
  throw new Error("NEXT_REDIRECT");
});
const getBudget = vi.fn();
const listFeed = vi.fn();

vi.mock("@/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@/server/shoutouts/budget", () => ({ getBudget }));
vi.mock("@/server/shoutouts/feed", () => ({ listFeed }));
vi.mock("@/components/layout/app-header", () => ({
  AppHeader: ({ user }: { user: { name?: string } }) => <header>header for {user.name}</header>,
}));
vi.mock("@/components/shoutouts/feed-item", () => ({
  FeedItemCard: ({ item }: { item: FeedItem }) => <article>{item.message}</article>,
}));

const { default: HomePage } = await import("./page");

const bob = { id: "u1", name: "Bob Baker", email: "bob@example.com", roles: [] };
const props = (params: Record<string, string | string[]> = {}) =>
  ({ params: Promise.resolve({}), searchParams: Promise.resolve(params) }) as PageProps<"/">;
const budget = (remaining: number) => ({
  allowance: 20,
  used: 20 - remaining,
  remaining,
  resetsAt: new Date("2026-10-01T00:00:00Z"),
});

describe("HomePage", () => {
  beforeEach(() => {
    auth.mockResolvedValue({ user: bob });
    getBudget.mockResolvedValue(budget(17));
    listFeed.mockResolvedValue({ items: [], nextCursor: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects anonymous visitors to sign in", async () => {
    auth.mockResolvedValue(null);
    await expect(HomePage(props())).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("greets the user, shows the budget and an empty feed", async () => {
    render(await HomePage(props()));
    expect(screen.getByRole("heading", { name: /hi bob/i })).toBeInTheDocument();
    expect(screen.getByText("header for Bob Baker")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Send a shoutout" })).toHaveAttribute(
      "href",
      "/shoutouts/new",
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "17");
    expect(screen.getByText(/be the first to say thanks/i)).toBeInTheDocument();
    expect(listFeed).toHaveBeenCalledWith({}, "u1", expect.objectContaining({ cursor: undefined }));
  });

  it("lists shoutouts with a link to older ones and shows notices", async () => {
    listFeed.mockResolvedValue({
      items: [
        { id: "s1", message: "Great work" },
        { id: "s2", message: "Thanks!" },
      ],
      nextCursor: "s2",
    });
    render(await HomePage(props({ notice: "sent" })));
    expect(screen.getByRole("status")).toHaveTextContent("Shoutout sent!");
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Show older shoutouts" })).toHaveAttribute(
      "href",
      "/?cursor=s2",
    );
  });

  it("pages with a cursor and handles the end of the feed", async () => {
    render(await HomePage(props({ cursor: "s2", notice: ["a", "b"] })));
    expect(listFeed).toHaveBeenCalledWith({}, "u1", expect.objectContaining({ cursor: "s2" }));
    expect(screen.getByText("No more shoutouts.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("explains when the budget is used up and handles a missing name", async () => {
    auth.mockResolvedValue({ user: { ...bob, name: undefined } });
    getBudget.mockResolvedValue(budget(0));
    render(await HomePage(props()));
    expect(screen.getByRole("heading", { name: /hi there/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Send a shoutout" })).not.toBeInTheDocument();
    expect(screen.getByText(/used all your shoutouts/i)).toBeInTheDocument();
  });
});
