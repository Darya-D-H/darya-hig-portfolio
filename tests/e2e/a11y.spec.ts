import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Seed of the full scan in docs/07-test-plan.md §5, which grows to cover
// every page type and the menu-open and lightbox-open states in Phase 6.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("home page has no axe violations", { tag: "@a11y" }, async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
});
