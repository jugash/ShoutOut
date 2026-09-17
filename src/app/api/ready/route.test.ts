import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
vi.mock("@/lib/db", () => ({ getDb: () => ({ rows: queryRaw }) }));

const { GET } = await import("./route");

describe("GET /api/ready", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("is ready when the database answers", async () => {
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ready" });
  });

  it("is unavailable when the database fails", async () => {
    queryRaw.mockRejectedValue(new Error("connection refused"));
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "unavailable" });
  });
});
