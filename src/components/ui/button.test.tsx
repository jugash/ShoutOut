import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonClasses } from "./button";

describe("Button", () => {
  it("defaults to a primary, medium, non-submitting button", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Send</Button>);
    const button = screen.getByRole("button", { name: "Send" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("bg-sunny");
    expect(button.className).toContain("px-5");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("supports variants, sizes and extra classes", () => {
    render(
      <Button type="submit" variant="outline" size="lg" className="w-full">
        Go
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button.className).toContain("border-2");
    expect(button.className).toContain("text-lg");
    expect(button.className).toContain("w-full");
  });

  it("builds classes without arguments", () => {
    expect(buttonClasses()).toContain("bg-sunny");
    expect(buttonClasses({ variant: "ghost", size: "sm" })).toContain("text-sm");
    expect(buttonClasses({ variant: "secondary" })).toContain("bg-teal-strong");
  });
});
