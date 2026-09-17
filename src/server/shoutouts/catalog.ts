import type { Db } from "@/lib/db";

export function listActiveCards(db: Db) {
  return db.card.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, slug: true, title: true, tagline: true, illustration: true, tone: true },
  });
}

export function listActiveValues(db: Db) {
  return db.companyValue.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}
