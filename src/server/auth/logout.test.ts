import { describe, expect, it } from "vitest";
import { buildKeycloakLogoutUrl } from "./logout";

describe("buildKeycloakLogoutUrl", () => {
  const base = {
    issuer: "http://auth.localtest.me/realms/shoutout/",
    clientId: "shoutout-web",
    postLogoutRedirectUri: "http://shoutout.localtest.me/signin",
  };

  it("uses the id token hint when available", () => {
    const url = new URL(buildKeycloakLogoutUrl({ ...base, idToken: "abc" }));
    expect(url.origin + url.pathname).toBe(
      "http://auth.localtest.me/realms/shoutout/protocol/openid-connect/logout",
    );
    expect(url.searchParams.get("id_token_hint")).toBe("abc");
    expect(url.searchParams.get("client_id")).toBeNull();
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe(base.postLogoutRedirectUri);
  });

  it("falls back to client_id without an id token", () => {
    const url = new URL(buildKeycloakLogoutUrl({ ...base, idToken: null }));
    expect(url.searchParams.get("id_token_hint")).toBeNull();
    expect(url.searchParams.get("client_id")).toBe("shoutout-web");
  });
});
