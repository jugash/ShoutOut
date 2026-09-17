import { afterEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const searchPeople = vi.fn();
vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/db", () => ({ getDb: () => ({ db: true }) }));
vi.mock("@/server/users/search", () => ({ searchPeople }));

const { GET } = await import("./route");

describe("GET /api/people", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires a session", async () => {
    auth.mockResolvedValue(null);
    expect((await GET(new Request("http://app/api/people?q=b"))).status).toBe(401);
  });

  it("searches for the signed-in user", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    searchPeople.mockResolvedValue([{ id: "u2", name: "Bob", email: "bob@x" }]);
    const res = await GET(new Request(`http://app/api/people?q=${"b".repeat(150)}`));
    expect(await res.json()).toEqual({ people: [{ id: "u2", name: "Bob", email: "bob@x" }] });
    expect(searchPeople).toHaveBeenCalledWith({ db: true }, "u1", "b".repeat(100));
  });

  it("treats a missing query as empty", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    searchPeople.mockResolvedValue([]);
    await GET(new Request("http://app/api/people"));
    expect(searchPeople).toHaveBeenCalledWith({ db: true }, "u1", "");
  });
});
