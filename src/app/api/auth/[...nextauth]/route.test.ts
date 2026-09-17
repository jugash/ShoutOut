import { describe, expect, it, vi } from "vitest";

const handlers = { GET: vi.fn(), POST: vi.fn() };
vi.mock("@/auth", () => ({ handlers }));

describe("auth route", () => {
  it("exposes the Auth.js handlers", async () => {
    const route = await import("./route");
    expect(route.GET).toBe(handlers.GET);
    expect(route.POST).toBe(handlers.POST);
  });
});
