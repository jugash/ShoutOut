import { describe, expect, it } from "vitest";
import { useTestDb } from "../../../test/db";
import { searchPeople } from "./search";

describe("searchPeople (postgres)", () => {
  const db = useTestDb();

  it("matches names anywhere and emails by prefix, excluding the viewer and inactive people", async () => {
    const make = (name: string, email: string, active = true) =>
      db.user.create({ data: { keycloakId: email, email, name, active } });
    const viewer = await make("Hannah Viewer", "hannah@acme.io");
    await make("Henry Hughes", "henry@acme.io");
    await make("Carol Chen", "carol@acme.io");
    await make("Ex Colleague", "hector@acme.io", false);
    await make("Beth", "bh@acme.io");

    const names = async (q: string, limit?: number) =>
      (await searchPeople(db, viewer.id, q, limit)).map((p) => p.name);

    expect(await names("h")).toEqual(["Beth", "Carol Chen", "Henry Hughes"]);
    expect(await names("HUGH")).toEqual(["Henry Hughes"]);
    expect(await names("carol@")).toEqual(["Carol Chen"]);
    expect(await names("acme")).toEqual([]);
    expect(await names("  ")).toEqual(["Beth", "Carol Chen", "Henry Hughes"]);
    expect(await names("", 1)).toEqual(["Beth"]);
    expect((await searchPeople(db, viewer.id, "henry"))[0]).toEqual({
      id: expect.any(String),
      name: "Henry Hughes",
      email: "henry@acme.io",
    });
  });
});
