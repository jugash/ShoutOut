import { Prisma } from "@/generated/prisma/client";
import type { Db } from "@/lib/db";
import { rangeSql, topRecipients, topSenders, topValues } from "../insights/leaderboard";
import type { DateRange, LeaderboardPeriod } from "../insights/periods";
import { PERIOD_LABELS, periodRange } from "../insights/periods";
import { toCsv } from "./csv";

/** Visible (not deleted or moderated) shoutouts. Private messages are not exported. */
export async function exportShoutoutsCsv(db: Db, range: DateRange): Promise<string> {
  const rows = await db.shoutout.findMany({
    where: {
      deletedAt: null,
      moderationStatus: "VISIBLE",
      createdAt: {
        ...(range.start ? { gte: range.start } : {}),
        ...(range.end ? { lt: range.end } : {}),
      },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      sender: { select: { name: true, email: true } },
      recipients: {
        select: { user: { select: { name: true, email: true } } },
        orderBy: { user: { name: "asc" } },
      },
      card: { select: { title: true } },
      value: { select: { name: true } },
      _count: { select: { reactions: true, comments: { where: { deletedAt: null } } } },
    },
  });
  return toCsv(rows, [
    { header: "id", value: (r) => r.id },
    { header: "created_at", value: (r) => r.createdAt },
    { header: "sender_name", value: (r) => r.sender.name },
    { header: "sender_email", value: (r) => r.sender.email },
    { header: "recipient_names", value: (r) => r.recipients.map((x) => x.user.name).join("; ") },
    { header: "recipient_emails", value: (r) => r.recipients.map((x) => x.user.email).join("; ") },
    { header: "recipient_count", value: (r) => r.recipients.length },
    { header: "card", value: (r) => r.card.title },
    { header: "value", value: (r) => r.value.name },
    { header: "visibility", value: (r) => r.visibility.toLowerCase() },
    { header: "message", value: (r) => (r.visibility === "PUBLIC" ? r.message : "[private]") },
    { header: "reactions", value: (r) => r._count.reactions },
    { header: "comments", value: (r) => r._count.comments },
    { header: "edited", value: (r) => r.editedAt !== null },
  ]);
}

interface PersonRow {
  name: string;
  email: string;
  active: boolean;
  received: number;
  recognised: number;
  sent: number;
  lastReceivedAt: Date | null;
  lastSentAt: Date | null;
}

/** One row per person: activity within the range. */
export async function exportPeopleCsv(db: Db, range: DateRange): Promise<string> {
  const where = rangeSql(range);
  const rows = await db.$queryRaw<PersonRow[]>(Prisma.sql`
    SELECT u.name, u.email, u.active,
      (SELECT COUNT(*)::int FROM shoutout_recipients r JOIN shoutouts s ON s.id = r.shoutout_id
        WHERE r.user_id = u.id AND ${where}) AS received,
      (SELECT COUNT(*)::int FROM shoutout_recipients r JOIN shoutouts s ON s.id = r.shoutout_id
        WHERE s.sender_id = u.id AND ${where}) AS recognised,
      (SELECT COUNT(*)::int FROM shoutouts s WHERE s.sender_id = u.id AND ${where}) AS sent,
      (SELECT MAX(s.created_at) FROM shoutout_recipients r JOIN shoutouts s ON s.id = r.shoutout_id
        WHERE r.user_id = u.id AND ${where}) AS "lastReceivedAt",
      (SELECT MAX(s.created_at) FROM shoutouts s WHERE s.sender_id = u.id AND ${where}) AS "lastSentAt"
    FROM users u
    ORDER BY u.name ASC, u.email ASC`);
  return toCsv(rows, [
    { header: "name", value: (r) => r.name },
    { header: "email", value: (r) => r.email },
    { header: "active", value: (r) => r.active },
    { header: "shoutouts_received", value: (r) => r.received },
    { header: "shoutouts_sent", value: (r) => r.sent },
    { header: "colleagues_recognised", value: (r) => r.recognised },
    { header: "last_received_at", value: (r) => r.lastReceivedAt },
    { header: "last_sent_at", value: (r) => r.lastSentAt },
  ]);
}

/** All three leaderboards (full rankings, not just the top 10) for a period. */
export async function exportLeaderboardsCsv(
  db: Db,
  period: LeaderboardPeriod,
  now = new Date(),
): Promise<string> {
  const range = periodRange(period, now);
  const [recipients, senders, values] = await Promise.all([
    topRecipients(db, range, Number.MAX_SAFE_INTEGER),
    topSenders(db, range, Number.MAX_SAFE_INTEGER),
    topValues(db, range),
  ]);
  const rows = [
    ...recipients.entries.map((e) => ({
      board: "Most recognised",
      unit: "shoutouts received",
      ...e,
    })),
    ...senders.entries.map((e) => ({
      board: "Top recognisers",
      unit: "colleagues recognised",
      ...e,
    })),
    ...values.entries.map((e) => ({ board: "Top values", unit: "shoutouts", ...e })),
  ];
  return toCsv(rows, [
    { header: "period", value: () => PERIOD_LABELS[period] },
    { header: "board", value: (r) => r.board },
    { header: "rank", value: (r) => r.rank },
    { header: "name", value: (r) => r.name },
    { header: "count", value: (r) => r.count },
    { header: "unit", value: (r) => r.unit },
  ]);
}
