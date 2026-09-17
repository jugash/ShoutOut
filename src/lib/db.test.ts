import { afterEach, describe, expect, it, vi } from "vitest";

describe("getDb", () => {
  afterEach(() => {
    delete (globalThis as { shoutoutDb?: unknown }).shoutoutDb;
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("requires a connection string", async () => {
    const { createDb } = await import("./db");
    expect(() => createDb(undefined)).toThrow("DATABASE_URL is not set");
  });

  it("creates the shared pool once", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5999/db");
    const { getDb } = await import("./db");
    const first = getDb();
    expect(getDb()).toBe(first);
    await first.close();
  });
});

describe("pgErrorCode", () => {
  it("reads codes from errors and ignores anything else", async () => {
    const { pgErrorCode } = await import("./db");
    expect(pgErrorCode(Object.assign(new Error("dup"), { code: "23505" }))).toBe("23505");
    expect(pgErrorCode({ code: 42 })).toBe("42");
    expect(pgErrorCode(new Error("plain"))).toBeUndefined();
    expect(pgErrorCode("text")).toBeUndefined();
    expect(pgErrorCode(null)).toBeUndefined();
  });
});
