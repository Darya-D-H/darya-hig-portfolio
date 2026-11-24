import { expect, test } from "@playwright/test";

// docs/07-test-plan.md §4, on Home: the hero is above the fold and never
// revealed; the about, featured and skills bands below it are.
const PAGE = "/";

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

  test("the Projects grid's first row is never revealed", async ({ page }) => {
    await page.goto("/projects");
    const cards = page.locator("[data-card-link]");
    for (let i = 0; i < 3; i += 1) {
      const card = cards.nth(i);
      await expect(card.locator("xpath=ancestor::*[@data-reveal]")).toHaveCount(
        0,
      );
    }
    // Later rows still reveal.
    await expect(
      cards.nth(3).locator("xpath=ancestor::*[@data-reveal]"),
    ).toHaveCount(1);
  });

  test("the hero is at full opacity on load and never revealed", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.getByRole("region", {
      name: /Quality is the part nobody asked for/,
    });
    await expect(hero.locator("[data-reveal]")).toHaveCount(0);
    expect(await opacity(hero)).toBe(1);
    expect(await opacity(page.getByRole("heading", { level: 1 }))).toBe(1);
  });

  test("the signature writes itself, one stroke after another", async ({
    page,
  }) => {
    await page.goto(PAGE);
    const timings = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => (a as CSSAnimation).animationName === "sign")
        .map((a) => {
          const { delay, duration } = a.effect!.getTiming();
          return { delay: Number(delay), duration: Number(duration) };
        }),
    );
    expect(timings).toHaveLength(7);
    // Each stroke starts after the one before it has finished.
    for (let i = 1; i < timings.length; i += 1) {
      const previous = timings[i - 1]!;
      expect(timings[i]!.delay).toBeGreaterThanOrEqual(
        previous.delay + previous.duration,
      );
    }
  });
});

test.describe("with reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("the signature is already written and nothing animates", async ({
    page,
  }) => {
    await page.goto(PAGE);
    const running = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((a) => (a as CSSAnimation).animationName === "sign").length,
    );
    expect(running).toBe(0);
    const offsets = await page
      .locator("svg.signature .pen")
      .evaluateAll((pens) =>
        pens.map((p) => getComputedStyle(p).strokeDashoffset),
      );
    expect(offsets).toHaveLength(7);
    for (const offset of offsets) expect(parseFloat(offset)).toBe(0);
  });

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
