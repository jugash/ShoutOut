import { describe, expect, it } from "vitest";
import { isReactionKey, REACTIONS, summarizeReactions, toggleInSummary } from "./reactions";

const row = (emoji: string, userId: string, name: string) => ({ emoji, userId, user: { name } });

describe("reactions", () => {
  it("has eight vibrant reactions with unique keys", () => {
    expect(REACTIONS).toHaveLength(8);
    expect(new Set(REACTIONS.map((r) => r.key)).size).toBe(8);
    expect(isReactionKey("fire")).toBe(true);
    expect(isReactionKey("thumbs-down")).toBe(false);
  });

  it("summarises in display order and skips unknown emoji", () => {
    const summary = summarizeReactions(
      [
        row("fire", "u2", "Bob"),
        row("clap", "u1", "Alice"),
        row("fire", "u1", "Alice"),
        row("meh", "u3", "Carol"),
      ],
      "u1",
    );
    expect(summary).toEqual([
      { key: "clap", emoji: "👏", label: "Applause", count: 1, reacted: true, names: ["Alice"] },
      {
        key: "fire",
        emoji: "🔥",
        label: "On fire",
        count: 2,
        reacted: true,
        names: ["Bob", "Alice"],
      },
    ]);
    expect(summarizeReactions([row("fire", "u2", "Bob")], "u1")[0].reacted).toBe(false);
  });

  describe("toggleInSummary", () => {
    const base = summarizeReactions([row("heart", "u2", "Bob"), row("rocket", "u1", "Me")], "u1");

    it("adds a new reaction in display order", () => {
      const next = toggleInSummary(base, "clap", "Me");
      expect(next.map((r) => [r.key, r.count, r.reacted])).toEqual([
        ["clap", 1, true],
        ["heart", 1, false],
        ["rocket", 1, true],
      ]);
    });

    it("increments someone else's reaction", () => {
      const heart = toggleInSummary(base, "heart", "Me").find((r) => r.key === "heart")!;
      expect(heart).toMatchObject({ count: 2, reacted: true, names: ["Bob", "Me"] });
    });

    it("removes your reaction and drops empty ones", () => {
      const withTwo = toggleInSummary(base, "heart", "Me");
      const heart = toggleInSummary(withTwo, "heart", "Me").find((r) => r.key === "heart")!;
      expect(heart).toMatchObject({ count: 1, reacted: false, names: ["Bob"] });
      expect(toggleInSummary(base, "rocket", "Me").map((r) => r.key)).toEqual(["heart"]);
    });
  });
});
