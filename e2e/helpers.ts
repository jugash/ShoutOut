import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD ?? "shoutout";

/** Signs in through the real Keycloak login page. */
export async function signInAs(page: Page, username: string) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/signin/);
  await page.getByRole("button", { name: /sign in with your work account/i }).click();
  // Keycloak's login form: stable element ids across themes.
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(DEMO_PASSWORD);
  await page.locator("#kc-login").click();
}
