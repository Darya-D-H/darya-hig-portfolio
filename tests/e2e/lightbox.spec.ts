import { expect, test, type Page } from "@playwright/test";

// docs/07-test-plan.md §4, on a project with a four-image gallery.
const PAGE = "/projects/invoice-tracker";

const dialog = (page: Page) =>
  page.getByRole("dialog", { name: "Image viewer" });
const thumbnails = (page: Page) =>
  page.getByRole("region", { name: "Gallery" }).getByRole("button");
const status = (page: Page) => page.locator("[data-lightbox-status]");

async function openAt(page: Page, index: number) {
  await page.goto(PAGE);
  const thumb = thumbnails(page).nth(index);
  await thumb.scrollIntoViewIfNeeded();
  await thumb.click();
  await expect(dialog(page)).toBeVisible();
}

test("thumbnails become buttons named by their alt text", async ({ page }) => {
  await page.goto(PAGE);
  await expect(thumbnails(page)).toHaveCount(4);
  await expect(thumbnails(page).first()).toHaveAccessibleName(
    "Invoice list filtered to overdue invoices, sorted by days late",
  );
});

test("clicking a thumbnail opens the dialog at that image", async ({
  page,
}) => {
  await openAt(page, 2);
  await expect(status(page)).toHaveText("Image 3 of 4");
  await expect(dialog(page).getByRole("img")).toHaveAttribute(
    "alt",
    "Weekly digest email listing three invoices that fall due next week",
  );
});

test("focus moves to the close button", async ({ page }) => {
  await openAt(page, 0);
  await expect(
    dialog(page).getByRole("button", { name: "Close" }),
  ).toBeFocused();
});

test("arrow keys move between images", async ({ page }) => {
  await openAt(page, 1);
  await page.keyboard.press("ArrowRight");
  await expect(status(page)).toHaveText("Image 3 of 4");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(status(page)).toHaveText("Image 1 of 4");
});

test("prev is disabled at the first image and next at the last", async ({
  page,
}) => {
  await openAt(page, 0);
  const prev = dialog(page).getByRole("button", { name: "Previous image" });
  const next = dialog(page).getByRole("button", { name: "Next image" });
  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();

  for (let i = 0; i < 5; i += 1) await page.keyboard.press("ArrowRight");
  await expect(status(page)).toHaveText("Image 4 of 4");
  await expect(next).toBeDisabled();
  await expect(prev).toBeEnabled();
});

test("Escape closes and returns focus to the thumbnail that was clicked", async ({
  page,
}) => {
  await openAt(page, 2);
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(thumbnails(page).nth(2)).toBeFocused();
});

test("clicking the scrim closes it", async ({ page }) => {
  await openAt(page, 0);
  // Top-left corner of the viewport: the dialog's own area, not its content.
  await page.mouse.click(5, 5);
  await expect(dialog(page)).toBeHidden();
  await expect(thumbnails(page).first()).toBeFocused();
});

test("a project with no gallery has no gallery section", async ({ page }) => {
  await page.goto("/projects/api-gateway");
  await expect(page.getByRole("heading", { name: "Gallery" })).toHaveCount(0);
  await expect(page.locator("[data-gallery]")).toHaveCount(0);
  await expect(page.locator("dialog")).toHaveCount(0);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("thumbnails are links to the full image", async ({ page }) => {
    await page.goto(PAGE);
    const links = page.locator("a[data-lightbox-trigger]");
    await expect(links).toHaveCount(4);
    const href = await links.first().getAttribute("href");
    const response = await page.request.get(href ?? "");
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
  });
});
