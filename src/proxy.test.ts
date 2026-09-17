import { describe, expect, it, vi } from "vitest";

const auth = vi.fn();
vi.mock("@/auth", () => ({ auth }));

describe("proxy", () => {
  it("delegates to Auth.js and skips static assets", async () => {
    const mod = await import("./proxy");
    expect(mod.default).toBe(auth);
    const matcher = new RegExp(`^${mod.config.matcher[0]}$`);
    expect(matcher.test("/")).toBe(true);
    expect(matcher.test("/_next/static/chunk.js")).toBe(false);
  });
});
