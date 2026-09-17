import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { searchPeople } from "@/server/users/search";

export const dynamic = "force-dynamic";

/** People search for the recipient picker. */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const people = await searchPeople(getDb(), session.user.id, query.slice(0, 100));
  return Response.json({ people });
}
