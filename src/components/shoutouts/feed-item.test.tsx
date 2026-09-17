import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FeedItem } from "@/server/shoutouts/feed";

const deleteShoutoutAction = vi.fn();
vi.mock("@/app/actions/shoutouts", () => ({ deleteShoutoutAction }));

const { FeedItemCard } = await import("./feed-item");

const now = new Date("2026-09-17T12:00:00Z");
const item: FeedItem = {
  id: "s1",
  message: "Thanks for the help",
  visibility: "PUBLIC",
  createdAt: new Date("2026-09-17T09:00:00Z"),
  editedAt: null,
  card: {
    id: "c",
    slug: "mentor",
    title: "Mentor",
    tagline: "t",
    illustration: "sprout",
    tone: "teal",
  },
  value: { id: "v", name: "Collaboration" },
  sender: { id: "u1", name: "Alice Anders" },
  recipients: [
    { id: "u2", name: "Bob Baker" },
    { id: "u3", name: "Carol Chen" },
  ],
  canModify: false,
};

describe("FeedItemCard", () => {
  it("shows a public shoutout without actions", () => {
    render(<FeedItemCard item={item} now={now} />);
    const card = screen.getByRole("article", {
      name: "Mentor from Alice Anders to Bob Baker and Carol Chen",
    });
    expect(card).toHaveTextContent("Thanks for the help");
    expect(card).toHaveTextContent("#Collaboration");
    expect(screen.getByText("3h ago")).toHaveAttribute("dateTime", "2026-09-17T09:00:00.000Z");
    expect(screen.queryByText("Private")).not.toBeInTheDocument();
    expect(screen.queryByText(/edited/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("marks private and edited shoutouts and offers edit/delete to the sender", () => {
    render(
      <FeedItemCard
        item={{ ...item, visibility: "PRIVATE", editedAt: now, canModify: true }}
        now={now}
      />,
    );
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.getByText("· edited")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/shoutouts/s1/edit",
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("defaults to the current time", () => {
    render(<FeedItemCard item={{ ...item, createdAt: new Date() }} />);
    expect(screen.getByText("just now")).toBeInTheDocument();
  });
});
