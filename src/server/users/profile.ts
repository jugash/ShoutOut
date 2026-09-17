import type { Prisma } from "@/generated/prisma/client";
import type { Db } from "@/lib/db";
import { listShoutouts, visibleTo, type Page } from "../shoutouts/feed";

export type ProfileTab = "received" | "sent";

export interface Profile {
  person: { id: string; name: string; email: string; active: boolean };
  isSelf: boolean;
  received: number;
  sent: number;
  topValues: { name: string; count: number }[];
}

/**
 * What a viewer may see on someone's profile: other people see only public
 * shoutouts; on your own profile you also see private ones.
 */
export function profileVisibility(viewerId: string, personId: string): Prisma.ShoutoutWhereInput {
  return viewerId === personId ? visibleTo(viewerId) : { deletedAt: null, visibility: "PUBLIC" };
}

function tabWhere(personId: string, tab: ProfileTab): Prisma.ShoutoutWhereInput {
  return tab === "sent" ? { senderId: personId } : { recipients: { some: { userId: personId } } };
}

export async function getProfile(
  db: Db,
  viewerId: string,
  personId: string,
): Promise<Profile | null> {
  const person = await db.user.findUnique({
    where: { id: personId },
    select: { id: true, name: true, email: true, active: true },
  });
  if (!person) return null;

  const visible = profileVisibility(viewerId, personId);
  const receivedWhere = { AND: [visible, tabWhere(personId, "received")] };
  const [received, sent, valueCounts] = await Promise.all([
    db.shoutout.count({ where: receivedWhere }),
    db.shoutout.count({ where: { AND: [visible, tabWhere(personId, "sent")] } }),
    db.shoutout.groupBy({
      by: ["valueId"],
      where: receivedWhere,
      _count: { _all: true },
      orderBy: { _count: { valueId: "desc" } },
      take: 3,
    }),
  ]);
  const values = await db.companyValue.findMany({
    where: { id: { in: valueCounts.map((v) => v.valueId) } },
    select: { id: true, name: true },
  });
  const topValues = valueCounts.map((v) => ({
    name: values.find((value) => value.id === v.valueId)?.name ?? "Unknown",
    count: v._count._all,
  }));

  return { person, isSelf: viewerId === personId, received, sent, topValues };
}

export function listProfileShoutouts(
  db: Db,
  viewerId: string,
  personId: string,
  tab: ProfileTab,
  options: { cursor?: string; limit?: number; now?: Date } = {},
): Promise<Page> {
  return listShoutouts(
    db,
    viewerId,
    { AND: [profileVisibility(viewerId, personId), tabWhere(personId, tab)] },
    options,
  );
}
