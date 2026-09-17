import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardTile } from "./card-tile";
import { findCardDesign } from "./designs";

describe("CardTile", () => {
  it("shows the card title, tagline and tone", () => {
    render(<CardTile design={findCardDesign("mentor")!} className="h-full" />);
    const figure = screen.getByRole("figure");
    expect(figure).toHaveTextContent("Mentor");
    expect(figure).toHaveTextContent("Helping others grow");
    expect(figure).toHaveClass("bg-teal-soft", "h-full");
  });
});
