import { expect, test } from "@playwright/test";
import { signInAs } from "./helpers";

test.describe("authentication", () => {
  test("anonymous visitors are sent to the sign-in page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/signin/);
    await expect(page.getByRole("img", { name: "ShoutOut" }).first()).toBeVisible();
  });

  test("a user signs in with Keycloak and signs out everywhere", async ({ page }) => {
    await signInAs(page, "bob");
    await expect(page.getByRole("heading", { name: /hi bob/i })).toBeVisible();
    await expect(page.getByText("Admin", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Send a shoutout" })).toBeVisible();

    // Let the page finish hydrating so the click reaches the sign-out action.
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/signin/);

    // The Keycloak session is gone too, so signing in asks for credentials again.
    await page.getByRole("button", { name: /sign in with your work account/i }).click();
    await expect(page.locator("#username")).toBeVisible();
  });

  test("admins are recognised from Keycloak roles", async ({ page }) => {
    await signInAs(page, "alice");
    await expect(page.getByRole("heading", { name: /hi alice/i })).toBeVisible();
    await expect(page.getByText("Admin", { exact: true })).toBeVisible();
  });
});
