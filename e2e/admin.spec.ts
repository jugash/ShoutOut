import { expect, test } from "@playwright/test";
import { choose, e2eMessage, feedItem, sendShoutout, signInAs } from "./helpers";

test.describe("admin", () => {
  test.describe.configure({ timeout: 120_000 });

  test("a reported shoutout is hidden until an admin restores it, then removed on a second report", async ({
    browser,
  }) => {
    const message = e2eMessage("Thanks for the Friday demo");
    const dave = await browser.newPage();
    // Not "dave": the budget refund test owns that user so its counts stay exact.
    await signInAs(dave, "grace");
    await sendShoutout(dave, { to: ["Erin Evans"], message });

    const erin = await browser.newPage();
    await signInAs(erin, "erin");
    await feedItem(erin, message).getByRole("link", { name: "Report" }).click();
    await expect(erin.getByRole("heading", { name: "Report shoutout" })).toBeVisible();
    await erin.getByRole("button", { name: "Report shoutout" }).click();
    await expect(erin.getByText("Pick a reason")).toBeVisible();
    await erin.getByLabel("Spam or gaming the system").check();
    await erin.getByLabel(/Anything else/).fill("Looks like a duplicate");
    await erin.getByRole("button", { name: "Report shoutout" }).click();
    await expect(erin.getByRole("status")).toHaveText(/hidden while an admin reviews/);
    await expect(feedItem(erin, message)).toHaveCount(0);

    // Hidden from the sender too.
    await dave.goto("/");
    await expect(feedItem(dave, message)).toHaveCount(0);

    // Non-admins can't open the admin area.
    expect((await erin.goto("/admin"))?.status()).toBe(404);

    const alice = await browser.newPage();
    await signInAs(alice, "alice");
    await alice.getByRole("link", { name: "Admin" }).click();
    await expect(alice.getByRole("link", { name: /Moderation \(\d+\)/ })).toBeVisible();
    const pending = alice
      .getByRole("list", { name: "Reported shoutouts" })
      .getByRole("listitem")
      .filter({ hasText: message });
    await expect(pending).toContainText("Spam or gaming the system");
    await expect(pending).toContainText("Looks like a duplicate");
    await pending.getByRole("button", { name: "Restore" }).click();
    await expect(alice.getByRole("status")).toHaveText(/restored/i);

    await dave.goto("/");
    await expect(feedItem(dave, message)).toBeVisible();

    // A second report, this time removed.
    const frank = await browser.newPage();
    await signInAs(frank, "frank");
    await feedItem(frank, message).getByRole("link", { name: "Report" }).click();
    await frank.getByLabel("Inappropriate for work").check();
    await frank.getByRole("button", { name: "Report shoutout" }).click();
    await expect(frank.getByRole("status")).toBeVisible();

    await alice.goto("/admin");
    await alice
      .getByRole("list", { name: "Reported shoutouts" })
      .getByRole("listitem")
      .filter({ hasText: message })
      .getByRole("button", { name: "Remove" })
      .click();
    await expect(alice.getByRole("status")).toHaveText(/removed/i);
    await dave.goto("/");
    await expect(feedItem(dave, message)).toHaveCount(0);

    await alice.goto("/admin/audit");
    await expect(alice.getByRole("cell", { name: "removed a shoutout" }).first()).toBeVisible();
    await expect(alice.getByRole("cell", { name: "restored a shoutout" }).first()).toBeVisible();
  });

  test("admins create, edit, reorder and retire cards and values", async ({ page }) => {
    const stamp = Date.now().toString(36);
    const title = `E2E High Five ${stamp}`;
    const valueName = `E2E Kindness ${stamp}`;
    await signInAs(page, "alice");

    await page.goto("/admin/cards");
    await page.getByRole("link", { name: "New card" }).click();
    await page.getByRole("button", { name: "Create card" }).click();
    await expect(page.getByText("Give the card a title")).toBeVisible();
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Tagline").fill("Nailed it together");
    await choose(page, "trophy");
    await choose(page, "sky");
    await expect(page.getByRole("figure")).toContainText(title);
    await page.getByRole("button", { name: "Create card" }).click();
    await expect(page.getByRole("status")).toHaveText("Card saved.");

    const row = page.getByRole("listitem").filter({ hasText: title });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: `Move ${title} up` }).click();
    await expect(page.getByRole("status")).toHaveText("Card order updated.");
    await page
      .getByRole("listitem")
      .filter({ hasText: title })
      .getByRole("link", { name: "Edit" })
      .click();
    await page.getByLabel("Tagline").fill("Team high five");
    await page.getByRole("button", { name: "Save card" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: title })).toContainText(
      "Team high five",
    );

    // The new card can be used straight away.
    await page.goto("/shoutouts/new");
    await expect(page.getByRole("radio", { name: title })).toBeAttached();

    await page.goto("/admin/cards");
    await page
      .getByRole("listitem")
      .filter({ hasText: title })
      .getByRole("button", { name: "Retire" })
      .click();
    await expect(page.getByRole("status")).toHaveText(/Card retired/);
    await page.goto("/shoutouts/new");
    await expect(page.getByRole("radio", { name: title })).toHaveCount(0);

    await page.goto("/admin/values");
    await page.getByLabel("New value name").fill("integrity");
    await page.getByRole("button", { name: "Add value" }).click();
    await expect(page.getByText("A value with that name already exists")).toBeVisible();
    await page.getByLabel("New value name").fill(valueName);
    await page.getByRole("button", { name: "Add value" }).click();
    await expect(page.getByRole("status")).toHaveText("Value saved.");
    const valueRow = page
      .getByRole("listitem")
      .filter({ has: page.getByLabel(`Rename ${valueName}`) });
    await valueRow.getByLabel(`Rename ${valueName}`).fill(`${valueName} & Care`);
    await valueRow.getByRole("button", { name: "Rename" }).click();
    await expect(page.getByLabel(`Rename ${valueName} & Care`)).toBeVisible();
    await page
      .getByRole("listitem")
      .filter({ has: page.getByLabel(`Rename ${valueName} & Care`) })
      .getByRole("button", { name: "Retire" })
      .click();
    await expect(page.getByRole("status")).toHaveText(/Value retired/);
  });

  test("admins download CSV exports", async ({ page }) => {
    await signInAs(page, "alice");
    await page.goto("/admin/export");
    for (const [button, header] of [
      ["Download shoutouts.csv", "id,created_at,sender_name"],
      ["Download people.csv", "name,email,active"],
      ["Download leaderboards.csv", "period,board,rank"],
    ] as const) {
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: button }).click();
      const file = await download;
      expect(file.suggestedFilename()).toMatch(
        /^shoutout-(shoutouts|people|leaderboards)-\d{4}-\d{2}-\d{2}\.csv$/,
      );
      const stream = await file.createReadStream();
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk as Buffer);
      expect(Buffer.concat(chunks).toString("utf8")).toMatch(new RegExp(`^${header}`));
    }

    const bob = await page.context().browser()!.newPage();
    await signInAs(bob, "bob");
    expect((await bob.request.get("/admin/export/shoutouts")).status()).toBe(404);
  });
});
