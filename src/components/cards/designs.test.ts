import { describe, expect, it } from "vitest";
import { DEFAULT_CARD_DESIGNS, findCardDesign, TONE_CLASSES } from "./designs";
import { isIllustrationName } from "./illustrations";

describe("card designs", () => {
  it("ships ten cards with unique slugs and valid artwork", () => {
    expect(DEFAULT_CARD_DESIGNS).toHaveLength(10);
    expect(new Set(DEFAULT_CARD_DESIGNS.map((c) => c.slug)).size).toBe(10);
    expect(new Set(DEFAULT_CARD_DESIGNS.map((c) => c.illustration)).size).toBe(10);
    for (const card of DEFAULT_CARD_DESIGNS) {
      expect(isIllustrationName(card.illustration)).toBe(true);
      expect(TONE_CLASSES[card.tone]).toBeDefined();
    }
  });

  it("includes the product owner's must-have cards", () => {
    expect(DEFAULT_CARD_DESIGNS.map((c) => c.title)).toEqual(
      expect.arrayContaining(["Thank You", "Above & Beyond", "Team Player", "Great Idea"]),
    );
  });

  it("finds cards by slug", () => {
    expect(findCardDesign("thank-you")?.title).toBe("Thank You");
    expect(findCardDesign("nope")).toBeUndefined();
  });
});
