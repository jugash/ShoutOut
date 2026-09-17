import { describe, expect, it, vi } from "vitest";
import type { Db } from "@/lib/db";
import { toQuery } from "@/lib/sql";
import { recordAudit } from "./audit";
import { createCard, createValue, renameValue, updateCard } from "./catalog";

/** A database whose transactions fail with the given error. */
function failingDb(error: unknown) {
  return {
    one: vi.fn().mockResolvedValue(null),
    transaction: vi.fn().mockRejectedValue(error),
  } as unknown as Db;
}

const card = { title: "T", tagline: "t", illustration: "heart" as const, tone: "coral" };

describe("catalog error handling", () => {
  it.each([new Error("connection lost"), "not even an error", { code: "57P01" }])(
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
    const execute = vi.fn();
    await recordAudit({ execute } as unknown as Db, {
      actorId: "a",
      action: "card.moved",
      targetType: "card",
      targetId: "c1",
    });
    expect(toQuery(execute.mock.calls[0][0]).values).toEqual([
      "a",
      "card.moved",
      "card",
      "c1",
      "{}",
    ]);
  });
});
