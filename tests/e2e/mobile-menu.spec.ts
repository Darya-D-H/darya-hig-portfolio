import { expect, test, type Page } from "@playwright/test";

// docs/07-test-plan.md §4, at 390px. Runs in every project at that width,
// whatever engine the project uses.
test.use({ viewport: { width: 390, height: 844 } });

const trigger = (page: Page) =>
  page.getByRole("button", { name: "Menu", exact: true });
const panelLinks = (page: Page) =>
  page.getByRole("navigation", { name: "Menu" }).getByRole("link");
const closeButton = (page: Page) =>
  page.getByRole("button", { name: "Close menu" });

async function openMenu(page: Page) {
  await page.goto("/");
  await trigger(page).click();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
}

test("the trigger starts collapsed", async ({ page }) => {
  await page.goto("/");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#mobile-menu")).toBeHidden();
});

test("opening moves focus to the first link", async ({ page }) => {
  await openMenu(page);
  await expect(page.locator("#mobile-menu")).toBeVisible();
  await expect(panelLinks(page).first()).toBeFocused();
});

test("Tab wraps from the last item to the first", async ({ page }) => {
  await openMenu(page);
  await panelLinks(page).last().focus();
  await page.keyboard.press("Tab");
  await expect(closeButton(page)).toBeFocused();
});

test("Shift+Tab wraps from the first item to the last", async ({ page }) => {
  await openMenu(page);
  await closeButton(page).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(panelLinks(page).last()).toBeFocused();
});

test("Escape closes and returns focus to the trigger", async ({ page }) => {
  await openMenu(page);
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#mobile-menu")).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("the close button and the scrim both close it", async ({ page }) => {
  await openMenu(page);
  await closeButton(page).click();
  await expect(page.locator("#mobile-menu")).toBeHidden();

  await trigger(page).click();
  await expect(page.locator("#mobile-menu")).toBeVisible();
  // Bottom of the viewport: the scrim, below the panel.
  await page.mouse.click(195, 820);
  await expect(page.locator("#mobile-menu")).toBeHidden();
});

test("the background is inert while open", async ({ page }) => {
  await openMenu(page);
  for (const selector of ["header", "main", "footer"]) {
    await expect(page.locator(selector).first()).toHaveJSProperty(
      "inert",
      true,
    );
  }
  // Ten Tabs never leave the panel.
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press("Tab");
    const inPanel = await page.evaluate(
      () => !!document.activeElement?.closest("#mobile-menu"),
    );
    expect(inPanel).toBe(true);
  }
});

test("the body does not scroll while open", async ({ page }) => {
  await openMenu(page);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("resizing above 735px closes it", async ({ page }) => {
  await openMenu(page);
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(page.locator("#mobile-menu")).toBeHidden();
  // The trigger itself is display:none at this width, so query it directly.
  await expect(page.locator("[data-menu-trigger]")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.locator("main")).toHaveJSProperty("inert", false);
});
