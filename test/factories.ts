import type { Db } from "@/lib/db";
import { sql } from "@/lib/sql";

let counter = 0;

export interface TestUser {
  id: string;
  keycloakId: string;
  email: string;
  name: string;
  active: boolean;
}

export async function createUser(db: Db, overrides: { name?: string; active?: boolean } = {}) {
  counter++;
  const name = overrides.name ?? `Person ${counter}`;
  const email = `${name.toLowerCase().replace(/\s+/g, ".")}.${counter}@example.com`;
  return (await db.one<TestUser>(sql`
    INSERT INTO users (keycloak_id, email, name, active)
    VALUES (${`kc-${counter}-${Date.now()}`}, ${email}, ${name}, ${overrides.active ?? true})
    RETURNING id, keycloak_id AS "keycloakId", email, name, active`))!;
}

/** Seeded ids from the migrations. */
export const CARD_ID = "card_thank-you";
export const OTHER_CARD_ID = "card_mentor";
export const VALUE_ID = "value_integrity";
export const OTHER_VALUE_ID = "value_collaboration";

/** Inserts a user with exact identifiers. */
export async function insertUser(
  db: Db,
  user: { keycloakId: string; email: string; name: string; active?: boolean },
) {
  return (await db.one<TestUser>(sql`
    INSERT INTO users (keycloak_id, email, name, active)
    VALUES (${user.keycloakId}, ${user.email}, ${user.name}, ${user.active ?? true})
    RETURNING id, keycloak_id AS "keycloakId", email, name, active`))!;
}

export function findUser(db: Db, where: { id: string } | { keycloakId: string }) {
  return db.one<TestUser>(sql`
    SELECT id, keycloak_id AS "keycloakId", email, name, active FROM users
    WHERE ${"id" in where ? sql`id = ${where.id}` : sql`keycloak_id = ${where.keycloakId}`}`);
}

export async function count(
  db: Db,
  table: "users" | "reactions" | "shoutout_recipients",
  where = sql`true`,
) {
  const tables = {
    users: sql`users`,
    reactions: sql`reactions`,
    shoutout_recipients: sql`shoutout_recipients`,
  };
  return (await db.one<{ n: number }>(
    sql`SELECT COUNT(*)::int AS n FROM ${tables[table]} WHERE ${where}`,
  ))!.n;
}

export function setUserActive(db: Db, id: string, active: boolean) {
  return db.execute(sql`UPDATE users SET active = ${active} WHERE id = ${id}`);
}

/** Retires (or restores) catalogue rows; `except` keeps one id untouched. */
export function setCatalogActive(
  db: Db,
  table: "cards" | "company_values",
  active: boolean,
  { only, except }: { only?: string; except?: string },
) {
  const name = table === "cards" ? sql`cards` : sql`company_values`;
  const where = only ? sql`id = ${only}` : sql`id <> ${except}`;
  return db.execute(sql`UPDATE ${name} SET active = ${active} WHERE ${where}`);
}

export function findShoutoutState(db: Db, id: string) {
  return db.one<{ deletedAt: Date | null; moderationStatus: string }>(sql`
    SELECT deleted_at AS "deletedAt", moderation_status AS "moderationStatus" FROM shoutouts WHERE id = ${id}`);
}
