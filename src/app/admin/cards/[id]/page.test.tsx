import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getCard = vi.fn();
vi.mock("@/app/admin/guard", () => ({
  requireAdmin: async () => ({ id: "a", roles: ["shoutout-admin"] }),
}));
vi.mock("@/lib/db", () => ({ getDb: () => ({ db: true }) }));
vi.mock("@/server/admin/catalog", () => ({ getCard }));
vi.mock("@/app/actions/admin", () => ({ saveCardAction: vi.fn() }));
vi.mock("@/components/layout/app-header", () => ({ AppHeader: () => <header /> }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
const CardForm = vi.fn((props: { submitLabel: string }) => <p>{props.submitLabel}</p>);
vi.mock("@/components/admin/card-form", () => ({ CardForm }));

const { default: EditCardPage, metadata } = await import("./page");
const props = { params: Promise.resolve({ id: "c1" }) } as PageProps<"/admin/cards/[id]">;

describe("EditCardPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("404s for unknown cards", async () => {
    getCard.mockResolvedValue(null);
    await expect(EditCardPage(props)).rejects.toThrow("NOT_FOUND");
  });

  it("prefills the card, with safe fallbacks for unknown artwork", async () => {
    getCard.mockResolvedValue({
      id: "c1",
      title: "Mentor",
      tagline: "Grow",
      illustration: "sprout",
      tone: "weird",
    });
    render(await EditCardPage(props));
    expect(metadata.title).toBe("Edit card");
    expect(screen.getByRole("heading", { name: "Edit Mentor" })).toBeInTheDocument();
    expect(CardForm.mock.calls[0][0]).toMatchObject({
      submitLabel: "Save card",
      initial: { title: "Mentor", tagline: "Grow", illustration: "sprout", tone: "coral" },
    });
    expect(getCard).toHaveBeenCalledWith({ db: true }, "c1");
  });
});
