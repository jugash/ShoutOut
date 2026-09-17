import type { Db } from "@/lib/db";
import { empty, sql } from "@/lib/sql";

export type AuditAction =
  | "shoutout.reported"
  | "shoutout.restored"
  | "shoutout.removed"
  | "card.created"
  | "card.updated"
  | "card.moved"
  | "card.retired"
  | "card.restored"
  | "value.created"
  | "value.renamed"
  | "value.moved"
  | "value.retired"
  | "value.restored"
  | "export.downloaded";

export function recordAudit(
  db: Db,
  entry: {
    actorId: string;
    action: AuditAction;
    targetType: "shoutout" | "card" | "value" | "export";
    targetId: string;
    details?: Record<string, unknown>;
  },
) {
  return db.execute(sql`
    INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
    VALUES (${entry.actorId}, ${entry.action}, ${entry.targetType}, ${entry.targetId},
      ${JSON.stringify(entry.details ?? {})}::jsonb)`);
}

export interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: unknown;
  createdAt: Date;
  actor: { id: string; name: string };
}

export async function listAudit(
  db: Db,
  { cursor, limit = 50 }: { cursor?: string; limit?: number } = {},
): Promise<{ entries: AuditEntry[]; nextCursor: string | null }> {
  const rows = await db.rows<AuditEntry>(sql`
    SELECT l.id, l.action, l.target_type AS "targetType", l.target_id AS "targetId", l.details,
      l.created_at AS "createdAt", json_build_object('id', a.id, 'name', a.name) AS actor
    FROM audit_logs l JOIN users a ON a.id = l.actor_id
    ${cursor ? sql`WHERE (l.created_at, l.id) < (SELECT created_at, id FROM audit_logs WHERE id = ${cursor})` : empty}
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT ${limit + 1}`);
  const hasMore = rows.length > limit;
  const entries = hasMore ? rows.slice(0, limit) : rows;
  return { entries, nextCursor: hasMore ? entries[entries.length - 1].id : null };
}
