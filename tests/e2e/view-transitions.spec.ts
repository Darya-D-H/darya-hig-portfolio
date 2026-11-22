import { expect, test, type Page } from "@playwright/test";

// docs/07-test-plan.md §4. Until the real pages exist (Phase 5), the trip
// is / → /_tokens → / using an injected link, which the client router
// intercepts like any other.
async function clientNavigate(page: Page, href: string) {
  await page.evaluate((to) => {
    const w = window as Window & { pageLoaded?: boolean };
    w.pageLoaded = false;
    document.addEventListener(
      "astro:page-load",
      () => {
        w.pageLoaded = true;
      },
      { once: true },
    );
    const a = document.createElement("a");
    a.href = to;
    a.textContent = "test navigation";
    a.id = "test-navigation";
    document.querySelector("main")?.prepend(a);
  }, href);
  // A real click: the router ignores synthetic ones.
  await page.locator("#test-navigation").click();
  await page.waitForFunction(
    () => (window as Window & { pageLoaded?: boolean }).pageLoaded === true,
  );
}

test("the nav and footer persist across a client-side navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    (
      document.querySelector("header") as HTMLElement & { marker?: string }
    ).marker = "same";
    (
      document.querySelector("footer") as HTMLElement & { marker?: string }
    ).marker = "same";
    (window as Window & { sameDocument?: boolean }).sameDocument = true;
  });

  await clientNavigate(page, "/_tokens");
  await expect(page.locator("h1")).toHaveText("Design tokens");

  const kept = await page.evaluate(() => ({
    document: (window as Window & { sameDocument?: boolean }).sameDocument,
    header: (
      document.querySelector("header") as HTMLElement & { marker?: string }
    ).marker,
    footer: (
      document.querySelector("footer") as HTMLElement & { marker?: string }
    ).marker,
  }));
  expect(kept).toEqual({ document: true, header: "same", footer: "same" });
});

test("aria-current follows the page on the persisted nav", async ({ page }) => {
  await page.goto("/_tokens");
  const wordmark = page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link")
    .first();
  await expect(wordmark).not.toHaveAttribute("aria-current");
  await clientNavigate(page, "/");
  await expect(wordmark).toHaveAttribute("aria-current", "page");
});

test("scroll reveal still works after a client-side navigation", async ({
  page,
  contextOptions,
}) => {
  await page.goto("/");
  await clientNavigate(page, "/_tokens");

  // The no-js class must not come back with the swapped <html>, or every
  // reveal fallback (and the no-JS nav) would switch on.
  await expect(page.locator("html")).not.toHaveClass(/no-js/);

  const last = page.locator("[data-reveal]").last();
  const opacity = () =>
    last.evaluate((el) => Number(getComputedStyle(el).opacity));
  if (contextOptions?.reducedMotion !== "reduce") {
    await expect(last).not.toHaveAttribute("data-revealed", "true");
    expect(await opacity()).toBe(0);
  }
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveAttribute("data-revealed", "true");
  await expect.poll(opacity).toBe(1);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the menu opens once per tap after navigating", async ({ page }) => {
    await page.goto("/");
    await clientNavigate(page, "/_tokens");
    await clientNavigate(page, "/");

    // A double-bound listener would open and immediately close again.
    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#mobile-menu")).toBeVisible();
  });
});
