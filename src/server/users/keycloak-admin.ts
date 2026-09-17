export interface KeycloakUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
}

export interface KeycloakClientCredentials {
  issuer: string;
  clientId: string;
  clientSecret: string;
}

type Fetch = typeof fetch;

/** http://host/realms/acme -> http://host/admin/realms/acme */
export function keycloakAdminBase(issuer: string): string {
  const url = new URL(issuer);
  const match = url.pathname.match(/^(.*)\/realms\/([^/]+)\/?$/);
  if (!match) {
    throw new Error(`Not a Keycloak realm issuer URL: ${issuer}`);
  }
  return `${url.origin}${match[1]}/admin/realms/${match[2]}`;
}

async function expectOk(response: Response, what: string): Promise<Response> {
  if (!response.ok) {
    throw new Error(`${what} failed with HTTP ${response.status}`);
  }
  return response;
}

/** Gets an access token for the client's service account (client credentials grant). */
export async function fetchServiceToken(
  { issuer, clientId, clientSecret }: KeycloakClientCredentials,
  fetchImpl: Fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(`${issuer.replace(/\/+$/, "")}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  await expectOk(response, "Keycloak token request");
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) {
    throw new Error("Keycloak token response had no access_token");
  }
  return body.access_token;
}

/** Lists every user in the realm, page by page. */
export async function fetchAllUsers(
  { issuer, token, pageSize = 100 }: { issuer: string; token: string; pageSize?: number },
  fetchImpl: Fetch = fetch,
): Promise<KeycloakUser[]> {
  const base = keycloakAdminBase(issuer);
  const users: KeycloakUser[] = [];
  for (let first = 0; ; first += pageSize) {
    const response = await fetchImpl(
      `${base}/users?first=${first}&max=${pageSize}&briefRepresentation=true`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    await expectOk(response, "Keycloak user listing");
    const page = (await response.json()) as KeycloakUser[];
    users.push(...page);
    if (page.length < pageSize) return users;
  }
}
