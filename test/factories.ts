import type { Db } from "@/lib/db";

let counter = 0;

export async function createUser(db: Db, overrides: { name?: string; active?: boolean } = {}) {
  counter++;
  const name = overrides.name ?? `Person ${counter}`;
  return db.user.create({
    data: {
      keycloakId: `kc-${counter}-${Date.now()}`,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}.${counter}@example.com`,
      name,
      active: overrides.active ?? true,
    },
  });
}

/** Seeded ids from the shoutouts migration. */
export const CARD_ID = "card_thank-you";
export const OTHER_CARD_ID = "card_mentor";
export const VALUE_ID = "value_integrity";
export const OTHER_VALUE_ID = "value_collaboration";
