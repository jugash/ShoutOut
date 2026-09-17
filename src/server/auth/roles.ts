export const ROLES = {
  user: "shoutout-user",
  admin: "shoutout-admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const KNOWN_ROLES = new Set<string>(Object.values(ROLES));

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/**
 * Pulls ShoutOut roles out of Keycloak claims. The realm ships a mapper that
 * puts realm roles in a flat `roles` claim; `realm_access.roles` is the
 * Keycloak default and is used as a fallback.
 */
export function extractRoles(claims: Record<string, unknown> | null | undefined): Role[] {
  if (!claims) return [];
  const realmAccess = claims.realm_access as { roles?: unknown } | undefined;
  const raw = [...stringArray(claims.roles), ...stringArray(realmAccess?.roles)];
  return [...new Set(raw)].filter((r): r is Role => KNOWN_ROLES.has(r));
}

export function isAdmin(roles: readonly string[] | undefined): boolean {
  return roles?.includes(ROLES.admin) ?? false;
}

/** Analytics are for admins unless configured for everyone. */
export function canViewAnalytics(
  roles: readonly string[] | undefined,
  visibility: "admins" | "everyone",
): boolean {
  return visibility === "everyone" || isAdmin(roles);
}
