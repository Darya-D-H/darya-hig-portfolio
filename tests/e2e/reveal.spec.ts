import { expect, test } from "@playwright/test";

// docs/07-test-plan.md §4. /_tokens stands in for the real pages until
// Phase 5; everything below its first screen is wrapped in Reveal.
const PAGE = "/_tokens";

const opacity = (locator: import("@playwright/test").Locator) =>
  locator.evaluate((el) => Number(getComputedStyle(el).opacity));

test.describe("with motion", () => {
  test.skip(
    ({ contextOptions }) => contextOptions?.reducedMotion === "reduce",
    "covered by the reduced-motion tests",
  );

  test("below-the-fold content starts hidden and reveals on scroll", async ({
    page,
  }) => {
    await page.goto(PAGE);
    const last = page.locator("[data-reveal]").last();
    await expect(last).not.toHaveAttribute("data-revealed", "true");
    expect(await opacity(last)).toBe(0);

    await last.scrollIntoViewIfNeeded();
    await expect(last).toHaveAttribute("data-revealed", "true");
    await expect.poll(() => opacity(last)).toBe(1);
  });

  test("a revealed element does not animate again", async ({ page }) => {
    await page.goto(PAGE);
    const target = page.locator("[data-reveal]").last();
    await target.scrollIntoViewIfNeeded();
    await expect.poll(() => opacity(target)).toBe(1);

    await page.evaluate(() => window.scrollTo(0, 0));
    await target.scrollIntoViewIfNeeded();
    expect(await opacity(target)).toBe(1);
  });

  test("the first screen is at full opacity on load", async ({ page }) => {
    await page.goto(PAGE);
    expect(await opacity(page.locator("h1"))).toBe(1);
  });
});

test.describe("with reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("every reveal element is visible without scrolling", async ({
    page,
  }) => {
    await page.goto(PAGE);
    const all = page.locator("[data-reveal]");
    const count = await all.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      expect(await opacity(all.nth(i))).toBe(1);
    }
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("all content is visible", async ({ page }) => {
    await page.goto(PAGE);
    const all = page.locator("[data-reveal]");
    const count = await all.count();
    for (let i = 0; i < count; i += 1) {
      expect(await opacity(all.nth(i))).toBe(1);
    }
  });
});
