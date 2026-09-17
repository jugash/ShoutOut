import { z } from "zod";
import type { Db } from "@/lib/db";
import { COMMENT_MAX_LENGTH } from "@/lib/reactions";
import { DomainError } from "../errors";
import { visibleTo } from "../shoutouts/feed";

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a comment")
    .max(COMMENT_MAX_LENGTH, `Keep it to ${COMMENT_MAX_LENGTH} characters or fewer`),
});

export interface CommentView {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string };
  canDelete: boolean;
}

async function assertVisible(db: Db, userId: string, shoutoutId: string) {
  const shoutout = await db.shoutout.findFirst({
    where: { id: shoutoutId, ...visibleTo(userId) },
    select: { id: true },
  });
  if (!shoutout) throw new DomainError("NOT_FOUND", "That shoutout doesn't exist");
}

/** Anyone who can see a shoutout can comment on it. */
export async function addComment(
  db: Db,
  userId: string,
  shoutoutId: string,
  body: string,
  now = new Date(),
) {
  await assertVisible(db, userId, shoutoutId);
  return db.comment.create({
    data: { shoutoutId, authorId: userId, body, createdAt: now },
  });
}

export async function listComments(
  db: Db,
  viewerId: string,
  shoutoutId: string,
): Promise<CommentView[]> {
  const rows = await db.comment.findMany({
    where: { shoutoutId, deletedAt: null, shoutout: visibleTo(viewerId) },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  });
  return rows.map((row) => ({ ...row, canDelete: row.author.id === viewerId }));
}

/** Authors can delete their own comments. */
export async function deleteComment(db: Db, userId: string, commentId: string, now = new Date()) {
  const comment = await db.comment.findFirst({ where: { id: commentId, deletedAt: null } });
  if (!comment) throw new DomainError("NOT_FOUND", "That comment doesn't exist");
  if (comment.authorId !== userId) {
    throw new DomainError("FORBIDDEN", "You can only delete your own comments");
  }
  await db.comment.update({ where: { id: commentId }, data: { deletedAt: now } });
  return comment;
}
