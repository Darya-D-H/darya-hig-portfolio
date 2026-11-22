import { expect, test, type Page } from "@playwright/test";
import { follow } from "./helpers";

// docs/07-test-plan.md §4: Home → Projects → a project → back, by the links
// a visitor would click, with the client router doing the navigation.

const seeAllProjects = (page: Page) =>
  page.getByRole("main").getByRole("link", { name: "See all projects" });
const firstProject = (page: Page) =>
  page.getByRole("link", { name: "Invoice Tracker", exact: true });
const backToProjects = (page: Page) =>
  page.getByRole("main").getByRole("link", { name: "Projects", exact: true });

type Marked = HTMLElement & { marker?: string };

test("Home → Projects → a project and back keeps the nav and footer", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    (document.querySelector("header") as Marked).marker = "same";
    (document.querySelector("footer") as Marked).marker = "same";
    (window as Window & { sameDocument?: boolean }).sameDocument = true;
  });

  await follow(page, seeAllProjects(page));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  await follow(page, firstProject(page));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Invoice Tracker",
  );
  await follow(page, backToProjects(page));
  await expect(page).toHaveURL(/\/projects\/?$/);

  const kept = await page.evaluate(() => ({
    document: (window as Window & { sameDocument?: boolean }).sameDocument,
    header: (document.querySelector("header") as Marked).marker,
    footer: (document.querySelector("footer") as Marked).marker,
  }));
  expect(kept).toEqual({ document: true, header: "same", footer: "same" });
});

test("aria-current follows the page on the persisted nav", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const wordmark = nav.getByRole("link", { name: "Darya" });
  await expect(wordmark).toHaveAttribute("aria-current", "page");

  await follow(page, seeAllProjects(page));
  await expect(wordmark).not.toHaveAttribute("aria-current");
  await expect(nav.locator("[aria-current]")).toHaveAttribute(
    "href",
    "/projects",
  );

  await follow(page, firstProject(page));
  // A project is inside Projects, not Projects itself.
  await expect(nav.locator("[aria-current]")).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("scroll reveal still works after a client-side navigation", async ({
  page,
  contextOptions,
}) => {
  await page.goto("/");
  await follow(page, seeAllProjects(page));

  // The router copies the next page's <html class="no-js">; it must not
  // stick, or every reveal fallback would switch on.
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
    await follow(page, seeAllProjects(page));
    await follow(page, firstProject(page));

    // A double-bound listener would open and immediately close again.
    const trigger = page.getByRole("button", { name: "Menu", exact: true });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#mobile-menu")).toBeVisible();
  });

  test("the lightbox works after a client-side navigation", async ({
    page,
  }) => {
    await page.goto("/");
    await follow(page, seeAllProjects(page));
    await follow(page, firstProject(page));
    const thumb = page
      .getByRole("region", { name: "Gallery" })
      .getByRole("button")
      .first();
    await thumb.scrollIntoViewIfNeeded();
    await thumb.click();
    await expect(
      page.getByRole("dialog", { name: "Image viewer" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(thumb).toBeFocused();
  });
});
