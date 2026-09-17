import { afterEach, describe, expect, it, vi } from "vitest";

describe("db", () => {
  afterEach(() => {
    delete (globalThis as { shoutoutDb?: unknown }).shoutoutDb;
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("requires a connection string", async () => {
    const { createDb } = await import("./db");
    expect(() => createDb(undefined)).toThrow("DATABASE_URL is not set");
  });

  it("creates the shared client once", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5999/db");
    const { getDb } = await import("./db");
    const first = getDb();
    expect(getDb()).toBe(first);
    await first.$disconnect();
  });
});
