import { z } from "zod";
import { CARD_TONES } from "@/components/cards/designs";
import { ILLUSTRATION_NAMES } from "@/components/cards/illustrations";
import type { Db } from "@/lib/db";
import { DomainError } from "../errors";
import { recordAudit } from "./audit";
import { moveInOrder, type Direction } from "./ordering";

export const cardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the card a title")
    .max(40, "Keep the title to 40 characters"),
  tagline: z
    .string()
    .trim()
    .min(1, "Add a short tagline")
    .max(60, "Keep the tagline to 60 characters"),
  illustration: z.enum(ILLUSTRATION_NAMES, { message: "Pick an illustration" }),
  tone: z.enum(CARD_TONES as [string, ...string[]], { message: "Pick a colour" }),
});

export const valueSchema = z.object({
  name: z.string().trim().min(1, "Give the value a name").max(40, "Keep the name to 40 characters"),
});

export type CardInput = z.output<typeof cardSchema>;

/** "Above & Beyond!" -> "above-beyond" */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

async function uniqueSlug(
  taken: (slug: string) => Promise<boolean>,
  text: string,
): Promise<string> {
  const base = slugify(text);
  let slug = base;
  for (let n = 2; await taken(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** Prisma error code, checked structurally (error classes can differ between bundles). */
function prismaCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

const isDuplicate = (error: unknown) => prismaCode(error) === "P2002";

// ---- cards ----

export async function listAllCards(db: Db) {
  const cards = await db.card.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: { _count: { select: { shoutouts: { where: { deletedAt: null } } } } },
  });
  return cards.map(({ _count, ...card }) => ({ ...card, uses: _count.shoutouts }));
}

export async function createCard(db: Db, adminId: string, input: CardInput) {
  const slug = await uniqueSlug(
    async (s) => Boolean(await db.card.findUnique({ where: { slug: s } })),
    input.title,
  );
  const last = await db.card.aggregate({ _max: { sortOrder: true } });
  try {
    return await db.$transaction(async (tx) => {
      const card = await tx.card.create({
        data: { ...input, slug, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      });
      await recordAudit(tx, {
        actorId: adminId,
        action: "card.created",
        targetType: "card",
        targetId: card.id,
        details: { title: card.title },
      });
      return card;
    });
  } catch (error) {
    if (isDuplicate(error))
      throw new DomainError("DUPLICATE", "A card with that title already exists", "title");
    throw error;
  }
}

export async function updateCard(db: Db, adminId: string, id: string, input: CardInput) {
  try {
    return await db.$transaction(async (tx) => {
      const card = await tx.card.update({ where: { id }, data: input });
      await recordAudit(tx, {
        actorId: adminId,
        action: "card.updated",
        targetType: "card",
        targetId: id,
        details: { ...input },
      });
      return card;
    });
  } catch (error) {
    if (isDuplicate(error))
      throw new DomainError("DUPLICATE", "A card with that title already exists", "title");
    if (prismaCode(error) === "P2025") {
      throw new DomainError("NOT_FOUND", "That card doesn't exist");
    }
    throw error;
  }
}

export async function moveCard(db: Db, adminId: string, id: string, direction: Direction) {
  const cards = await db.card.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { id: true },
  });
  const moved = await db.$transaction(async (tx) => {
    const ok = await moveInOrder(cards, id, direction, (cardId, sortOrder) =>
      tx.card.update({ where: { id: cardId }, data: { sortOrder } }),
    );
    if (ok)
      await recordAudit(tx, {
        actorId: adminId,
        action: "card.moved",
        targetType: "card",
        targetId: id,
        details: { direction },
      });
    return ok;
  });
  return moved;
}

export async function setCardActive(db: Db, adminId: string, id: string, active: boolean) {
  return db.$transaction(async (tx) => {
    const card = await tx.card.findUnique({ where: { id } });
    if (!card) throw new DomainError("NOT_FOUND", "That card doesn't exist");
    if (!active && card.active && (await tx.card.count({ where: { active: true } })) <= 1) {
      throw new DomainError("LAST_ACTIVE", "Keep at least one card available");
    }
    await tx.card.update({ where: { id }, data: { active } });
    await recordAudit(tx, {
      actorId: adminId,
      action: active ? "card.restored" : "card.retired",
      targetType: "card",
      targetId: id,
      details: { title: card.title },
    });
  });
}

// ---- values ----

export async function listAllValues(db: Db) {
  const values = await db.companyValue.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { shoutouts: { where: { deletedAt: null } } } } },
  });
  return values.map(({ _count, ...value }) => ({ ...value, uses: _count.shoutouts }));
}

export async function createValue(db: Db, adminId: string, name: string) {
  const slug = await uniqueSlug(
    async (s) => Boolean(await db.companyValue.findUnique({ where: { slug: s } })),
    name,
  );
  const last = await db.companyValue.aggregate({ _max: { sortOrder: true } });
  try {
    return await db.$transaction(async (tx) => {
      const value = await tx.companyValue.create({
        data: { name, slug, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      });
      await recordAudit(tx, {
        actorId: adminId,
        action: "value.created",
        targetType: "value",
        targetId: value.id,
        details: { name },
      });
      return value;
    });
  } catch (error) {
    if (isDuplicate(error))
      throw new DomainError("DUPLICATE", "A value with that name already exists", "name");
    throw error;
  }
}

export async function renameValue(db: Db, adminId: string, id: string, name: string) {
  try {
    return await db.$transaction(async (tx) => {
      const before = await tx.companyValue.findUnique({ where: { id } });
      if (!before) throw new DomainError("NOT_FOUND", "That value doesn't exist");
      const value = await tx.companyValue.update({ where: { id }, data: { name } });
      await recordAudit(tx, {
        actorId: adminId,
        action: "value.renamed",
        targetType: "value",
        targetId: id,
        details: { from: before.name, to: name },
      });
      return value;
    });
  } catch (error) {
    if (isDuplicate(error))
      throw new DomainError("DUPLICATE", "A value with that name already exists", "name");
    throw error;
  }
}

export async function moveValue(db: Db, adminId: string, id: string, direction: Direction) {
  const values = await db.companyValue.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });
  return db.$transaction(async (tx) => {
    const ok = await moveInOrder(values, id, direction, (valueId, sortOrder) =>
      tx.companyValue.update({ where: { id: valueId }, data: { sortOrder } }),
    );
    if (ok)
      await recordAudit(tx, {
        actorId: adminId,
        action: "value.moved",
        targetType: "value",
        targetId: id,
        details: { direction },
      });
    return ok;
  });
}

export async function setValueActive(db: Db, adminId: string, id: string, active: boolean) {
  return db.$transaction(async (tx) => {
    const value = await tx.companyValue.findUnique({ where: { id } });
    if (!value) throw new DomainError("NOT_FOUND", "That value doesn't exist");
    if (
      !active &&
      value.active &&
      (await tx.companyValue.count({ where: { active: true } })) <= 1
    ) {
      throw new DomainError("LAST_ACTIVE", "Keep at least one value available");
    }
    await tx.companyValue.update({ where: { id }, data: { active } });
    await recordAudit(tx, {
      actorId: adminId,
      action: active ? "value.restored" : "value.retired",
      targetType: "value",
      targetId: id,
      details: { name: value.name },
    });
  });
}
