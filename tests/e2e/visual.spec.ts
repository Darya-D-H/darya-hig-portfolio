import { expect, test } from "@playwright/test";

// docs/07-test-plan.md §6: each page type, full page, at the four widths
// that matter (1068 is the breakpoint named in the brief). Baselines are
// generated on Linux in CI (.github/workflows/visual-baselines.yml) and
// committed, so this compares only on Linux and only in one project.
const WIDTHS = [1440, 1068, 734, 375] as const;
const PAGES = [
  { name: "home", path: "/" },
  { name: "projects", path: "/projects" },
  { name: "project", path: "/projects/invoice-tracker" },
  { name: "skills", path: "/skills" },
  { name: "experience", path: "/experience" },
  { name: "contact", path: "/contact" },
  { name: "not-found", path: "/no-such-page" },
] as const;

// Reduced motion: every reveal is at its final state from the start, so a
// screenshot never catches a mid-transition frame.
test.use({ contextOptions: { reducedMotion: "reduce" } });

test.describe("visual", { tag: "@visual" }, () => {
  test.beforeEach(() => {
    test.skip(
      test.info().project.name !== "desktop-chromium",
      "baselines exist for one engine only",
    );
  });
  test.skip(
    process.platform !== "linux",
    "baselines are Linux renders; run in CI, or regenerate them there",
  );

  for (const { name, path } of PAGES) {
    for (const width of WIDTHS) {
      test(`${name} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
          fullPage: true,
          animations: "disabled",
          // The placeholder images are deterministic but heavy; masking them
          // keeps the baselines small while their boxes still show layout.
          mask: [page.locator("main img")],
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  }
});
