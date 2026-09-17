import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("marks the initial preference", () => {
    render(<ThemeToggle initial="dark" />);
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dark theme" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Light theme" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("switches theme when an option is chosen", async () => {
    render(<ThemeToggle initial="system" />);

    await userEvent.click(screen.getByRole("radio", { name: "Light theme" }));
    expect(screen.getByRole("radio", { name: "Light theme" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(document.documentElement.dataset.theme).toBe("light");

    await userEvent.click(screen.getByRole("radio", { name: "Match system theme" }));
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(document.cookie).toContain("shoutout-theme=system");
  });
});
