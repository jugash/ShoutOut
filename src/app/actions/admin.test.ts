import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/server/errors";

const requireAdmin = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`);
});
const revalidatePath = vi.fn();
const catalog = {
  createCard: vi.fn(),
  updateCard: vi.fn(),
  moveCard: vi.fn(),
  setCardActive: vi.fn(),
  createValue: vi.fn(),
  renameValue: vi.fn(),
  moveValue: vi.fn(),
  setValueActive: vi.fn(),
};
const resolveCase = vi.fn();

vi.mock("@/app/admin/guard", () => ({ requireAdmin }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/db", () => ({ getDb: () => ({ db: true }) }));
vi.mock("@/server/admin/moderation", () => ({ resolveCase }));
vi.mock("@/server/admin/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/admin/catalog")>()),
  ...catalog,
}));

const actions = await import("./admin");
const idle = { status: "idle" } as const;
const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(entries)) data.append(k, v);
  return data;
};
const card = { title: "High Five", tagline: "Nice", illustration: "trophy", tone: "sky" };

describe("admin actions", () => {
  beforeEach(() => {
    requireAdmin.mockResolvedValue({ id: "admin-1" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    for (const fn of [...Object.values(catalog), resolveCase]) fn.mockReset();
  });

  it("requires an admin", async () => {
    requireAdmin.mockRejectedValue(new Error("NOT_FOUND"));
    await expect(actions.moveCardAction("c1", "up")).rejects.toThrow("NOT_FOUND");
    expect(catalog.moveCard).not.toHaveBeenCalled();
  });

  it("resolves reports with a notice", async () => {
    await expect(actions.resolveReportAction("s1", "RESTORED")).rejects.toThrow(
      "REDIRECT /admin?notice=restored",
    );
    expect(resolveCase).toHaveBeenCalledWith({ db: true }, "admin-1", "s1", "RESTORED");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    await expect(actions.resolveReportAction("s1", "REMOVED")).rejects.toThrow("notice=removed");
    resolveCase.mockRejectedValue(new DomainError("INVALID_STATE", "done"));
    await expect(actions.resolveReportAction("s1", "REMOVED")).rejects.toThrow(
      "notice=admin-failed",
    );
    resolveCase.mockRejectedValue(new Error("boom"));
    await expect(actions.resolveReportAction("s1", "REMOVED")).rejects.toThrow("boom");
  });

  describe("saveCardAction", () => {
    it("creates or updates cards", async () => {
      await expect(actions.saveCardAction(null, idle, form(card))).rejects.toThrow(
        "REDIRECT /admin/cards?notice=card-saved",
      );
      expect(catalog.createCard).toHaveBeenCalledWith({ db: true }, "admin-1", card);
      await expect(actions.saveCardAction("c1", idle, form(card))).rejects.toThrow("card-saved");
      expect(catalog.updateCard).toHaveBeenCalledWith({ db: true }, "admin-1", "c1", card);
    });

    it("validates and reports duplicates", async () => {
      const state = await actions.saveCardAction(null, idle, new FormData());
      expect(state).toMatchObject({
        status: "error",
        fieldErrors: {
          title: "Give the card a title",
          illustration: "Pick an illustration",
          tone: "Pick a colour",
        },
      });
      catalog.createCard.mockRejectedValue(new DomainError("DUPLICATE", "Exists", "title"));
      expect(await actions.saveCardAction(null, idle, form(card))).toEqual({
        status: "error",
        message: "Exists",
        fieldErrors: { title: "Exists" },
      });
      catalog.updateCard.mockRejectedValue(new DomainError("NOT_FOUND", "Gone"));
      expect(await actions.saveCardAction("c1", idle, form(card))).toEqual({
        status: "error",
        message: "Gone",
        fieldErrors: {},
      });
      catalog.createCard.mockRejectedValue(new Error("boom"));
      await expect(actions.saveCardAction(null, idle, form(card))).rejects.toThrow("boom");
    });
  });

  it("moves, retires and restores cards and values", async () => {
    await expect(actions.moveCardAction("c1", "down")).rejects.toThrow(
      "/admin/cards?notice=card-moved",
    );
    expect(catalog.moveCard).toHaveBeenCalledWith({ db: true }, "admin-1", "c1", "down");
    await expect(actions.setCardActiveAction("c1", false)).rejects.toThrow("notice=card-retired");
    await expect(actions.setCardActiveAction("c1", true)).rejects.toThrow("notice=card-restored");
    catalog.setCardActive.mockRejectedValue(new DomainError("LAST_ACTIVE", "Keep one"));
    await expect(actions.setCardActiveAction("c1", false)).rejects.toThrow("notice=last-active");

    await expect(actions.moveValueAction("v1", "up")).rejects.toThrow(
      "/admin/values?notice=value-moved",
    );
    await expect(actions.setValueActiveAction("v1", false)).rejects.toThrow("notice=value-retired");
    await expect(actions.setValueActiveAction("v1", true)).rejects.toThrow("notice=value-restored");
    expect(catalog.setValueActive).toHaveBeenLastCalledWith({ db: true }, "admin-1", "v1", true);
  });

  describe("values", () => {
    it("creates and renames values", async () => {
      await expect(actions.createValueAction(idle, form({ name: " Kindness " }))).rejects.toThrow(
        "/admin/values?notice=value-saved",
      );
      expect(catalog.createValue).toHaveBeenCalledWith({ db: true }, "admin-1", "Kindness");
      await expect(actions.renameValueAction("v1", idle, form({ name: "Care" }))).rejects.toThrow(
        "value-saved",
      );
      expect(catalog.renameValue).toHaveBeenCalledWith({ db: true }, "admin-1", "v1", "Care");
    });

    it("validates and reports errors", async () => {
      for (const run of [
        () => actions.createValueAction(idle, form({ name: "" })),
        () => actions.renameValueAction("v1", idle, new FormData()),
      ]) {
        expect(await run()).toMatchObject({
          status: "error",
          fieldErrors: { name: "Give the value a name" },
        });
      }
      catalog.createValue.mockRejectedValue(new DomainError("DUPLICATE", "Exists", "name"));
      expect(await actions.createValueAction(idle, form({ name: "Integrity" }))).toMatchObject({
        fieldErrors: { name: "Exists" },
      });
      catalog.renameValue.mockRejectedValue(new DomainError("DUPLICATE", "Exists", "name"));
      expect(
        await actions.renameValueAction("v1", idle, form({ name: "Integrity" })),
      ).toMatchObject({
        message: "Exists",
      });
    });
  });
});
