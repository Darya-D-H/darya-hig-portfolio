import type { Locator, Page } from "@playwright/test";

/**
 * Clicks a link and waits for the client router's astro:page-load. A
 * client-side navigation fires no load event, and the URL changes before
 * the new page is swapped in, so waiting on either can race the old DOM.
 */
export async function follow(page: Page, link: Locator): Promise<void> {
  await page.evaluate(() => {
    const w = window as Window & { pageLoaded?: boolean };
    w.pageLoaded = false;
    document.addEventListener(
      "astro:page-load",
      () => {
        w.pageLoaded = true;
      },
      { once: true },
    );
  });
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await page.waitForFunction(
    () => (window as Window & { pageLoaded?: boolean }).pageLoaded === true,
  );
}

/**
 * Brings the page to its settled state: every reveal shown, and no
 * time-based animation or transition still running. Scanning sooner
 * measures colours mid-fade; a fixed wait is shorter than the longest
 * staggered reveal. Scroll-driven animations (the nav hairline) are always
 * "running", because their timeline is the scroll position, so they are
 * not waited on.
 */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() =>
    document
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((el) => (el.dataset.revealed = "true")),
  );
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) => a.playState !== "running" || a.timeline !== document.timeline,
      ),
  );
}
