import { describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("next/headers", () => ({ cookies: async () => ({ get }) }));

const { getThemePreference } = await import("./theme-server");

describe("getThemePreference", () => {
  it("reads the theme cookie", async () => {
    get.mockReturnValue({ value: "dark" });
    expect(await getThemePreference()).toBe("dark");
    expect(get).toHaveBeenCalledWith("shoutout-theme");
  });

  it("defaults to system without a cookie", async () => {
    get.mockReturnValue(undefined);
    expect(await getThemePreference()).toBe("system");
  });
});
