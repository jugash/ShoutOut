import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/admin/guard", () => ({
  requireAdmin: async () => ({ id: "admin-1", name: "Alice", roles: ["shoutout-admin"] }),
}));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@/app/actions/admin", () => ({
  saveCardAction: vi.fn(),
  moveCardAction: vi.fn(),
  setCardActiveAction: vi.fn(),
  createValueAction: vi.fn(),
  renameValueAction: vi.fn(),
  moveValueAction: vi.fn(),
  setValueActiveAction: vi.fn(),
}));
vi.mock("@/components/layout/app-header", () => ({ AppHeader: () => <header /> }));
const listAllCards = vi.fn();
vi.mock("@/server/admin/catalog", () => ({ listAllCards }));

const { default: AdminCardsPage, metadata } = await import("./page");

describe("AdminCardsPage", () => {
  it("lists cards with usage, status and controls", async () => {
    listAllCards.mockResolvedValue([
      {
        id: "c1",
        slug: "a",
        title: "Thank You",
        tagline: "For being awesome",
        illustration: "heart",
        tone: "coral",
        active: true,
        uses: 1,
      },
      {
        id: "c2",
        slug: "b",
        title: "Old Card",
        tagline: "Gone",
        illustration: "rocket",
        tone: "lilac",
        active: false,
        uses: 4,
      },
    ]);
    render(
      await AdminCardsPage({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({ notice: "card-saved" }),
      } as PageProps<"/admin/cards">),
    );
    expect(metadata.title).toBe("Cards");
    expect(screen.getByRole("status")).toHaveTextContent("Card saved.");
    expect(screen.getByRole("link", { name: "New card" })).toHaveAttribute(
      "href",
      "/admin/cards/new",
    );
    const [first, second] = screen.getAllByRole("listitem");
    expect(first).toHaveTextContent("used 1 time");
    expect(within(first).getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/admin/cards/c1",
    );
    expect(within(first).getByRole("button", { name: "Move Thank You up" })).toBeDisabled();
    expect(second).toHaveTextContent("Retired");
    expect(second).toHaveTextContent("used 4 times");
    expect(within(second).getByRole("button", { name: "Restore" })).toBeInTheDocument();
    expect(within(second).getByRole("button", { name: "Move Old Card down" })).toBeDisabled();
  });

  it("ignores repeated notice params", async () => {
    listAllCards.mockResolvedValue([]);
    render(
      await AdminCardsPage({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({ notice: ["a"] }),
      } as PageProps<"/admin/cards">),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
