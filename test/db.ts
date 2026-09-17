import { afterAll, beforeEach, inject } from "vitest";
import { createDb, type Db } from "@/lib/db";

/** Real Postgres client for integration tests, with tables emptied before each test. */
export function useTestDb(): Db {
  const db = createDb(inject("databaseUrl"));

  beforeEach(async () => {
    const tables = await db.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    if (tables.length > 0) {
      const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
      await db.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
    }
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  return db;
}
