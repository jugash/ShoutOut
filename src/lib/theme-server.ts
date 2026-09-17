import { cookies } from "next/headers";
import { parseThemePreference, THEME_COOKIE, type ThemePreference } from "./theme";

export async function getThemePreference(): Promise<ThemePreference> {
  return parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);
}
