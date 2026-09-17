import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signIn = vi.fn();
const signOut = vi.fn();
const getToken = vi.fn();
const redirect = vi.fn();

vi.mock("@/auth", () => ({ signIn, signOut }));
vi.mock("next-auth/jwt", () => ({ getToken }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ cookie: "a=b" }) }));
vi.mock("next/navigation", () => ({ redirect }));

const { signInWithKeycloak, signOutEverywhere } = await import("./auth");

describe("auth actions", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_KEYCLOAK_ISSUER", "http://auth.localtest.me/realms/shoutout");
    vi.stubEnv("AUTH_KEYCLOAK_ID", "shoutout-web");
    vi.stubEnv("AUTH_SECRET", "secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("starts the Keycloak sign-in flow", async () => {
    await signInWithKeycloak();
    expect(signIn).toHaveBeenCalledWith("keycloak", { redirectTo: "/" });
  });

  it("signs out locally and in Keycloak using the id token", async () => {
    vi.stubEnv("AUTH_URL", "https://shoutout.example.com/");
    getToken.mockResolvedValue({ idToken: "id-123" });

    await signOutEverywhere();

    expect(getToken).toHaveBeenCalledWith(
      expect.objectContaining({ secret: "secret", secureCookie: true }),
    );
    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    const url = new URL(redirect.mock.calls[0][0]);
    expect(url.searchParams.get("id_token_hint")).toBe("id-123");
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe(
      "https://shoutout.example.com/signin",
    );
  });

  it("falls back to defaults when env and token are missing", async () => {
    vi.stubEnv("AUTH_URL", undefined as unknown as string);
    vi.stubEnv("AUTH_KEYCLOAK_ISSUER", undefined as unknown as string);
    vi.stubEnv("AUTH_KEYCLOAK_ID", undefined as unknown as string);
    getToken.mockResolvedValue(null);

    await signOutEverywhere();

    expect(getToken).toHaveBeenCalledWith(expect.objectContaining({ secureCookie: false }));
    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    expect(redirect).toHaveBeenCalledWith("/signin");
  });

  it("uses client_id when there is no token", async () => {
    vi.stubEnv("AUTH_URL", "http://shoutout.localtest.me");
    vi.stubEnv("AUTH_KEYCLOAK_ID", undefined as unknown as string);
    getToken.mockResolvedValue(null);

    await signOutEverywhere();

    const url = new URL(redirect.mock.calls[0][0]);
    expect(url.searchParams.has("client_id")).toBe(true);
    expect(url.searchParams.get("client_id")).toBe("");
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe(
      "http://shoutout.localtest.me/signin",
    );
  });
});
