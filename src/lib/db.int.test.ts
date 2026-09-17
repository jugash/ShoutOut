import { describe, expect, it } from "vitest";
import { useTestDb } from "../../test/db";
import { sql } from "./sql";

describe("Db (postgres)", () => {
  const db = useTestDb();

  it("returns typed rows, single rows and affected counts", async () => {
    expect(await db.rows<{ n: number }>(sql`SELECT generate_series(1, 3) AS n`)).toEqual([
      { n: 1 },
      { n: 2 },
      { n: 3 },
    ]);
    expect(await db.one<{ n: number }>(sql`SELECT ${7}::int AS n`)).toEqual({ n: 7 });
    expect(await db.one(sql`SELECT 1 WHERE false`)).toBeNull();
    expect(await db.execute(sql`UPDATE cards SET active = true`)).toBe(10);
    expect(await db.execute(sql`SELECT 1 WHERE false`)).toBe(0);
  });

  it("returns timestamps as the same instant regardless of the machine's time zone", async () => {
    const instant = new Date("2026-03-29T00:30:00.123Z");
    const row = await db.one<{ at: Date }>(sql`SELECT ${instant}::timestamptz AS at`);
    expect(row!.at.toISOString()).toBe("2026-03-29T00:30:00.123Z");
  });

  it("commits transactions, joins nested ones and rolls back on errors", async () => {
    const insert = (email: string) =>
      sql`INSERT INTO users (keycloak_id, email, name) VALUES (${email}, ${email}, 'T')`;
    await db.transaction(async (tx) => {
      await tx.execute(insert("a@x"));
      await tx.transaction((inner) => inner.execute(insert("b@x")));
    });
    await expect(
      db.transaction(async (tx) => {
        await tx.execute(insert("c@x"));
        throw new Error("nope");
      }),
    ).rejects.toThrow("nope");
    const emails = await db.rows<{ email: string }>(sql`SELECT email FROM users ORDER BY email`);
    expect(emails.map((r) => r.email)).toEqual(["a@x", "b@x"]);
  });

  it("reports Postgres error codes", async () => {
    await db.execute(
      sql`INSERT INTO users (keycloak_id, email, name) VALUES ('k1', 'same@x', 'A')`,
    );
    const error = await db
      .execute(sql`INSERT INTO users (keycloak_id, email, name) VALUES ('k2', 'same@x', 'B')`)
      .catch((e) => e);
    const { pgErrorCode } = await import("./db");
    expect(pgErrorCode(error)).toBe("23505");
  });
});
