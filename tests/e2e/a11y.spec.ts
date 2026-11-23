import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { settle } from "./helpers";
import { PAGES } from "./pages";

// docs/07-test-plan.md §5: every page at every width in the matrix, plus
// the 404, the mobile menu open and the lightbox open. Zero violations is
// the gate, not zero serious ones.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const scan = (page: Page) =>
  new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

for (const path of [...PAGES, "/no-such-page"]) {
  test(`${path} has no axe violations`, { tag: "@a11y" }, async ({ page }) => {
    await page.goto(path);
    await settle(page);
    expect((await scan(page)).violations).toEqual([]);
  });
}

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test(
    "the open mobile menu has no axe violations",
    { tag: "@a11y" },
    async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await expect(page.locator("#mobile-menu")).toBeVisible();
      await settle(page);
      expect((await scan(page)).violations).toEqual([]);
    },
  );
});

test(
  "a project page with the lightbox open has no axe violations",
  { tag: "@a11y" },
  async ({ page }) => {
    await page.goto("/projects/invoice-tracker");
    const thumb = page
      .getByRole("region", { name: "Gallery" })
      .getByRole("button")
      .first();
    await thumb.scrollIntoViewIfNeeded();
    await thumb.click();
    await expect(
      page.getByRole("dialog", { name: "Image viewer" }),
    ).toBeVisible();
    await settle(page);
    expect((await scan(page)).violations).toEqual([]);
  },
);
