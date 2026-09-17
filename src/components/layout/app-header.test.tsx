import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/auth", () => ({ signOutEverywhere: vi.fn() }));
vi.mock("@/lib/theme-server", () => ({ getThemePreference: async () => "dark" }));

const { AppHeader } = await import("./app-header");

describe("AppHeader", () => {
  it("shows the logo, navigation, theme toggle, profile link and sign out", async () => {
    render(
      await AppHeader({
        user: { id: "u1", name: "Bob Baker", email: "bob@example.com", roles: ["shoutout-user"] },
      }),
    );
    expect(screen.getByRole("link", { name: "ShoutOut home" })).toHaveAttribute("href", "/");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toHaveTextContent("Feed");
    expect(screen.getByRole("link", { name: "People" })).toHaveAttribute("href", "/people");
    expect(screen.getByRole("link", { name: "Leaderboard" })).toHaveAttribute(
      "href",
      "/leaderboard",
    );
    expect(screen.queryByRole("link", { name: "Analytics" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dark theme" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("link", { name: "Your profile" })).toHaveAttribute(
      "href",
      "/people/u1",
    );
    expect(screen.getByText("Bob Baker")).toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Feed" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("labels admins and falls back to email", async () => {
    render(
      await AppHeader({
        user: { id: "u2", email: "alice@example.com", roles: ["shoutout-admin"] },
      }),
    );
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Analytics" })).toHaveAttribute("href", "/analytics");
  });
});
