import { getDb } from "@/lib/db";
import { sql } from "@/lib/sql";

export const dynamic = "force-dynamic";

/** Readiness probe: the database is reachable. */
export async function GET() {
  try {
    await getDb().rows(sql`SELECT 1`);
    return Response.json({ status: "ready" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
