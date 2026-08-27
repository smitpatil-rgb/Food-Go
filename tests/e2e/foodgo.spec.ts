import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });
let orderNumber = "";
const phone = "9876543210";

async function signInAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Work email").fill("owner@food.go");
  await page.getByLabel("Password").fill("FoodGoDemo!2026");
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await expect(page.getByRole("heading", { name: /Good evening/ })).toBeVisible();
}

test("browse, cart, quantity and checkout", async ({ page }) => {
  await page.goto("/");
  await page.locator('html[data-foodgo-ready="true"]').waitFor();
  await page.locator(".menu-card").nth(0).getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("button", { name: "Close cart" }).click();
  await page.locator(".menu-card").nth(1).getByRole("button", { name: "Add to cart" }).click();
  const cart = page.getByRole("dialog", { name: "Cart & checkout" });
  await cart
    .locator(".cart-line")
    .first()
    .getByRole("button", { name: /Increase/ })
    .click();
  await cart.getByLabel("Name", { exact: true }).fill("E2E Guest");
  await cart.getByLabel("Phone").fill(phone);
  await cart.getByLabel("Delivery address").fill("42 Test Market Road, Bengaluru 560001");
  await cart.getByRole("button", { name: "Confirm order" }).click();
  orderNumber = (await page.locator(".success-panel > strong").textContent()) || "";
  expect(orderNumber).toMatch(/^FG-/);
});

test("tracking requires matching phone", async ({ page }) => {
  await page.goto(`/track?order=${orderNumber}`);
  await page.getByLabel("Phone number").fill(phone);
  await page.getByRole("button", { name: "Track order" }).click();
  await expect(page.getByRole("heading", { name: "Confirmed" })).toBeVisible();
  await page.getByLabel("Phone number").fill("9000000000");
  await page.getByRole("button", { name: "Track order" }).click();
  await expect(page.getByText("No order matches that ID and phone number.")).toBeVisible();
});

test("admin changes status and tracking reflects it", async ({ page }) => {
  await signInAdmin(page);
  await page.getByLabel(`Status for ${orderNumber}`).selectOption("PREPARING");
  await expect(page.getByText(new RegExp(`${orderNumber} moved to preparing`))).toBeVisible();
  await page.goto(`/track?order=${orderNumber}`);
  await page.getByLabel("Phone number").fill(phone);
  await page.getByRole("button", { name: "Track order" }).click();
  await expect(page.getByRole("heading", { name: "Preparing" })).toBeVisible();
});

test("review moderation and contact inbox", async ({ page }) => {
  await page.goto("/#support");
  await page.locator(".feedback-card").first().getByLabel("Name").fill("Review Guest");
  await page
    .getByLabel("Your experience")
    .fill("A precise, bright dinner that travelled incredibly well.");
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByText(/awaiting moderation/)).toBeVisible();
  const contact = page.locator(".accent-card");
  await contact.getByLabel("Name").fill("Support Guest");
  await contact.getByLabel("Email").fill("guest@example.com");
  await contact.getByLabel("Subject").fill("Packaging question");
  await contact.getByLabel("Message").fill("Can the next order use separate dressing containers?");
  await contact.getByRole("button", { name: "Send message" }).click();
  await expect(contact.getByText("Your message is with our team.")).toBeVisible();
  await signInAdmin(page);
  await page.getByRole("button", { name: /reviews/ }).click();
  const review = page.locator(".review-admin-grid article").filter({ hasText: "Review Guest" });
  await review.getByRole("button", { name: "Approve" }).click();
  // Wait for the saved server result before navigating away from the operation.
  await expect(page.getByText("Review marked approved.", { exact: true })).toBeVisible();
  await expect(review.locator("small")).toHaveText("APPROVED");
  await page.getByRole("button", { name: /messages/ }).click();
  await expect(page.getByText("Packaging question")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText(/A precise, bright dinner/)).toBeVisible();
});

test("admin creates, edits and deactivates a menu item", async ({ page }) => {
  await signInAdmin(page);
  await page.getByRole("button", { name: /menu/ }).click();
  await page.getByRole("button", { name: "Add menu item" }).click();
  const form = page.locator(".menu-admin-form");
  await form.getByLabel("Name").fill("Test Kitchen Bowl");
  await form.getByLabel("Slug", { exact: true }).fill("test-kitchen-bowl");
  await form
    .getByLabel("Description")
    .fill("A test-only bowl with greens, grains and charred citrus.");
  await form.getByRole("button", { name: "Save item" }).click();
  const row = page.locator("tr").filter({ hasText: "Test Kitchen Bowl" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Edit" }).click();
  await form.getByLabel("Name").fill("Edited Kitchen Bowl");
  await form.getByRole("button", { name: "Save item" }).click();
  const edited = page.locator("tr").filter({ hasText: "Edited Kitchen Bowl" });
  page.once("dialog", (dialog) => dialog.accept());
  await edited.getByRole("button", { name: "Deactivate" }).click();
  await expect(edited).toContainText("Inactive");
});

test("mobile core experience has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('html[data-foodgo-ready="true"]').waitFor();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole("button", { name: "Toggle navigation" })).toBeVisible();
  await expect(
    page.locator(".menu-card").first().getByRole("button", { name: "Add to cart" })
  ).toBeVisible();
});
