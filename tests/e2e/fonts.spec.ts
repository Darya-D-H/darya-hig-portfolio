import { expect, test } from "@playwright/test";
import { PAGES } from "./pages";

// Guards the font rules in docs/02-design-tokens.md §2 and ADR-0003. None of
// the test engines has SF Pro, so every one of them must render Inter.

for (const path of PAGES) {
  test.describe(`fonts on ${path}`, () => {
    test("no font is preloaded", async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(
        0,
      );
    });

    test("Inter is downloaded and used where SF Pro is absent", async ({
      page,
    }) => {
      await page.goto(path);
      const loaded = await page.evaluate(async () => {
        await document.fonts.ready;
        return [...document.fonts]
          .filter((face) => /^Inter-[0-9a-f]+$/.test(face.family))
          .map((face) => face.status);
      });
      expect(loaded).toContain("loaded");
    });

    test("the stack keeps -apple-system, then Inter, then system-ui", async ({
      page,
    }) => {
      await page.goto(path);
      const family = await page.evaluate(
        () => getComputedStyle(document.body).fontFamily,
      );
      const apple = family.indexOf("-apple-system");
      const inter = family.search(/Inter-[0-9a-f]+/);
      const system = family.indexOf("system-ui");
      expect(apple).toBeGreaterThanOrEqual(0);
      expect(inter).toBeGreaterThan(apple);
      expect(system).toBeGreaterThan(inter);
      expect(family.trim().endsWith("sans-serif")).toBe(true);
    });
  });
}
