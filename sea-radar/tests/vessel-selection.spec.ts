import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
  await page.goto("/");
});

test("shows three demonstration vessels", async ({ page }) => {
  await expect(page.locator("[data-vessel-id]")).toHaveCount(3);
});

test("opens the clicked vessel card and keeps it open on a repeated click", async ({ page }) => {
  const marker = page.locator('[data-vessel-id="demo-2"]');
  await marker.click();

  const card = page.locator(".vessel-card");
  await expect(card).toBeVisible();
  await expect(card.getByText("demo-2", { exact: true })).toBeVisible();

  await marker.click();
  await expect(card).toBeVisible();
  await expect(card.getByText("demo-2", { exact: true })).toBeVisible();
});
