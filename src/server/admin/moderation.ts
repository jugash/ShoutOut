import { z } from "zod";
import type { ReportReason, ReportResolution } from "@/generated/prisma/client";
import type { Db } from "@/lib/db";
import { summarizeReactions } from "@/lib/reactions";
import { DomainError } from "../errors";
import type { FeedItem } from "../shoutouts/feed";
import { visibleTo } from "../shoutouts/feed";
import { recordAudit } from "./audit";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "INAPPROPRIATE", label: "Inappropriate for work" },
  { value: "OFFENSIVE", label: "Offensive or hurtful" },
  { value: "SPAM", label: "Spam or gaming the system" },
  { value: "OTHER", label: "Something else" },
];

export const reportSchema = z.object({
  reason: z.enum(["INAPPROPRIATE", "OFFENSIVE", "SPAM", "OTHER"], { message: "Pick a reason" }),
  note: z
    .string()
    .trim()
    .max(500, "Keep it to 500 characters or fewer")
    .transform((note) => note || undefined),
});

export interface ReportInput {
  reason: ReportReason;
  note?: string;
}

/**
 * Reports a shoutout the reporter can see. It is hidden from everyone straight
 * away until an admin restores or removes it.
 */
export async function reportShoutout(
  db: Db,
  reporterId: string,
  shoutoutId: string,
  input: ReportInput,
  now = new Date(),
) {
  // Checked first: once reported, the shoutout is hidden from the reporter too.
  const existing = await db.report.findUnique({
    where: { shoutoutId_reporterId: { shoutoutId, reporterId } },
  });
  if (existing) throw new DomainError("ALREADY_REPORTED", "You've already reported this shoutout");
  const shoutout = await db.shoutout.findFirst({
    where: { id: shoutoutId, ...visibleTo(reporterId) },
    select: { id: true, senderId: true },
  });
  if (!shoutout) throw new DomainError("NOT_FOUND", "That shoutout doesn't exist");
  if (shoutout.senderId === reporterId) {
    throw new DomainError("FORBIDDEN", "You can't report your own shoutout. Delete it instead.");
  }

  return db.$transaction(async (tx) => {
    const report = await tx.report.create({
      data: { shoutoutId, reporterId, reason: input.reason, note: input.note, createdAt: now },
    });
    await tx.shoutout.update({ where: { id: shoutoutId }, data: { moderationStatus: "HIDDEN" } });
    await recordAudit(tx, {
      actorId: reporterId,
      action: "shoutout.reported",
      targetType: "shoutout",
      targetId: shoutoutId,
      details: { reason: input.reason },
    });
    return report;
  });
}

const reportedInclude = {
  card: {
    select: { id: true, slug: true, title: true, tagline: true, illustration: true, tone: true },
  },
  value: { select: { id: true, name: true } },
  sender: { select: { id: true, name: true } },
  recipients: {
    select: { user: { select: { id: true, name: true } } },
    orderBy: { user: { name: "asc" } },
  },
  reactions: { select: { emoji: true, userId: true, user: { select: { name: true } } } },
  _count: { select: { comments: { where: { deletedAt: null } } } },
  reports: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      reason: true,
      note: true,
      createdAt: true,
      resolvedAt: true,
      resolution: true,
      reporter: { select: { id: true, name: true } },
      resolvedBy: { select: { id: true, name: true } },
    },
  },
} as const;

export interface ReportView {
  id: string;
  reason: ReportReason;
  note: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolution: ReportResolution | null;
  reporter: { id: string; name: string };
  resolvedBy: { id: string; name: string } | null;
}

export interface ModerationCase {
  shoutout: FeedItem;
  status: "VISIBLE" | "HIDDEN" | "REMOVED";
  reports: ReportView[];
}

type ReportedRow = Awaited<ReturnType<typeof loadCases>>[number];

function loadCases(db: Db, where: object, take: number) {
  return db.shoutout.findMany({
    where: { deletedAt: null, ...where },
    include: reportedInclude,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take,
  });
}

function toCase(row: ReportedRow, reports: ReportView[]): ModerationCase {
  return {
    status: row.moderationStatus,
    reports,
    shoutout: {
      id: row.id,
      message: row.message,
      visibility: row.visibility,
      createdAt: row.createdAt,
      editedAt: row.editedAt,
      card: row.card,
      value: row.value,
      sender: row.sender,
      recipients: row.recipients.map((r) => r.user),
      reactions: summarizeReactions(row.reactions, ""),
      commentCount: row._count.comments,
      canModify: false,
      canReport: false,
    },
  };
}

/** Hidden shoutouts waiting for review, oldest report first. Includes private ones. */
export async function listPendingCases(db: Db, limit = 50): Promise<ModerationCase[]> {
  const rows = await loadCases(
    db,
    { moderationStatus: "HIDDEN", reports: { some: { resolvedAt: null } } },
    limit,
  );
  return rows
    .map((row) =>
      toCase(
        row,
        row.reports.filter((r) => !r.resolvedAt),
      ),
    )
    .sort((a, b) => a.reports[0].createdAt.getTime() - b.reports[0].createdAt.getTime());
}

/** Recently reviewed shoutouts. */
export async function listResolvedCases(db: Db, limit = 20): Promise<ModerationCase[]> {
  const rows = await loadCases(
    db,
    { reports: { some: { resolvedAt: { not: null } }, none: { resolvedAt: null } } },
    limit,
  );
  return rows.map((row) => toCase(row, row.reports));
}

export async function countPendingCases(db: Db): Promise<number> {
  return db.shoutout.count({
    where: { deletedAt: null, moderationStatus: "HIDDEN", reports: { some: { resolvedAt: null } } },
  });
}

/** Restores (makes visible again) or removes a reported shoutout and closes its reports. */
export async function resolveCase(
  db: Db,
  adminId: string,
  shoutoutId: string,
  resolution: ReportResolution,
  now = new Date(),
) {
  return db.$transaction(async (tx) => {
    const shoutout = await tx.shoutout.findFirst({
      where: { id: shoutoutId, deletedAt: null, moderationStatus: "HIDDEN" },
      select: { id: true },
    });
    if (!shoutout) {
      throw new DomainError("INVALID_STATE", "This shoutout isn't waiting for review any more");
    }
    const { count } = await tx.report.updateMany({
      where: { shoutoutId, resolvedAt: null },
      data: { resolvedAt: now, resolution, resolvedById: adminId },
    });
    await tx.shoutout.update({
      where: { id: shoutoutId },
      data: { moderationStatus: resolution === "RESTORED" ? "VISIBLE" : "REMOVED" },
    });
    await recordAudit(tx, {
      actorId: adminId,
      action: resolution === "RESTORED" ? "shoutout.restored" : "shoutout.removed",
      targetType: "shoutout",
      targetId: shoutoutId,
      details: { reports: count },
    });
  });
}
