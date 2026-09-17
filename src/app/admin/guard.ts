import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/server/auth/roles";

/** The signed-in admin; anonymous users go to sign in, everyone else gets a 404. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }
  if (!isAdmin(session.user.roles)) {
    notFound();
  }
  return session.user;
}
