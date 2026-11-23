import { expect, test, type Page } from "@playwright/test";
import { PAGES } from "./pages";

// docs/07-test-plan.md §5, zoom and text passes, automated:
// - 200% zoom of a 1280px window is a 640px viewport; 400% is 320px
//   (WCAG 1.4.10 Reflow);
// - a 20px browser default font size, the test that px type fails;
// - the WCAG 1.4.12 text-spacing overrides.
// Each must leave every page without sideways scroll or clipped text. The
// card summary is clamped to two lines by design (the full text is on the
// project page), so it is not counted. One project only: the viewports are
// set here.
test.use({ contextOptions: { reducedMotion: "reduce" } });

test.beforeEach(() => {
  test.skip(
    test.info().project.name !== "desktop-chromium",
    "sets its own viewports",
  );
});

const TEXT_SPACING = `
  * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
  p, li, dd { margin-bottom: 2em !important; }
`;
const DEFAULT_20PX = "html { font-size: 20px; }";

async function problems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > window.innerWidth + 1) {
      out.push(`scrolls sideways (${doc.scrollWidth} > ${window.innerWidth})`);
    }
    for (const el of document.querySelectorAll<HTMLElement>(
      "main *, header *, footer *",
    )) {
      const style = getComputedStyle(el);
      if (style.clipPath === "inset(50%)") continue; // visually hidden
      if (el.closest("dialog, #mobile-menu")) continue; // closed overlays
      if (el.matches(".line-clamp-2")) continue; // clamped by design
      const clips = [style.overflowX, style.overflowY].some((o) =>
        ["hidden", "clip"].includes(o),
      );
      if (!clips || !el.textContent?.trim()) continue;
      if (
        el.scrollWidth > el.clientWidth + 1 ||
        el.scrollHeight > el.clientHeight + 1
      ) {
        out.push(`clips "${el.textContent.trim().slice(0, 30)}"`);
      }
    }
    return out;
  });
}

const CASES = [
  { name: "200% zoom", width: 640, height: 400, css: "" },
  { name: "400% zoom", width: 320, height: 256, css: "" },
  {
    name: "20px default font, desktop",
    width: 1280,
    height: 800,
    css: DEFAULT_20PX,
  },
  {
    name: "20px default font, phone",
    width: 375,
    height: 812,
    css: DEFAULT_20PX,
  },
  {
    name: "text spacing, desktop",
    width: 1280,
    height: 800,
    css: TEXT_SPACING,
  },
  { name: "text spacing, phone", width: 375, height: 812, css: TEXT_SPACING },
];

for (const { name, width, height, css } of CASES) {
  test(`${name}: no page scrolls sideways or clips text`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const found: string[] = [];
    for (const path of [...PAGES, "/no-such-page"]) {
      await page.goto(path);
      if (css) await page.addStyleTag({ content: css });
      await page.evaluate(() => document.fonts.ready);
      for (const problem of await problems(page))
        found.push(`${path}: ${problem}`);
    }
    expect(found).toEqual([]);
  });
}
