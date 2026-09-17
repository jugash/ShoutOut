export const THEME_COOKIE = "shoutout-theme";
export const THEME_PREFERENCES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export function parseThemePreference(value: string | null | undefined): ThemePreference {
  return (THEME_PREFERENCES as readonly string[]).includes(value ?? "")
    ? (value as ThemePreference)
    : "system";
}

/** The `data-theme` attribute for <html>; undefined means "follow the OS". */
export function themeAttribute(preference: ThemePreference): "light" | "dark" | undefined {
  return preference === "system" ? undefined : preference;
}

export function themeCookie(preference: ThemePreference): string {
  return `${THEME_COOKIE}=${preference}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/** Persists the preference and applies it to the page without a reload. */
export function applyThemePreference(preference: ThemePreference, doc: Document = document): void {
  doc.cookie = themeCookie(preference);
  const attribute = themeAttribute(preference);
  if (attribute) {
    doc.documentElement.setAttribute("data-theme", attribute);
  } else {
    doc.documentElement.removeAttribute("data-theme");
  }
}
