// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  applyThemePreference,
  parseThemePreference,
  THEME_COOKIE,
  themeAttribute,
  themeCookie,
} from "./theme";

describe("theme preferences", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.cookie = `${THEME_COOKIE}=; Max-Age=0; Path=/`;
  });

  it("parses known values and defaults to system", () => {
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("system")).toBe("system");
    expect(parseThemePreference("purple")).toBe("system");
    expect(parseThemePreference(undefined)).toBe("system");
    expect(parseThemePreference(null)).toBe("system");
  });

  it("maps preferences to the html data-theme attribute", () => {
    expect(themeAttribute("dark")).toBe("dark");
    expect(themeAttribute("light")).toBe("light");
    expect(themeAttribute("system")).toBeUndefined();
  });

  it("builds a year-long cookie", () => {
    expect(themeCookie("dark")).toBe("shoutout-theme=dark; Path=/; Max-Age=31536000; SameSite=Lax");
  });

  it("applies an explicit theme and clears it for system", () => {
    applyThemePreference("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.cookie).toContain("shoutout-theme=dark");

    applyThemePreference("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(document.cookie).toContain("shoutout-theme=system");
  });
});
