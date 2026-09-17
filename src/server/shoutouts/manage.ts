import type { Db } from "@/lib/db";
import { DomainError } from "../errors";
import type { EditShoutoutInput } from "./validation";

export const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function canModify(
  shoutout: {
    senderId: string;
    createdAt: Date;
    deletedAt?: Date | null;
    moderationStatus?: string;
  },
  userId: string,
  now = new Date(),
): boolean {
  return (
    !shoutout.deletedAt &&
    (shoutout.moderationStatus ?? "VISIBLE") === "VISIBLE" &&
    shoutout.senderId === userId &&
    now.getTime() - shoutout.createdAt.getTime() <= EDIT_WINDOW_MS
  );
}

async function loadModifiable(db: Db, userId: string, id: string, now: Date) {
  const shoutout = await db.shoutout.findFirst({
    where: { id, deletedAt: null, moderationStatus: "VISIBLE" },
  });
  if (!shoutout) throw new DomainError("NOT_FOUND", "That shoutout doesn't exist");
  if (shoutout.senderId !== userId) {
    throw new DomainError("FORBIDDEN", "Only the sender can change this shoutout");
  }
  if (!canModify(shoutout, userId, now)) {
    throw new DomainError(
      "EDIT_WINDOW_CLOSED",
      "Shoutouts can only be changed within 24 hours of sending",
    );
  }
  return shoutout;
}

export async function updateShoutout(
  db: Db,
  userId: string,
  id: string,
  input: EditShoutoutInput,
  now = new Date(),
) {
  const shoutout = await loadModifiable(db, userId, id, now);

  // A card or value retired after sending can be kept, but not newly chosen.
  if (input.cardId !== shoutout.cardId) {
    const card = await db.card.findFirst({ where: { id: input.cardId, active: true } });
    if (!card) throw new DomainError("CARD_NOT_FOUND", "That card isn't available", "cardId");
  }
  if (input.valueId !== shoutout.valueId) {
    const value = await db.companyValue.findFirst({ where: { id: input.valueId, active: true } });
    if (!value) {
      throw new DomainError("VALUE_NOT_FOUND", "That value isn't available", "valueId");
    }
  }

  return db.shoutout.update({
    where: { id },
    data: { ...input, editedAt: now },
  });
}

/** Soft-deletes the shoutout; its recipients no longer count against the budget. */
export async function deleteShoutout(db: Db, userId: string, id: string, now = new Date()) {
  await loadModifiable(db, userId, id, now);
  await db.shoutout.update({ where: { id }, data: { deletedAt: now } });
}
