import type { DbClient } from "@/lib/db";
import { quarterBounds } from "./quarter";

export interface Budget {
  allowance: number;
  used: number;
  remaining: number;
  resetsAt: Date;
}

/** Each recipient of a non-deleted shoutout sent this quarter uses one unit of budget. */
export async function getBudget(
  db: DbClient,
  userId: string,
  allowance: number,
  now = new Date(),
): Promise<Budget> {
  const { start, end } = quarterBounds(now);
  const used = await db.shoutoutRecipient.count({
    where: {
      shoutout: { senderId: userId, deletedAt: null, createdAt: { gte: start, lt: end } },
    },
  });
  return { allowance, used, remaining: Math.max(0, allowance - used), resetsAt: end };
}
