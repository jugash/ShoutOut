import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, inject, it, vi } from "vitest";
import { main, migrate, MIGRATIONS_DIR } from "./migrate.mjs";

/** Each test gets its own empty database in the shared Postgres container. */
async function freshDatabase(name: string): Promise<string> {
  const admin = new pg.Client({ connectionString: inject("databaseUrl") });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${name}`);
  await admin.query(`CREATE DATABASE ${name}`);
  await admin.end();
  const url = new URL(inject("databaseUrl"));
  url.pathname = `/${name}`;
  return url.toString();
}

async function query(connectionString: string, text: string) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    return (await client.query(text)).rows;
  } finally {
    await client.end();
  }
}

describe("migrate (postgres)", () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "migrations-"));
    await writeFile(path.join(dir, "001_first.sql"), "CREATE TABLE t (id int);");
    await writeFile(path.join(dir, "002_second.sql"), "ALTER TABLE t ADD COLUMN name text;");
    await writeFile(path.join(dir, "README.md"), "not a migration");
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it("applies pending migrations once, in order", async () => {
    const url = await freshDatabase("migrate_order");
    const log = vi.fn();
    expect(await migrate({ connectionString: url, dir, log })).toEqual(["001_first", "002_second"]);
    expect(log).toHaveBeenCalledWith("applied 002_second");
    expect(await migrate({ connectionString: url, dir, log })).toEqual([]);
    expect(log).toHaveBeenLastCalledWith("database is up to date");
    const versions = await query(url, "SELECT version FROM schema_migrations ORDER BY version");
    expect(versions.map((r) => r.version)).toEqual(["001_first", "002_second"]);
  });

  it("rolls back a failing migration and reports it", async () => {
    const url = await freshDatabase("migrate_fail");
    const badDir = await mkdtemp(path.join(tmpdir(), "bad-"));
    await writeFile(path.join(badDir, "001_ok.sql"), "CREATE TABLE ok (id int);");
    await writeFile(path.join(badDir, "002_bad.sql"), "CREATE TABLE half (id int); SELECT nope;");
    await expect(migrate({ connectionString: url, dir: badDir, log: () => {} })).rejects.toThrow(
      /Migration 002_bad failed: column "nope" does not exist/,
    );
    const tables = await query(url, "SELECT to_regclass('half') AS half, to_regclass('ok') AS ok");
    expect(tables).toEqual([{ half: null, ok: "ok" }]);
  });

  it("adopts history from a database Prisma migrated, then applies only new migrations", async () => {
    const url = await freshDatabase("migrate_prisma");
    await query(
      url,
      `CREATE TABLE _prisma_migrations (migration_name text, finished_at timestamptz, rolled_back_at timestamptz);
       INSERT INTO _prisma_migrations VALUES ('001_first', now(), NULL), ('002_second', NULL, NULL);
       CREATE TABLE t (id int);`,
    );
    expect(await migrate({ connectionString: url, dir, log: () => {} })).toEqual(["002_second"]);
  });

  it("builds the real schema from scratch with the default directory and logger", async () => {
    const url = await freshDatabase("migrate_real");
    vi.spyOn(console, "log").mockImplementation(() => {});
    const applied = await migrate({ connectionString: url });
    expect(applied.length).toBeGreaterThanOrEqual(5);
    expect(MIGRATIONS_DIR).toMatch(/db[/\\]migrations$/);
    const [{ count }] = await query(url, "SELECT COUNT(*)::int AS count FROM cards");
    expect(count).toBe(10);
    const prisma = await query(url, "SELECT to_regclass('_prisma_migrations') AS t");
    expect(prisma).toEqual([{ t: null }]);
  });
});

describe("main", () => {
  it("needs DATABASE_URL", async () => {
    const log = vi.fn();
    expect(await main({ env: {}, log })).toBe(1);
    expect(log).toHaveBeenCalledWith("DATABASE_URL is not set");
  });

  it("retries while the database starts, then succeeds or gives up", async () => {
    const log = vi.fn();
    const flaky = vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED")).mockResolvedValue([]);
    expect(
      await main({ env: { DATABASE_URL: "x" }, run: flaky, attempts: 3, delayMs: 1, log }),
    ).toBe(0);
    expect(log).toHaveBeenCalledWith("migration attempt 1/3 failed: ECONNREFUSED");

    const broken = vi.fn().mockRejectedValue(new Error("down"));
    expect(
      await main({ env: { DATABASE_URL: "x" }, run: broken, attempts: 2, delayMs: 1, log }),
    ).toBe(1);
    expect(broken).toHaveBeenCalledTimes(2);
  });

  it("uses process.env and the real runner by default", async () => {
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(await main({ attempts: 1 })).toBe(1);
    expect(log).toHaveBeenCalledWith("DATABASE_URL is not set");
    process.env.DATABASE_URL = saved;
  });
});
