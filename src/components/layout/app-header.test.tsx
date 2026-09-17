import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/auth", () => ({ signOutEverywhere: vi.fn() }));
vi.mock("@/lib/theme-server", () => ({ getThemePreference: async () => "dark" }));

const { AppHeader } = await import("./app-header");

describe("AppHeader", () => {
  it("shows the logo, theme toggle, user and sign out", async () => {
    render(
      await AppHeader({
        user: { name: "Bob Baker", email: "bob@example.com", roles: ["shoutout-user"] },
      }),
    );
    expect(screen.getByRole("link", { name: "ShoutOut home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("radio", { name: "Dark theme" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByText("Bob Baker")).toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("labels admins and falls back to email", async () => {
    render(await AppHeader({ user: { email: "alice@example.com", roles: ["shoutout-admin"] } }));
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });
});
