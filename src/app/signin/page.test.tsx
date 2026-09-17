import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const redirect = vi.fn(() => {
  throw new Error("NEXT_REDIRECT");
});
vi.mock("@/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/app/actions/auth", () => ({ signInWithKeycloak: vi.fn() }));

const { default: SignInPage } = await import("./page");

describe("SignInPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the sign-in button to anonymous visitors", async () => {
    auth.mockResolvedValue(null);
    render(await SignInPage());
    expect(screen.getByRole("heading", { name: "ShoutOut" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with your work account/i }),
    ).toBeInTheDocument();
  });

  it("sends signed-in users home", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    await expect(SignInPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
