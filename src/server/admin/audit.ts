import type { Prisma } from "@/generated/prisma/client";
import type { Db, DbClient } from "@/lib/db";

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
  db: DbClient,
  entry: {
    actorId: string;
    action: AuditAction;
    targetType: "shoutout" | "card" | "value" | "export";
    targetId: string;
    details?: Prisma.InputJsonObject;
  },
) {
  return db.auditLog.create({ data: { ...entry, details: entry.details ?? {} } });
}

export interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Prisma.JsonValue;
  createdAt: Date;
  actor: { id: string; name: string };
}

export async function listAudit(
  db: Db,
  { cursor, limit = 50 }: { cursor?: string; limit?: number } = {},
): Promise<{ entries: AuditEntry[]; nextCursor: string | null }> {
  const rows = await db.auditLog.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      details: true,
      createdAt: true,
      actor: { select: { id: true, name: true } },
    },
  });
  const hasMore = rows.length > limit;
  const entries = hasMore ? rows.slice(0, limit) : rows;
  return { entries, nextCursor: hasMore ? entries[entries.length - 1].id : null };
}
