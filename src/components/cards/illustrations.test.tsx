import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardIllustration, ILLUSTRATION_NAMES, isIllustrationName } from "./illustrations";

describe("CardIllustration", () => {
  it.each(ILLUSTRATION_NAMES)("draws %s", (name) => {
    const { container } = render(<CardIllustration name={name} />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("data-illustration", name);
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.querySelectorAll("path, circle, rect, ellipse").length).toBeGreaterThan(3);
  });

  it("is announced when given a title", () => {
    render(<CardIllustration name="trophy" title="Trophy" className="h-10" />);
    const svg = screen.getByRole("img", { name: "Trophy" });
    expect(svg).not.toHaveAttribute("aria-hidden");
    expect(svg).toHaveClass("h-10");
  });

  it("validates illustration names", () => {
    expect(isIllustrationName("rocket")).toBe(true);
    expect(isIllustrationName("unicorn")).toBe(false);
  });
});
