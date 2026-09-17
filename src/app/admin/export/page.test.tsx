import { render, screen } from "@testing-library/react";
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
const { default: ExportPage, metadata } = await import("./page");

describe("ExportPage", () => {
  it("offers the three exports", async () => {
    const { container } = render(await ExportPage());
    expect(metadata.title).toBe("Export");
    const actions = [...container.querySelectorAll("form")].map((f) => f.getAttribute("action"));
    expect(actions).toEqual([
      "/admin/export/shoutouts",
      "/admin/export/people",
      "/admin/export/leaderboards",
    ]);
    expect(screen.getByLabelText("Period")).toHaveValue("quarter");
    expect(screen.getAllByLabelText("From")).toHaveLength(2);
  });
});
