import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FeedItem } from "@/server/shoutouts/feed";

vi.mock("./feed-item", () => ({
  FeedItemCard: ({ item, viewerName }: { item: FeedItem; viewerName: string }) => (
    <article>
      {item.message} for {viewerName}
    </article>
  ),
}));

const { FeedList } = await import("./feed-list");
const now = new Date();

describe("FeedList", () => {
  it("shows the empty state", () => {
    render(
      <FeedList items={[]} viewerName="Me" now={now} nextHref={null} emptyText="Nothing here" />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("lists items with a link to the next page", () => {
    const items = [
      { id: "a", message: "One" },
      { id: "b", message: "Two" },
    ] as FeedItem[];
    render(
      <FeedList items={items} viewerName="Me" now={now} nextHref="/?cursor=b" emptyText="x" />,
    );
    expect(screen.getAllByRole("article").map((a) => a.textContent)).toEqual([
      "One for Me",
      "Two for Me",
    ]);
    expect(screen.getByRole("link", { name: "Show older shoutouts" })).toHaveAttribute(
      "href",
      "/?cursor=b",
    );
  });
});
