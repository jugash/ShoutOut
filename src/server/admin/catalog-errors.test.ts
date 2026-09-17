import { describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/db";
import { recordAudit } from "./audit";
import { createCard, createValue, renameValue, updateCard } from "./catalog";

/** A database whose transactions fail with the given error. */
function failingDb(error: unknown) {
  return {
    card: {
      findUnique: vi.fn().mockResolvedValue(null),
      aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: null } }),
    },
    companyValue: {
      findUnique: vi.fn().mockResolvedValue(null),
      aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: 3 } }),
    },
    $transaction: vi.fn().mockRejectedValue(error),
  } as unknown as Db;
}

const card = { title: "T", tagline: "t", illustration: "heart" as const, tone: "coral" };

describe("catalog error handling", () => {
  it.each([new Error("connection lost"), "not even an error", { code: "P1001" }])(
    "rethrows unexpected errors (%j)",
    async (error) => {
      await expect(createCard(failingDb(error), "a", card)).rejects.toBe(error);
      await expect(updateCard(failingDb(error), "a", "c1", card)).rejects.toBe(error);
      await expect(createValue(failingDb(error), "a", "Kind")).rejects.toBe(error);
      await expect(renameValue(failingDb(error), "a", "v1", "Kind")).rejects.toBe(error);
    },
  );
});

describe("recordAudit", () => {
  it("defaults details to an empty object", async () => {
    const create = vi.fn();
    await recordAudit({ auditLog: { create } } as unknown as Db, {
      actorId: "a",
      action: "card.moved",
      targetType: "card",
      targetId: "c1",
    });
    expect(create).toHaveBeenCalledWith({
      data: { actorId: "a", action: "card.moved", targetType: "card", targetId: "c1", details: {} },
    });
  });
});

describe("first card or value", () => {
  it("starts the sort order at 1 when the catalogue is empty", async () => {
    const tx = {
      card: { create: vi.fn(async ({ data }) => ({ id: "c1", ...data })) },
      companyValue: { create: vi.fn(async ({ data }) => ({ id: "v1", ...data })) },
      auditLog: { create: vi.fn() },
    };
    const db = {
      card: {
        findUnique: vi.fn().mockResolvedValue(null),
        aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: null } }),
      },
      companyValue: {
        findUnique: vi.fn().mockResolvedValue(null),
        aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: null } }),
      },
      $transaction: vi.fn((run: (t: typeof tx) => unknown) => run(tx)),
    } as unknown as Db;
    await expect(createCard(db, "a", card)).resolves.toMatchObject({ sortOrder: 1, slug: "t" });
    await expect(createValue(db, "a", "Kind")).resolves.toMatchObject({
      sortOrder: 1,
      slug: "kind",
    });
  });
});
