import { describe, expect, it, vi } from "vitest";
import { fetchAllUsers, fetchServiceToken, keycloakAdminBase } from "./keycloak-admin";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("keycloakAdminBase", () => {
  it("maps a realm issuer to the admin API", () => {
    expect(keycloakAdminBase("http://auth.localtest.me/realms/shoutout")).toBe(
      "http://auth.localtest.me/admin/realms/shoutout",
    );
    expect(keycloakAdminBase("https://sso.example.com/auth/realms/acme/")).toBe(
      "https://sso.example.com/auth/admin/realms/acme",
    );
  });

  it("rejects non-realm URLs", () => {
    expect(() => keycloakAdminBase("https://example.com/oauth")).toThrow(/Not a Keycloak realm/);
  });
});

describe("fetchServiceToken", () => {
  const credentials = {
    issuer: "http://kc/realms/shoutout/",
    clientId: "shoutout-web",
    clientSecret: "s3cret",
  };

  it("uses the client credentials grant", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ access_token: "token-1" }));
    await expect(fetchServiceToken(credentials, fetchImpl)).resolves.toBe("token-1");
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("http://kc/realms/shoutout/protocol/openid-connect/token");
    expect(init.method).toBe("POST");
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      grant_type: "client_credentials",
      client_id: "shoutout-web",
      client_secret: "s3cret",
    });
  });

  it("fails on HTTP errors and missing tokens", async () => {
    await expect(
      fetchServiceToken(credentials, vi.fn().mockResolvedValue(json({}, 401))),
    ).rejects.toThrow("Keycloak token request failed with HTTP 401");
    await expect(
      fetchServiceToken(credentials, vi.fn().mockResolvedValue(json({}))),
    ).rejects.toThrow(/no access_token/);
  });
});

describe("fetchAllUsers", () => {
  const user = (id: number) => ({ id: `u${id}`, username: `user${id}`, enabled: true });

  it("pages through all users", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json([user(1), user(2)]))
      .mockResolvedValueOnce(json([user(3), user(4)]))
      .mockResolvedValueOnce(json([user(5)]));
    const users = await fetchAllUsers(
      { issuer: "http://kc/realms/r", token: "t", pageSize: 2 },
      fetchImpl,
    );
    expect(users.map((u) => u.id)).toEqual(["u1", "u2", "u3", "u4", "u5"]);
    expect(fetchImpl.mock.calls.map((c) => c[0])).toEqual([
      "http://kc/admin/realms/r/users?first=0&max=2&briefRepresentation=true",
      "http://kc/admin/realms/r/users?first=2&max=2&briefRepresentation=true",
      "http://kc/admin/realms/r/users?first=4&max=2&briefRepresentation=true",
    ]);
    expect(fetchImpl.mock.calls[0][1].headers).toEqual({ authorization: "Bearer t" });
  });

  it("uses a default page size and surfaces errors", async () => {
    const ok = vi.fn().mockResolvedValue(json([]));
    await expect(fetchAllUsers({ issuer: "http://kc/realms/r", token: "t" }, ok)).resolves.toEqual(
      [],
    );
    expect(ok.mock.calls[0][0]).toContain("max=100");
    const failing = vi.fn().mockResolvedValue(json({}, 403));
    await expect(
      fetchAllUsers({ issuer: "http://kc/realms/r", token: "t" }, failing),
    ).rejects.toThrow("Keycloak user listing failed with HTTP 403");
  });
});
