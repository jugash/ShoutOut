import { describe, expect, it } from "vitest";
import { extractRoles, isAdmin, ROLES } from "./roles";

describe("extractRoles", () => {
  it("returns no roles for missing claims", () => {
    expect(extractRoles(undefined)).toEqual([]);
    expect(extractRoles(null)).toEqual([]);
    expect(extractRoles({})).toEqual([]);
  });

  it("reads the flat roles claim and ignores unknown roles", () => {
    expect(extractRoles({ roles: ["shoutout-admin", "offline_access", 42] })).toEqual([
      ROLES.admin,
    ]);
  });

  it("falls back to realm_access.roles and de-duplicates", () => {
    expect(
      extractRoles({
        roles: "not-an-array",
        realm_access: { roles: ["shoutout-user", "shoutout-user", "uma_authorization"] },
      }),
    ).toEqual([ROLES.user]);
  });

  it("merges both claims", () => {
    expect(
      extractRoles({ roles: ["shoutout-user"], realm_access: { roles: ["shoutout-admin"] } }),
    ).toEqual([ROLES.user, ROLES.admin]);
  });
});

describe("isAdmin", () => {
  it("is true only when the admin role is present", () => {
    expect(isAdmin([ROLES.admin])).toBe(true);
    expect(isAdmin([ROLES.user])).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});
