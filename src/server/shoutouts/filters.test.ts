import { describe, expect, it } from "vitest";
import { parseDay, parseFeedFilters, withParams } from "./filters";

describe("parseDay", () => {
  it("accepts real YYYY-MM-DD dates only", () => {
    expect(parseDay("2026-09-17")).toEqual(new Date("2026-09-17T00:00:00Z"));
    expect(parseDay("2026-02-30")).toBeUndefined();
    expect(parseDay("17/09/2026")).toBeUndefined();
    expect(parseDay("2026-9-7")).toBeUndefined();
    expect(parseDay(undefined)).toBeUndefined();
  });
});

describe("parseFeedFilters", () => {
  it("returns no filters for an empty query", () => {
    expect(parseFeedFilters({ cursor: "abc", notice: "sent" })).toEqual({
      filters: {
        personId: undefined,
        valueId: undefined,
        cardId: undefined,
        from: undefined,
        to: undefined,
        query: undefined,
      },
      raw: {},
      active: false,
    });
  });

  it("parses, trims and ignores blank or repeated values", () => {
    const { filters, raw, active } = parseFeedFilters({
      person: "u2",
      value: " v1 ",
      card: "",
      from: "2026-09-01",
      to: "not-a-date",
      q: ["a", "b"],
    });
    expect(active).toBe(true);
    expect(raw).toEqual({ person: "u2", value: "v1", from: "2026-09-01", to: "not-a-date" });
    expect(filters).toEqual({
      personId: "u2",
      valueId: "v1",
      cardId: undefined,
      from: new Date("2026-09-01T00:00:00Z"),
      to: undefined,
      query: undefined,
    });
  });

  it("limits the text query", () => {
    expect(parseFeedFilters({ q: "x".repeat(150) }).filters.query).toHaveLength(100);
  });
});

describe("withParams", () => {
  it("builds a query string, dropping empty values", () => {
    expect(withParams({ value: "v1", q: "" }, { cursor: "c1", person: undefined })).toBe(
      "?value=v1&cursor=c1",
    );
    expect(withParams({}, {})).toBe("");
  });
});
