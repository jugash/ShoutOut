import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/server/errors";

const auth = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
const revalidatePath = vi.fn();
const toggleReaction = vi.fn();
const addComment = vi.fn();
const deleteComment = vi.fn();

vi.mock("@/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/db", () => ({ getDb: () => ({ db: true }) }));
vi.mock("@/server/social/reactions", () => ({ toggleReaction }));
vi.mock("@/server/social/comments", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/social/comments")>()),
  addComment,
  deleteComment,
}));

const { addCommentAction, deleteCommentAction, toggleReactionAction } = await import("./social");

const form = (body?: string | File) => {
  const data = new FormData();
  if (body !== undefined) data.append("body", body);
  return data;
};

describe("social actions", () => {
  beforeEach(() => {
    auth.mockResolvedValue({ user: { id: "u1" } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires sign in", async () => {
    auth.mockResolvedValue(null);
    await expect(toggleReactionAction("s1", "fire")).rejects.toThrow("NEXT_REDIRECT /signin");
    await expect(addCommentAction("s1", { status: "idle" }, form("hi"))).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    await expect(deleteCommentAction("c1")).rejects.toThrow("NEXT_REDIRECT");
  });

  describe("toggleReactionAction", () => {
    it("toggles and refreshes pages", async () => {
      await toggleReactionAction("s1", "fire");
      expect(toggleReaction).toHaveBeenCalledWith({ db: true }, "u1", "s1", "fire");
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("ignores business errors but not unexpected ones", async () => {
      toggleReaction.mockRejectedValueOnce(new DomainError("NOT_FOUND", "gone"));
      await expect(toggleReactionAction("s1", "fire")).resolves.toBeUndefined();
      toggleReaction.mockRejectedValueOnce(new Error("db down"));
      await expect(toggleReactionAction("s1", "fire")).rejects.toThrow("db down");
    });
  });

  describe("addCommentAction", () => {
    it("adds a trimmed comment", async () => {
      vi.spyOn(Date, "now").mockReturnValue(42);
      expect(await addCommentAction("s1", { status: "idle" }, form("  Nice!  "))).toEqual({
        status: "saved",
        savedAt: 42,
      });
      expect(addComment).toHaveBeenCalledWith({ db: true }, "u1", "s1", "Nice!");
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("validates the body", async () => {
      for (const body of [undefined, new File(["x"], "x.txt"), "   "]) {
        expect(await addCommentAction("s1", { status: "idle" }, form(body))).toEqual({
          status: "error",
          message: "Write a comment",
          fieldErrors: { body: "Write a comment" },
        });
      }
      expect(addComment).not.toHaveBeenCalled();
    });

    it("reports business errors and rethrows others", async () => {
      addComment.mockRejectedValueOnce(new DomainError("NOT_FOUND", "That shoutout doesn't exist"));
      expect(await addCommentAction("s1", { status: "idle" }, form("hi"))).toEqual({
        status: "error",
        message: "That shoutout doesn't exist",
        fieldErrors: {},
      });
      addComment.mockRejectedValueOnce(new Error("boom"));
      await expect(addCommentAction("s1", { status: "idle" }, form("hi"))).rejects.toThrow("boom");
    });
  });

  describe("deleteCommentAction", () => {
    it("deletes and refreshes, ignoring business errors", async () => {
      await deleteCommentAction("c1");
      expect(deleteComment).toHaveBeenCalledWith({ db: true }, "u1", "c1");
      expect(revalidatePath).toHaveBeenCalled();
      deleteComment.mockRejectedValueOnce(new DomainError("FORBIDDEN", "no"));
      await expect(deleteCommentAction("c1")).resolves.toBeUndefined();
      deleteComment.mockRejectedValueOnce(new Error("boom"));
      await expect(deleteCommentAction("c1")).rejects.toThrow("boom");
    });
  });
});
