import { expect, test } from "@playwright/test";
import { PAGES } from "./pages";

// docs/07-test-plan.md §4: at every viewport in the matrix, no page scrolls
// sideways. This one assertion catches most horizontal-overflow bugs.
for (const path of [...PAGES, "/no-such-page"]) {
  test(`${path} has no horizontal scroll`, async ({ page }) => {
    await page.goto(path);
    // Reveal content is in its final layout box already; only opacity and
    // transform differ, and transform does not change scrollWidth.
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
}
