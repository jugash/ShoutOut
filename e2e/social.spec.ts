import { expect, test, type Page } from "@playwright/test";
import { e2eMessage, feedItem, sendShoutout, signInAs } from "./helpers";

async function deleteShoutout(page: Page, message: string) {
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await feedItem(page, message).getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("status")).toHaveText(/deleted/i);
}

test.describe("social", () => {
  // These tests sign in several people through Keycloak.
  test.describe.configure({ timeout: 90_000 });

  test("react and comment on a shoutout", async ({ browser }) => {
    const message = e2eMessage("Thanks for mentoring me this month");
    const henry = await browser.newPage();
    await signInAs(henry, "henry");
    await sendShoutout(henry, { to: ["Carol Chen"], card: "Mentor", message });

    const carol = await browser.newPage();
    await signInAs(carol, "carol");
    const item = feedItem(carol, message);
    await item.getByRole("button", { name: "Add a reaction" }).click();
    await carol.getByRole("menuitem", { name: "Celebrate" }).click();
    await expect(item.getByRole("button", { name: "Celebrate, 1" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // The optimistic update shows immediately; wait for the server action to finish.
    await carol.waitForLoadState("networkidle");
    await carol.reload();
    await expect(
      feedItem(carol, message).getByRole("button", { name: "Celebrate, 1" }),
    ).toBeVisible();

    // Toggle off.
    await feedItem(carol, message).getByRole("button", { name: "Celebrate, 1" }).click();
    await expect(feedItem(carol, message).getByRole("button", { name: /Celebrate/ })).toHaveCount(
      0,
    );
    await feedItem(carol, message).getByRole("button", { name: "Add a reaction" }).click();
    await carol.getByRole("menuitem", { name: "On fire" }).click();
    await expect(
      feedItem(carol, message).getByRole("button", { name: "On fire, 1" }),
    ).toBeVisible();
    await carol.waitForLoadState("networkidle");

    await feedItem(carol, message)
      .getByRole("link", { name: /Comment$/ })
      .click();
    await expect(carol).toHaveURL(/\/shoutouts\/.+#comments/);
    await carol.getByLabel("Add a comment").fill("It was a pleasure! 🌱");
    await carol.getByRole("button", { name: "Post comment" }).click();
    await expect(carol.getByText("It was a pleasure! 🌱")).toBeVisible();
    await expect(carol.getByLabel("Add a comment")).toHaveValue("");

    // The sender sees the reaction and comment count.
    await henry.goto("/");
    const henryItem = feedItem(henry, message);
    await expect(henryItem.getByRole("button", { name: "On fire, 1" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(henryItem.getByRole("link", { name: /1 comment$/ })).toBeVisible();

    // Carol deletes her comment.
    await carol.reload();
    carol.once("dialog", (dialog) => dialog.accept());
    await carol.getByRole("button", { name: "Delete" }).click();
    await expect(carol.getByText("No comments yet. Add some cheer!")).toBeVisible();

    await deleteShoutout(henry, message);
  });

  test("profiles show public shoutouts to others and private ones to yourself", async ({
    browser,
  }) => {
    const publicMessage = e2eMessage("Thanks for the brilliant workshop");
    const privateMessage = e2eMessage("Thanks for listening yesterday");
    const grace = await browser.newPage();
    await signInAs(grace, "grace");
    await sendShoutout(grace, {
      to: ["Frank Fischer"],
      value: "Diversity",
      message: publicMessage,
    });
    await sendShoutout(grace, {
      to: ["Frank Fischer"],
      message: privateMessage,
      visibility: "Private",
    });

    const frank = await browser.newPage();
    await signInAs(frank, "frank");
    await frank.getByRole("link", { name: "Your profile" }).click();
    await expect(frank.getByRole("heading", { name: /Frank Fischer/ })).toContainText("(you)");
    await expect(feedItem(frank, publicMessage)).toBeVisible();
    await expect(feedItem(frank, privateMessage)).toBeVisible();

    const erin = await browser.newPage();
    await signInAs(erin, "erin");
    await erin.goto("/people");
    // Results update as you type, no button needed.
    await erin.getByRole("searchbox", { name: "Search people" }).fill("frank");
    await expect(erin).toHaveURL(/q=frank/);
    await expect(erin.getByRole("link", { name: /Carol Chen/ })).toHaveCount(0);
    await erin.getByRole("link", { name: /Frank Fischer/ }).click();
    await expect(erin.getByText("Only public shoutouts are shown.")).toBeVisible();
    await expect(feedItem(erin, publicMessage)).toBeVisible();
    await expect(feedItem(erin, privateMessage)).toHaveCount(0);
    // Exact counts vary with other data (e.g. demo seed), so just check the section.
    await expect(erin.getByText("Recognised most for")).toBeVisible();

    await erin.getByRole("link", { name: "Sent" }).click();
    await expect(erin).toHaveURL(/tab=sent/);
    await expect(feedItem(erin, publicMessage)).toHaveCount(0);

    await deleteShoutout(grace, publicMessage);
    await deleteShoutout(grace, privateMessage);
  });

  test("signed-in pages fit a phone screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await signInAs(page, "bob");
    for (const path of ["/", "/people", "/shoutouts/new"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
    await page.getByRole("link", { name: "Your profile" }).click();
    await expect(page.getByRole("radiogroup", { name: "Theme" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("filter the feed by text, value and person", async ({ page }) => {
    const message = e2eMessage("Unicorn-level spreadsheet wizardry");
    // Not "dave": the budget refund test owns that user so its counts stay exact.
    await signInAs(page, "bob");
    await sendShoutout(page, { to: ["Erin Evans"], value: "Engagement", message });

    await page.getByText("Search & filter").click();
    await page.getByLabel("Message contains").fill("unicorn-level");
    await page.getByLabel("Value").selectOption({ label: "Engagement" });
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page.getByRole("heading", { name: "Matching shoutouts" })).toBeVisible();
    await expect(feedItem(page, message)).toBeVisible();

    await page.getByLabel("Value").selectOption({ label: "Integrity" });
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page.getByText("No shoutouts match those filters.")).toBeVisible();

    await page.getByRole("link", { name: "Clear" }).click();
    await expect(page.getByRole("heading", { name: "Latest shoutouts" })).toBeVisible();
    await page.getByText("Search & filter").click();
    const person = page.getByRole("combobox", { name: /person/i });
    await person.fill("erin");
    await page.getByRole("option", { name: /Erin Evans/ }).click();
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/person=/);
    await expect(feedItem(page, message)).toBeVisible();

    await deleteShoutout(page, message);
  });
});
