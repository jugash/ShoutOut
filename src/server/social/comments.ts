import { z } from "zod";
import type { Db } from "@/lib/db";
import { COMMENT_MAX_LENGTH } from "@/lib/reactions";
import { sql } from "@/lib/sql";
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

export interface CommentRecord {
  id: string;
  shoutoutId: string;
  authorId: string;
  body: string;
  createdAt: Date;
  deletedAt: Date | null;
}

const COMMENT_COLUMNS = sql`id, shoutout_id AS "shoutoutId", author_id AS "authorId", body,
  created_at AS "createdAt", deleted_at AS "deletedAt"`;

/** Anyone who can see a shoutout can comment on it. */
export async function addComment(
  db: Db,
  userId: string,
  shoutoutId: string,
  body: string,
  now = new Date(),
): Promise<CommentRecord> {
  const shoutout = await db.one(
    sql`SELECT s.id FROM shoutouts s WHERE s.id = ${shoutoutId} AND ${visibleTo(userId)}`,
  );
  if (!shoutout) throw new DomainError("NOT_FOUND", "That shoutout doesn't exist");
  return (await db.one<CommentRecord>(sql`
    INSERT INTO comments (shoutout_id, author_id, body, created_at, updated_at)
    VALUES (${shoutoutId}, ${userId}, ${body}, ${now}, ${now})
    RETURNING ${COMMENT_COLUMNS}`))!;
}

export async function listComments(
  db: Db,
  viewerId: string,
  shoutoutId: string,
): Promise<CommentView[]> {
  const rows = await db.rows<Omit<CommentView, "canDelete">>(sql`
    SELECT cm.id, cm.body, cm.created_at AS "createdAt",
      json_build_object('id', a.id, 'name', a.name) AS author
    FROM comments cm
    JOIN shoutouts s ON s.id = cm.shoutout_id
    JOIN users a ON a.id = cm.author_id
    WHERE cm.shoutout_id = ${shoutoutId} AND cm.deleted_at IS NULL AND ${visibleTo(viewerId)}
    ORDER BY cm.created_at ASC, cm.id ASC`);
  return rows.map((row) => ({ ...row, canDelete: row.author.id === viewerId }));
}

/** Authors can delete their own comments. */
export async function deleteComment(db: Db, userId: string, commentId: string, now = new Date()) {
  const comment = await db.one<CommentRecord>(
    sql`SELECT ${COMMENT_COLUMNS} FROM comments WHERE id = ${commentId} AND deleted_at IS NULL`,
  );
  if (!comment) throw new DomainError("NOT_FOUND", "That comment doesn't exist");
  if (comment.authorId !== userId) {
    throw new DomainError("FORBIDDEN", "You can only delete your own comments");
  }
  await db.execute(
    sql`UPDATE comments SET deleted_at = ${now}, updated_at = ${now} WHERE id = ${commentId}`,
  );
  return comment;
}
