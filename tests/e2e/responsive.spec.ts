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

// On a screen taller than the page, the space left above the footer belongs
// to the page's last band, so a grey band meets the grey footer instead of
// leaving a strip of page white between them. Seen on Skills at 2560 × 1440,
// and on Projects and Experience at 4K. One project only: the viewports are
// set here.
test.describe("tall screens", () => {
  test.beforeEach(() => {
    test.skip(
      test.info().project.name !== "desktop-chromium",
      "sets its own viewports",
    );
  });

  for (const [width, height] of [
    [2560, 1440],
    [3840, 2160],
  ] as const) {
    for (const path of [...PAGES, "/no-such-page"]) {
      test(`${path} at ${width} × ${height}: the last band meets the footer`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        await page.goto(path);
        const gap = await page.evaluate(() => {
          const last = document.querySelector("#main")?.lastElementChild;
          const footer = document.querySelector("body > footer");
          if (!last || !footer) return Number.NaN;
          return (
            footer.getBoundingClientRect().top -
            last.getBoundingClientRect().bottom
          );
        });
        expect(gap).toBeCloseTo(0, 0);
      });
    }
  }
});
