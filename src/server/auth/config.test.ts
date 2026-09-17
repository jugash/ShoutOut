import type { Account, Profile, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/db";

const upsertUserFromOidc = vi.fn();
vi.mock("../users/upsert-from-oidc", () => ({ upsertUserFromOidc }));

const { buildAuthConfig, SESSION_MAX_AGE_SECONDS } = await import("./config");

function fakeDb() {
  upsertUserFromOidc.mockReset();
  upsertUserFromOidc.mockResolvedValue({
    id: "user-1",
    name: "Alice Admin",
    email: "alice@example.com",
  });
  return { db: { fake: true } as unknown as Db, upsert: upsertUserFromOidc };
}

function request(pathname: string) {
  return { nextUrl: new URL(`http://localhost${pathname}`) } as unknown as NextRequest;
}

describe("buildAuthConfig", () => {
  it("configures a Keycloak provider with JWT sessions", () => {
    process.env.AUTH_KEYCLOAK_ISSUER = "http://auth.localtest.me/realms/shoutout";
    const config = buildAuthConfig(() => fakeDb().db);
    expect(config.providers).toHaveLength(1);
    expect(config.session).toEqual({ strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS });
    expect(config.pages?.signIn).toBe("/signin");
  });

  describe("authorized", () => {
    const { authorized } = buildAuthConfig(() => fakeDb().db).callbacks!;
    const session = { user: { id: "u" } } as Session;

    it("allows public paths without a session", () => {
      expect(authorized!({ request: request("/signin"), auth: null })).toBe(true);
    });

    it("blocks protected paths without a session", () => {
      expect(authorized!({ request: request("/"), auth: null })).toBe(false);
      expect(authorized!({ request: request("/"), auth: {} as Session })).toBe(false);
    });

    it("allows protected paths with a session", () => {
      expect(authorized!({ request: request("/"), auth: session })).toBe(true);
    });
  });

  describe("jwt", () => {
    it("upserts the user and stores claims on sign-in", async () => {
      const { db, upsert } = fakeDb();
      const { jwt } = buildAuthConfig(() => db).callbacks!;
      const profile = {
        sub: "kc-1",
        email: "alice@example.com",
        roles: ["shoutout-admin"],
      } as Profile;
      const token = await jwt!({
        token: {} as JWT,
        account: { id_token: "id-token" } as Account,
        profile,
        user: {} as never,
      });
      expect(upsert).toHaveBeenCalledOnce();
      expect(token).toMatchObject({
        userId: "user-1",
        name: "Alice Admin",
        email: "alice@example.com",
        roles: ["shoutout-admin"],
        idToken: "id-token",
      });
    });

    it("passes the token through on later requests", async () => {
      const { db, upsert } = fakeDb();
      const { jwt } = buildAuthConfig(() => db).callbacks!;
      const existing = { userId: "user-1" } as JWT;
      expect(await jwt!({ token: existing, account: null, user: {} as never })).toBe(existing);
      expect(upsert).not.toHaveBeenCalled();
    });
  });

  describe("session", () => {
    const { session: sessionCallback } = buildAuthConfig(() => fakeDb().db).callbacks!;

    it("exposes the user id and roles", async () => {
      const result = await sessionCallback!({
        session: { user: { name: "Alice" } } as Session,
        token: { userId: "user-1", roles: ["shoutout-user"] } as JWT,
      } as never);
      expect(result.user).toMatchObject({ id: "user-1", roles: ["shoutout-user"] });
    });

    it("defaults roles to an empty list", async () => {
      const result = await sessionCallback!({
        session: { user: {} } as Session,
        token: { userId: "user-1" } as JWT,
      } as never);
      expect((result as Session).user.roles).toEqual([]);
    });
  });
});
