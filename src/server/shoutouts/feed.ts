import type { Db } from "@/lib/db";
import type { Prisma, Visibility } from "@/generated/prisma/client";
import { summarizeReactions, type ReactionSummary } from "@/lib/reactions";
import { canModify } from "./manage";

export interface FeedItem {
  id: string;
  message: string;
  visibility: Visibility;
  createdAt: Date;
  editedAt: Date | null;
  card: {
    id: string;
    slug: string;
    title: string;
    tagline: string;
    illustration: string;
    tone: string;
  };
  value: { id: string; name: string };
  sender: { id: string; name: string };
  recipients: { id: string; name: string }[];
  reactions: ReactionSummary[];
  commentCount: number;
  canModify: boolean;
  /** Anyone except the sender can report a shoutout. */
  canReport: boolean;
}

export interface FeedFilters {
  /** Shoutouts this person sent or received. */
  personId?: string;
  valueId?: string;
  cardId?: string;
  /** Inclusive start of day (UTC). */
  from?: Date;
  /** Inclusive end day (UTC); everything before the following midnight. */
  to?: Date;
  /** Text in the message. */
  query?: string;
}

const include = {
  card: {
    select: { id: true, slug: true, title: true, tagline: true, illustration: true, tone: true },
  },
  value: { select: { id: true, name: true } },
  sender: { select: { id: true, name: true } },
  recipients: {
    select: { user: { select: { id: true, name: true } } },
    orderBy: { user: { name: "asc" } },
  },
  reactions: {
    select: { emoji: true, userId: true, user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  },
  _count: { select: { comments: { where: { deletedAt: null } } } },
} satisfies Prisma.ShoutoutInclude;

type ShoutoutWithRelations = Prisma.ShoutoutGetPayload<{ include: typeof include }>;

/** Public shoutouts, plus private ones the viewer sent or received. */
export function visibleTo(viewerId: string): Prisma.ShoutoutWhereInput {
  return {
    deletedAt: null,
    moderationStatus: "VISIBLE",
    OR: [
      { visibility: "PUBLIC" },
      { senderId: viewerId },
      { recipients: { some: { userId: viewerId } } },
    ],
  };
}

export function involving(personId: string): Prisma.ShoutoutWhereInput {
  return { OR: [{ senderId: personId }, { recipients: { some: { userId: personId } } }] };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function filtersWhere(filters: FeedFilters): Prisma.ShoutoutWhereInput[] {
  const where: Prisma.ShoutoutWhereInput[] = [];
  if (filters.personId) where.push(involving(filters.personId));
  if (filters.valueId) where.push({ valueId: filters.valueId });
  if (filters.cardId) where.push({ cardId: filters.cardId });
  if (filters.from) where.push({ createdAt: { gte: filters.from } });
  if (filters.to) where.push({ createdAt: { lt: new Date(filters.to.getTime() + DAY_MS) } });
  const query = filters.query?.trim();
  if (query) where.push({ message: { contains: query, mode: "insensitive" } });
  return where;
}

function toFeedItem(row: ShoutoutWithRelations, viewerId: string, now: Date): FeedItem {
  return {
    id: row.id,
    message: row.message,
    visibility: row.visibility,
    createdAt: row.createdAt,
    editedAt: row.editedAt,
    card: row.card,
    value: row.value,
    sender: row.sender,
    recipients: row.recipients.map((r) => r.user),
    reactions: summarizeReactions(row.reactions, viewerId),
    commentCount: row._count.comments,
    canModify: canModify(row, viewerId, now),
    canReport: row.senderId !== viewerId,
  };
}

export interface Page {
  items: FeedItem[];
  nextCursor: string | null;
}

/** Newest-first shoutouts matching `where`, with cursor paging. */
export async function listShoutouts(
  db: Db,
  viewerId: string,
  where: Prisma.ShoutoutWhereInput,
  { cursor, limit = 20, now = new Date() }: { cursor?: string; limit?: number; now?: Date } = {},
): Promise<Page> {
  const rows = await db.shoutout.findMany({
    where,
    include,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    items: page.map((row) => toFeedItem(row, viewerId, now)),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export function listFeed(
  db: Db,
  viewerId: string,
  options: { cursor?: string; limit?: number; now?: Date; filters?: FeedFilters } = {},
): Promise<Page> {
  const { filters = {}, ...paging } = options;
  return listShoutouts(
    db,
    viewerId,
    { AND: [visibleTo(viewerId), ...filtersWhere(filters)] },
    paging,
  );
}

export async function getVisibleShoutout(
  db: Db,
  viewerId: string,
  id: string,
  now = new Date(),
): Promise<FeedItem | null> {
  const row = await db.shoutout.findFirst({ where: { id, ...visibleTo(viewerId) }, include });
  return row ? toFeedItem(row, viewerId, now) : null;
}
