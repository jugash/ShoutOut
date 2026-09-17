import type { Db } from "@/lib/db";
import { sql } from "@/lib/sql";

export interface CatalogCard {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  illustration: string;
  tone: string;
}

export function listActiveCards(db: Db) {
  return db.rows<CatalogCard>(sql`
    SELECT id, slug, title, tagline, illustration, tone FROM cards
    WHERE active ORDER BY sort_order ASC, title ASC`);
}

export function listActiveValues(db: Db) {
  return db.rows<{ id: string; name: string }>(sql`
    SELECT id, name FROM company_values WHERE active ORDER BY sort_order ASC, name ASC`);
}
