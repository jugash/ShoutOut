import type { Db } from "@/lib/db";
import { isReactionKey } from "@/lib/reactions";
import { sql } from "@/lib/sql";
import { DomainError } from "../errors";
import { visibleTo } from "../shoutouts/feed";

/** Adds the reaction, or removes it if the user already reacted with that emoji. */
export async function toggleReaction(
  db: Db,
  userId: string,
  shoutoutId: string,
  emoji: string,
): Promise<{ reacted: boolean }> {
  if (!isReactionKey(emoji)) {
    throw new DomainError("NOT_FOUND", "That reaction isn't available");
  }
  const shoutout = await db.one(
    sql`SELECT s.id FROM shoutouts s WHERE s.id = ${shoutoutId} AND ${visibleTo(userId)}`,
  );
  if (!shoutout) throw new DomainError("NOT_FOUND", "That shoutout doesn't exist");

  const removed = await db.execute(sql`
    DELETE FROM reactions
    WHERE shoutout_id = ${shoutoutId} AND user_id = ${userId} AND emoji = ${emoji}`);
  if (removed > 0) return { reacted: false };
  // ON CONFLICT so a double click can't fail on the primary key.
  await db.execute(sql`
    INSERT INTO reactions (shoutout_id, user_id, emoji) VALUES (${shoutoutId}, ${userId}, ${emoji})
    ON CONFLICT DO NOTHING`);
  return { reacted: true };
}
