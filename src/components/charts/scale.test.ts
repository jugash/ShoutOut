import { describe, expect, it } from "vitest";
import { percent } from "@/server/insights/format";
import { change } from "@/server/insights/analytics";
import { compactNumber, niceMax } from "./scale";

describe("niceMax", () => {
  it.each([
    [0, 1],
    [-5, 1],
    [1, 1],
    [3, 5],
    [8, 10],
    [12, 20],
    [21, 25],
    [240, 250],
    [251, 500],
  ])("%s -> %s", (max, expected) => {
    expect(niceMax(max)).toBe(expected);
  });
});

describe("compactNumber", () => {
  it("keeps small numbers exact and compacts large ones", () => {
    expect(compactNumber(1284)).toBe("1,284");
    expect(compactNumber(12_900)).toBe("12.9K");
    expect(compactNumber(4_200_000)).toBe("4.2M");
  });
});

describe("percent and change", () => {
  it("handles zero denominators", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(5, 0)).toBe(0);
    expect(change(12, 10)).toBe(20);
    expect(change(5, 10)).toBe(-50);
    expect(change(5, 0)).toBeNull();
  });
});
