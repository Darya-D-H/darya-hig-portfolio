import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Grows into the full scan in docs/07-test-plan.md §5 in Phase 6. For now:
// the shell on its own, the review page, and the mobile menu open.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const scan = (page: Page) =>
  new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

for (const path of ["/", "/_tokens"]) {
  test(`${path} has no axe violations`, { tag: "@a11y" }, async ({ page }) => {
    await page.goto(path);
    // Scan the settled page: with motion, reveal content starts transparent.
    await page.evaluate(() =>
      document
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((el) => (el.dataset.revealed = "true")),
    );
    await page.waitForTimeout(700);
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
      await page.waitForTimeout(500);
      expect((await scan(page)).violations).toEqual([]);
    },
  );
});
