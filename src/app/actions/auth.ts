"use server";

import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { buildKeycloakLogoutUrl } from "@/server/auth/logout";

export async function signInWithKeycloak() {
  await signIn("keycloak", { redirectTo: "/" });
}

export async function signOutEverywhere() {
  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const token = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    secureCookie: appUrl.startsWith("https://"),
  });
  await signOut({ redirect: false });
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
  if (!issuer) {
    return redirect("/signin");
  }
  return redirect(
    buildKeycloakLogoutUrl({
      issuer,
      clientId: process.env.AUTH_KEYCLOAK_ID ?? "",
      idToken: token?.idToken as string | undefined,
      postLogoutRedirectUri: `${appUrl.replace(/\/+$/, "")}/signin`,
    }),
  );
}
