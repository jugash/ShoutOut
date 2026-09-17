import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const redirect = vi.fn(() => {
  throw new Error("NEXT_REDIRECT");
});
vi.mock("@/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/components/layout/app-header", () => ({
  AppHeader: ({ user }: { user: { name?: string } }) => (
    <header>header for {user.name ?? "anon"}</header>
  ),
}));

const { default: HomePage } = await import("./page");

describe("HomePage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects anonymous visitors to sign in", async () => {
    auth.mockResolvedValue(null);
    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("greets the user by first name and shows the cards", async () => {
    auth.mockResolvedValue({
      user: { id: "u1", name: "Bob Builder", email: "bob@example.com", roles: ["shoutout-user"] },
    });
    render(await HomePage());
    expect(screen.getByRole("heading", { name: /hi bob/i })).toBeInTheDocument();
    expect(screen.getByText("header for Bob Builder")).toBeInTheDocument();
    expect(screen.getAllByRole("figure")).toHaveLength(10);
  });

  it("handles a missing name", async () => {
    auth.mockResolvedValue({
      user: { id: "u2", email: "alice@example.com", roles: ["shoutout-admin"] },
    });
    render(await HomePage());
    expect(screen.getByRole("heading", { name: /hi there/i })).toBeInTheDocument();
  });
});
