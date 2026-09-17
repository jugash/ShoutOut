import type { Db } from "@/lib/db";
import { sql } from "@/lib/sql";
import { quarterBounds } from "./quarter";

export interface Budget {
  allowance: number;
  used: number;
  remaining: number;
  resetsAt: Date;
}

/** Each recipient of a non-deleted shoutout sent this quarter uses one unit of budget. */
export async function getBudget(
  db: Db,
  userId: string,
  allowance: number,
  now = new Date(),
): Promise<Budget> {
  const { start, end } = quarterBounds(now);
  const row = await db.one<{ used: number }>(sql`
    SELECT COUNT(*)::int AS used
    FROM shoutout_recipients r JOIN shoutouts s ON s.id = r.shoutout_id
    WHERE s.sender_id = ${userId} AND s.deleted_at IS NULL
      AND s.created_at >= ${start} AND s.created_at < ${end}`);
  const used = row!.used;
  return { allowance, used, remaining: Math.max(0, allowance - used), resetsAt: end };
}
