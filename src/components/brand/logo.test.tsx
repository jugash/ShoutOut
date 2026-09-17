import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./logo";
import { WORDMARK_OUT, WORDMARK_SHOUT } from "./wordmark-paths";

describe("Logo", () => {
  it("renders the full logo with the wordmark", () => {
    const { container } = render(<Logo className="h-12" />);
    const logo = screen.getByRole("img", { name: "ShoutOut" });
    expect(logo).toHaveAttribute("viewBox", "0 0 282 64");
    expect(logo).toHaveClass("h-12");
    expect(container.querySelector(`path[d="${WORDMARK_SHOUT}"]`)).not.toBeNull();
    expect(container.querySelector(`path[d="${WORDMARK_OUT}"]`)).not.toBeNull();
  });

  it("renders just the mark", () => {
    const { container } = render(<Logo variant="mark" title="ShoutOut logo" />);
    const logo = screen.getByRole("img", { name: "ShoutOut logo" });
    expect(logo).toHaveAttribute("viewBox", "0 0 64 64");
    expect(logo).toHaveClass("size-10");
    expect(container.querySelector(`path[d="${WORDMARK_SHOUT}"]`)).toBeNull();
  });
});
