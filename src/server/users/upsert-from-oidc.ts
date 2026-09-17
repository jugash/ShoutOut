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
  return db.user.upsert({
    where: { keycloakId: profile.sub },
    create: { keycloakId: profile.sub, ...data },
    update: data,
  });
}
