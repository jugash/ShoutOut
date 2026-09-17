import type { Db } from "@/lib/db";
import { isReactionKey } from "@/lib/reactions";
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
  const shoutout = await db.shoutout.findFirst({
    where: { id: shoutoutId, ...visibleTo(userId) },
    select: { id: true },
  });
  if (!shoutout) throw new DomainError("NOT_FOUND", "That shoutout doesn't exist");

  const key = { shoutoutId_userId_emoji: { shoutoutId, userId, emoji } };
  const { count } = await db.reaction.deleteMany({ where: { shoutoutId, userId, emoji } });
  if (count > 0) return { reacted: false };
  // Upsert so a double click can't fail on the unique key.
  await db.reaction.upsert({ where: key, create: { shoutoutId, userId, emoji }, update: {} });
  return { reacted: true };
}
