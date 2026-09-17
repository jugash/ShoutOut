import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/theme-server", () => ({ getThemePreference: async () => "light" }));

const { default: BrandPage, metadata } = await import("./page");

describe("BrandPage", () => {
  it("shows the logo, palette, type, components and all cards", async () => {
    render(await BrandPage());
    expect(metadata.title).toBe("Brand");
    for (const heading of ["Logo", "Colour", "Typography", "Buttons & avatars", "Cards"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    expect(screen.getByRole("radio", { name: "Light theme" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    const cardsSection = screen.getByRole("heading", { name: "Cards" }).parentElement!;
    expect(within(cardsSection).getAllByRole("figure")).toHaveLength(10);
    expect(within(cardsSection).getAllByRole("article")).toHaveLength(2);
  });
});
