import NextAuth from "next-auth";
import { getDb } from "@/lib/db";
import { buildAuthConfig } from "@/server/auth/config";

export const { handlers, auth, signIn, signOut } = NextAuth(buildAuthConfig(getDb));
