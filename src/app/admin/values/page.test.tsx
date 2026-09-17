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
const listAllValues = vi.fn();
vi.mock("@/server/admin/catalog", () => ({ listAllValues }));

const { default: AdminValuesPage, metadata } = await import("./page");
const props = (notice?: string) =>
  ({
    params: Promise.resolve({}),
    searchParams: Promise.resolve(notice ? { notice } : {}),
  }) as PageProps<"/admin/values">;

describe("AdminValuesPage", () => {
  it("lists values with rename forms, usage and an add form", async () => {
    listAllValues.mockResolvedValue([
      { id: "v1", name: "Integrity", active: true, uses: 1 },
      { id: "v2", name: "Old", active: false, uses: 3 },
    ]);
    render(await AdminValuesPage(props("value-saved")));
    expect(metadata.title).toBe("Values");
    expect(screen.getByRole("status")).toHaveTextContent("Value saved.");
    expect(screen.getByLabelText("Rename Integrity")).toHaveValue("Integrity");
    const [first, second] = screen.getAllByRole("listitem");
    expect(first).toHaveTextContent("used 1 time");
    expect(second).toHaveTextContent("Retired · used 3 times");
    expect(within(second).getByRole("button", { name: "Restore" })).toBeInTheDocument();
    expect(screen.getByLabelText("New value name")).toBeInTheDocument();
    render(await AdminValuesPage(props()));
  });
});
