import type { Db } from "@/lib/db";
import type { Prisma, Visibility } from "@/generated/prisma/client";
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
  canModify: boolean;
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
} satisfies Prisma.ShoutoutInclude;

type ShoutoutWithRelations = Prisma.ShoutoutGetPayload<{ include: typeof include }>;

/** Public shoutouts, plus private ones the viewer sent or received. */
export function visibleTo(viewerId: string): Prisma.ShoutoutWhereInput {
  return {
    deletedAt: null,
    OR: [
      { visibility: "PUBLIC" },
      { senderId: viewerId },
      { recipients: { some: { userId: viewerId } } },
    ],
  };
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
    canModify: canModify(row, viewerId, now),
  };
}

export async function listFeed(
  db: Db,
  viewerId: string,
  { cursor, limit = 20, now = new Date() }: { cursor?: string; limit?: number; now?: Date } = {},
): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  const rows = await db.shoutout.findMany({
    where: visibleTo(viewerId),
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

export async function getVisibleShoutout(
  db: Db,
  viewerId: string,
  id: string,
  now = new Date(),
): Promise<FeedItem | null> {
  const row = await db.shoutout.findFirst({ where: { id, ...visibleTo(viewerId) }, include });
  return row ? toFeedItem(row, viewerId, now) : null;
}
