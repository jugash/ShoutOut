import { describe, expect, it, vi } from "vitest";
import { empty, isSql, join, Sql, sql, toQuery } from "./sql";

describe("sql", () => {
  it("numbers parameters in order", () => {
    expect(toQuery(sql`SELECT * FROM users WHERE id = ${"u1"} AND active = ${true}`)).toEqual({
      text: "SELECT * FROM users WHERE id = $1 AND active = $2",
      values: ["u1", true],
    });
  });

  it("splices nested fragments and keeps numbering across them", () => {
    const filter = sql`name ILIKE ${"%a%"}`;
    const query = sql`SELECT ${sql`id`} FROM users WHERE id <> ${"me"} AND ${filter} LIMIT ${5}`;
    expect(toQuery(query)).toEqual({
      text: "SELECT id FROM users WHERE id <> $1 AND name ILIKE $2 LIMIT $3",
      values: ["me", "%a%", 5],
    });
  });

  it("joins fragments and handles empty ones", () => {
    const where = join([sql`a = ${1}`, sql`b = ${2}`, sql`c IS NULL`], " AND ");
    expect(toQuery(sql`WHERE ${where}${empty}`)).toEqual({
      text: "WHERE a = $1 AND b = $2 AND c IS NULL",
      values: [1, 2],
    });
    expect(toQuery(join([], " OR "))).toEqual({ text: "", values: [] });
    expect(toQuery(join([sql`x`], ", "))).toEqual({ text: "x", values: [] });
  });

  it("never interpolates values into the text", () => {
    const evil = "'; DROP TABLE users; --";
    expect(toQuery(sql`SELECT ${evil}`)).toEqual({ text: "SELECT $1", values: [evil] });
  });

  it("recognises fragments created by another copy of this module", async () => {
    vi.resetModules();
    // The query string makes Vite load a second, independent copy of the module.
    const copy = "./sql?copy";
    const other = (await import(/* @vite-ignore */ copy)) as typeof import("./sql");
    const foreign = other.sql`b = ${2}`;
    // A genuinely separate class, as happens with duplicated bundler chunks.
    expect(other.Sql).not.toBe(Sql);
    expect(foreign).not.toBeInstanceOf(Sql);
    expect(isSql(foreign)).toBe(true);
    expect(isSql({ strings: [], values: [] })).toBe(false);
    expect(isSql(null)).toBe(false);
    expect(toQuery(sql`a = ${1} AND ${foreign}`)).toEqual({
      text: "a = $1 AND b = $2",
      values: [1, 2],
    });
  });
});
