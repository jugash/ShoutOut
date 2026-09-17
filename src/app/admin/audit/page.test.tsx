import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
const listAudit = vi.fn();
vi.mock("@/server/admin/audit", () => ({ listAudit }));

const { default: AuditPage, metadata } = await import("./page");
const props = (cursor?: string | string[]) =>
  ({
    params: Promise.resolve({}),
    searchParams: Promise.resolve(cursor ? { cursor } : {}),
  }) as PageProps<"/admin/audit">;

describe("AuditPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty log", async () => {
    listAudit.mockResolvedValue({ entries: [], nextCursor: null });
    render(await AuditPage(props(["x"])));
    expect(metadata.title).toBe("Audit log");
    expect(screen.getByText("No admin or moderation activity yet.")).toBeInTheDocument();
    expect(listAudit).toHaveBeenCalledWith({}, { cursor: undefined });
  });

  it("lists entries with readable actions and details, and pages", async () => {
    listAudit.mockResolvedValue({
      entries: [
        {
          id: "1",
          action: "card.created",
          targetType: "card",
          targetId: "c",
          details: { title: "High Five" },
          createdAt: new Date("2026-09-17T10:05:00Z"),
          actor: { id: "a", name: "Alice" },
        },
        {
          id: "2",
          action: "mystery.action",
          targetType: "x",
          targetId: "y",
          details: null,
          createdAt: new Date("2026-09-17T09:00:00Z"),
          actor: { id: "a", name: "Alice" },
        },
      ],
      nextCursor: "2",
    });
    render(await AuditPage(props("1")));
    expect(listAudit).toHaveBeenCalledWith({}, { cursor: "1" });
    expect(screen.getByRole("cell", { name: "2026-09-17 10:05" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "created a card" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "title: High Five" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "mystery.action" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Older entries" })).toHaveAttribute(
      "href",
      "/admin/audit?cursor=2",
    );
  });
});
