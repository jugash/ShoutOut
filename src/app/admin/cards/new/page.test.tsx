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
const CardForm = vi.fn((props: { submitLabel: string; initial: object }) => (
  <p>{props.submitLabel}</p>
));
vi.mock("@/components/admin/card-form", () => ({ CardForm }));

const { default: NewCardPage, metadata } = await import("./page");

describe("NewCardPage", () => {
  it("renders an empty card form", async () => {
    render(await NewCardPage());
    expect(metadata.title).toBe("New card");
    expect(screen.getByRole("heading", { name: "New card" })).toBeInTheDocument();
    expect(screen.getByText("Create card")).toBeInTheDocument();
    expect(CardForm.mock.calls[0][0].initial).toEqual({
      title: "",
      tagline: "",
      illustration: "heart",
      tone: "coral",
    });
  });
});
