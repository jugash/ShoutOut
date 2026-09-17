import { afterAll, beforeEach, inject } from "vitest";
import { DEFAULT_CARD_DESIGNS } from "@/components/cards/designs";
import { createDb, type Db } from "@/lib/db";

const SEEDED_VALUES = ["Integrity", "Diversity", "Excellence", "Collaboration", "Engagement"];

/** Real Postgres client for integration tests, with tables emptied before each test. */
export function useTestDb(): Db {
  const db = createDb(inject("databaseUrl"));

  beforeEach(async () => {
    const tables = await db.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT IN ('_prisma_migrations', 'cards', 'company_values')`;
    if (tables.length > 0) {
      const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
      await db.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
    }
    // Restore the seeded catalogue exactly as the migration left it.
    await db.card.deleteMany({ where: { NOT: { id: { startsWith: "card_" } } } });
    await db.companyValue.deleteMany({ where: { NOT: { id: { startsWith: "value_" } } } });
    for (const [index, card] of DEFAULT_CARD_DESIGNS.entries()) {
      const { slug, ...design } = card;
      await db.card.update({
        where: { id: `card_${slug}` },
        data: { ...design, slug, active: true, sortOrder: index + 1 },
      });
    }
    for (const [index, name] of SEEDED_VALUES.entries()) {
      await db.companyValue.update({
        where: { id: `value_${name.toLowerCase()}` },
        data: { name, active: true, sortOrder: index + 1 },
      });
    }
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  return db;
}
