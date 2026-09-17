import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Notice } from "./notice";

describe("Notice", () => {
  it.each([
    ["sent", /shoutout sent/i, "bg-leaf-soft"],
    ["updated", /updated/i, "bg-leaf-soft"],
    ["deleted", /budget refunded/i, "bg-leaf-soft"],
    ["delete-failed", /can no longer be deleted/i, "bg-coral-soft"],
  ])("shows %s", (code, text, tone) => {
    render(<Notice code={code} />);
    expect(screen.getByRole("status")).toHaveTextContent(text);
    expect(screen.getByRole("status")).toHaveClass(tone);
  });

  it("renders nothing for unknown or missing codes", () => {
    const { container } = render(
      <>
        <Notice code="nope" />
        <Notice />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
