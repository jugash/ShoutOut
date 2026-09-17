import { describe, expect, it } from "vitest";
import { slugify } from "./catalog";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("formats values and quotes when needed", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(3)).toBe("3");
    expect(csvCell(-3)).toBe("-3");
    expect(csvCell(true)).toBe("true");
    expect(csvCell(new Date("2026-09-17T10:00:00Z"))).toBe("2026-09-17T10:00:00.000Z");
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell('a, "b"\nc')).toBe('"a, ""b""\nc"');
  });

  it.each(["=SUM(A1)", "+1", "-1", "@cmd", "\tx", "\rx"])("neutralises formula %j", (value) => {
    expect(csvCell(value).replace(/^"/, "")).toMatch(/^'/);
  });
});

describe("toCsv", () => {
  it("writes a header and rows with CRLF line endings", () => {
    expect(
      toCsv(
        [
          { a: "x", b: 1 },
          { a: "y,z", b: 2 },
        ],
        [
          { header: "A", value: (r) => r.a },
          { header: "B", value: (r) => r.b },
        ],
      ),
    ).toBe('A,B\r\nx,1\r\n"y,z",2\r\n');
  });
});

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("Above & Beyond!")).toBe("above-beyond");
    expect(slugify("  Café Crème  ")).toBe("cafe-creme");
    expect(slugify("!!!")).toBe("item");
  });
});
