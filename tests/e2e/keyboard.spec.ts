import { expect, test } from "@playwright/test";
import { PAGES } from "./pages";

// docs/07-test-plan.md §5, keyboard-only pass, automated: Tab through every
// page to the end; every stop shows a 2px ring (WCAG 2.4.7), none sits
// under the sticky nav (2.4.11), and the page has no keyboard trap.
// Chromium and Firefox only: WebKit's default Tab order skips links, as
// Safari does unless "Press Tab to highlight each item" is on.
test.use({ contextOptions: { reducedMotion: "reduce" } });

test.beforeEach(() => {
  test.skip(
    !["desktop-chromium", "desktop-firefox"].includes(test.info().project.name),
    "WebKit's default Tab order skips links",
  );
});

const MAX_STOPS = 60;

for (const width of [1280, 390]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const path of [...PAGES, "/no-such-page"]) {
      test(`${path}: every Tab stop is visible and clear of the nav`, async ({
        page,
      }) => {
        await page.goto(path);
        const seen: string[] = [];
        const problems: string[] = [];
        for (let i = 0; i < MAX_STOPS; i += 1) {
          await page.keyboard.press("Tab");
          const stop = await page.evaluate(() => {
            const el = document.activeElement as HTMLElement | null;
            if (!el || el === document.body) return null;
            const label = (
              el.getAttribute("aria-label") ??
              el.textContent ??
              ""
            )
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 40);
            // A stretched card link draws its ring on the card.
            const ringOn = el.matches("[data-card-link]")
              ? (el.closest(".card") as HTMLElement)
              : el;
            const style = getComputedStyle(ringOn);
            const box = ringOn.getBoundingClientRect();
            const nav = document
              .querySelector("header")!
              .getBoundingClientRect();
            const isSkip =
              el.getAttribute("href") === "#main" &&
              !el.closest("main, footer");
            return {
              key: `${el.tagName}:${label}`,
              ring:
                style.outlineStyle !== "none" &&
                parseFloat(style.outlineWidth) >= 2,
              underNav:
                !el.closest("header") && !isSkip && box.top < nav.bottom - 1,
              offScreen: box.bottom < 0 || box.top > window.innerHeight,
            };
          });
          if (!stop) break;
          if (seen[0] === stop.key) break; // wrapped round: no trap
          seen.push(stop.key);
          if (!stop.ring) problems.push(`no ring: ${stop.key}`);
          if (stop.underNav) problems.push(`under the nav: ${stop.key}`);
          if (stop.offScreen) problems.push(`off screen: ${stop.key}`);
        }
        expect(seen.length).toBeGreaterThan(5);
        expect(seen.length).toBeLessThan(MAX_STOPS);
        expect(problems).toEqual([]);
      });
    }
  });
}
