import { describe, expect, it, vi } from "vitest";

const nextAuth = vi.fn(() => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next-auth", () => ({ default: nextAuth }));

describe("auth", () => {
  it("initialises Auth.js with the ShoutOut config", async () => {
    const mod = await import("./auth");
    expect(nextAuth).toHaveBeenCalledOnce();
    expect(nextAuth.mock.calls[0]).toEqual([expect.objectContaining({ trustHost: true })]);
    expect(mod.auth).toBeTypeOf("function");
  });
});
