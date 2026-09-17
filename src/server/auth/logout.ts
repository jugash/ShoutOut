/**
 * Builds the Keycloak end-session URL so signing out of ShoutOut also ends the
 * Keycloak SSO session (otherwise "sign in" would silently log straight back in).
 */
export function buildKeycloakLogoutUrl(options: {
  issuer: string;
  postLogoutRedirectUri: string;
  idToken?: string | null;
  clientId: string;
}): string {
  const url = new URL(`${options.issuer.replace(/\/+$/, "")}/protocol/openid-connect/logout`);
  url.searchParams.set("post_logout_redirect_uri", options.postLogoutRedirectUri);
  if (options.idToken) {
    url.searchParams.set("id_token_hint", options.idToken);
  } else {
    url.searchParams.set("client_id", options.clientId);
  }
  return url.toString();
}
