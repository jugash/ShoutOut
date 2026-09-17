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
  const params = new URL(request.url).searchParams;
  const query = params.get("q") ?? "";
  const people = await searchPeople(getDb(), session.user.id, query.slice(0, 100), 8, {
    includeSelf: params.get("self") === "1",
  });
  return Response.json({ people });
}
