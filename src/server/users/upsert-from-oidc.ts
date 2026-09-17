import type { Db } from "@/lib/db";

export interface OidcProfile {
  sub?: string | null;
  email?: string | null;
  name?: string | null;
  preferred_username?: string | null;
  given_name?: string | null;
  family_name?: string | null;
  picture?: string | null;
}

export function displayName(profile: OidcProfile): string {
  const fromParts = [profile.given_name, profile.family_name].filter(Boolean).join(" ");
  return profile.name || fromParts || profile.preferred_username || profile.email || "Unknown";
}

/**
 * Finds the local user for a Keycloak account. Falls back to email so a user
 * whose Keycloak id changed (e.g. realm re-created) keeps their history.
 */
export async function findByKeycloakIdOrEmail(db: Db, keycloakId: string, email: string) {
  return (
    (await db.user.findUnique({ where: { keycloakId }, select: { id: true } })) ??
    (await db.user.findUnique({ where: { email }, select: { id: true } }))
  );
}

/** Creates or refreshes the local user record for someone who just signed in. */
export async function upsertUserFromOidc(db: Db, profile: OidcProfile, now = new Date()) {
  if (!profile.sub || !profile.email) {
    throw new Error("OIDC profile is missing sub or email");
  }
  const data = {
    email: profile.email.toLowerCase(),
    name: displayName(profile),
    avatarUrl: profile.picture ?? null,
    active: true,
    lastLoginAt: now,
  };
  const existing = await findByKeycloakIdOrEmail(db, profile.sub, data.email);
  if (existing) {
    return db.user.update({
      where: { id: existing.id },
      data: { keycloakId: profile.sub, ...data },
    });
  }
  return db.user.create({ data: { keycloakId: profile.sub, ...data } });
}
