import type { NextAuthConfig } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import type { Db } from "@/lib/db";
import { isPublicPath } from "./public-paths";
import { extractRoles } from "./roles";
import { upsertUserFromOidc, type OidcProfile } from "../users/upsert-from-oidc";

export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function buildAuthConfig(getDb: () => Db): NextAuthConfig {
  return {
    trustHost: true,
    session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
    pages: { signIn: "/signin" },
    providers: [
      Keycloak({
        clientId: process.env.AUTH_KEYCLOAK_ID,
        clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
        issuer: process.env.AUTH_KEYCLOAK_ISSUER,
      }),
    ],
    callbacks: {
      authorized({ request, auth }) {
        return isPublicPath(request.nextUrl.pathname) || Boolean(auth?.user);
      },
      async jwt({ token, account, profile }) {
        // `account` and `profile` are only present on the sign-in request.
        if (account && profile) {
          const user = await upsertUserFromOidc(getDb(), profile as OidcProfile);
          token.userId = user.id;
          token.name = user.name;
          token.email = user.email;
          token.roles = extractRoles(profile as Record<string, unknown>);
          token.idToken = account.id_token;
        }
        return token;
      },
      session({ session, token }) {
        session.user.id = token.userId as string;
        session.user.roles = (token.roles as string[] | undefined) ?? [];
        return session;
      },
    },
  };
}
