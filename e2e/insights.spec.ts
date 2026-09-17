import { expect, test } from "@playwright/test";
import { e2eMessage, feedItem, sendShoutout, signInAs } from "./helpers";

test.describe("leaderboards and analytics", () => {
  test.describe.configure({ timeout: 90_000 });

  test("everyone sees the leaderboard; recognition shows up this week", async ({ page }) => {
    const message = e2eMessage("Thanks for the brilliant onboarding docs");
    await signInAs(page, "henry");
    await sendShoutout(page, { to: ["Grace Gupta"], message });

    // The feed sidebar shows this month's most recognised people.
    const topThisMonth = page.locator("section", {
      has: page.getByRole("heading", { name: "Top this month" }),
    });
    await expect(topThisMonth.getByRole("listitem").first()).toHaveAccessibleName(
      /^Rank 1: .+, \d+ shoutouts received$/,
    );

    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Leaderboard" })
      .click();
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
    await page.getByRole("link", { name: "This week" }).click();
    await expect(page).toHaveURL(/period=week/);
    const mostRecognised = page.locator("section", {
      has: page.getByRole("heading", { name: "Most recognised" }),
    });
    await expect(
      mostRecognised.getByRole("listitem", { name: /Grace Gupta, \d+ shoutouts received/ }),
    ).toBeVisible();
    const recognisers = page.locator("section", {
      has: page.getByRole("heading", { name: "Top recognisers" }),
    });
    await expect(recognisers.getByRole("listitem", { name: /Henry Hughes/ })).toHaveClass(
      /bg-sunny-soft/,
    );
    for (const period of ["This month", "This quarter", "All time"]) {
      await page.getByRole("link", { name: period }).click();
      await expect(page.getByRole("link", { name: period })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }

    // Non-admins don't get analytics by default.
    await expect(page.getByRole("link", { name: "Analytics" })).toHaveCount(0);
    const response = await page.goto("/analytics");
    expect(response?.status()).toBe(404);

    await page.goto("/");
    page.once("dialog", (dialog) => dialog.accept());
    await feedItem(page, message).getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("status")).toHaveText(/deleted/i);
  });

  test("admins see the analytics dashboard", async ({ page }) => {
    await signInAs(page, "alice");
    await page.getByRole("link", { name: "Analytics" }).click();
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    await expect(page.getByText("Shoutouts sent")).toBeVisible();
    await expect(page.getByText("Giving recognition")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Not recognised recently" })).toBeVisible();

    const column = page
      .getByRole("list", { name: "Shoutouts per week" })
      .getByRole("listitem")
      .last();
    await column.focus();
    await expect(page.getByRole("tooltip")).toContainText("shoutouts");

    await page.getByRole("link", { name: "Last 365 days" }).click();
    await expect(page.getByRole("heading", { name: "Shoutouts per month" })).toBeVisible();
    await page.getByText("View as table").first().click();
    await expect(page.getByRole("table").first()).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Shoutouts per company value" }).getByRole("listitem"),
    ).toHaveCount(5);
  });
});
