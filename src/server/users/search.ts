import type { Db } from "@/lib/db";

export interface PersonSummary {
  id: string;
  name: string;
  email: string;
}

/**
 * Active colleagues whose name contains the query or whose email starts with it,
 * excluding the person searching. (Matching anywhere in the email would match
 * everyone on the company domain.)
 */
export function searchPeople(
  db: Db,
  viewerId: string,
  query: string,
  limit = 8,
): Promise<PersonSummary[]> {
  const q = query.trim();
  return db.user.findMany({
    where: {
      active: true,
      id: { not: viewerId },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { startsWith: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    take: limit,
    select: { id: true, name: true, email: true },
  });
}
