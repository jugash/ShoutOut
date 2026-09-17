import { afterEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

const { requireAdmin } = await import("./guard");

describe("requireAdmin", () => {
  afterEach(() => {
    auth.mockReset();
  });

  it("sends anonymous visitors to sign in and hides admin from others", async () => {
    auth.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT /signin");
    auth.mockResolvedValue({ user: { id: "u", roles: ["shoutout-user"] } });
    await expect(requireAdmin()).rejects.toThrow("NOT_FOUND");
  });

  it("returns the admin", async () => {
    const user = { id: "a", roles: ["shoutout-admin"] };
    auth.mockResolvedValue({ user });
    await expect(requireAdmin()).resolves.toBe(user);
  });
});
