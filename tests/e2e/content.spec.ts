import { expect, test } from "@playwright/test";
import { follow } from "./helpers";

// docs/07-test-plan.md §4. The Home "exactly three featured" row lands with
// the Home page in the next part.
const GRID_ORDER = [
  "invoice-tracker",
  "component-library",
  "api-gateway",
  "booking-widget",
  "cli-toolkit",
  "portfolio-site",
];

test("every project has a detail page reachable from the grid", async ({
  page,
}) => {
  await page.goto("/projects");
  const hrefs = await page
    .locator("[data-card-link]")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  expect(hrefs).toEqual(GRID_ORDER.map((slug) => `/projects/${slug}`));

  for (const href of hrefs) {
    const response = await page.goto(href ?? "");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("a card's link is named by its title alone", async ({ page }) => {
  await page.goto("/projects");
  await expect(
    page.getByRole("link", { name: "Invoice Tracker", exact: true }),
  ).toHaveAttribute("href", "/projects/invoice-tracker");
});

test("a project without a live link shows only its source link", async ({
  page,
}) => {
  await page.goto("/projects/api-gateway");
  const links = page.getByRole("list", { name: "Project links" });
  await expect(links.getByRole("link")).toHaveCount(1);
  await expect(links.getByRole("link")).toHaveText(/View source/);
  await expect(page.getByRole("link", { name: /View live site/ })).toHaveCount(
    0,
  );
});

test("a project without a design system has no such heading", async ({
  page,
}) => {
  for (const slug of ["api-gateway", "cli-toolkit"]) {
    await page.goto(`/projects/${slug}`);
    await expect(
      page.getByRole("heading", { name: "Design system" }),
    ).toHaveCount(0);
  }
});

test("the sparse project has no meta strip, links or design system", async ({
  page,
}) => {
  await page.goto("/projects/cli-toolkit");
  const main = page.getByRole("main");
  await expect(main.getByText("Year", { exact: true })).toHaveCount(0);
  await expect(main.getByText("Role", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Project links" })).toHaveCount(
    0,
  );
  // No empty wrapper is left where an optional section would have been.
  const empty = await main.evaluate(
    (el) =>
      [...el.querySelectorAll("div, section, dl, ul")].filter(
        (node) => node.children.length === 0 && !node.textContent?.trim(),
      ).length,
  );
  expect(empty).toBe(0);
});

test.describe("prev and next", () => {
  test("the first project has only Next, the last only Previous", async ({
    page,
  }) => {
    const pager = page.getByRole("navigation", { name: "More projects" });

    await page.goto(`/projects/${GRID_ORDER[0]}`);
    await expect(pager.getByRole("link")).toHaveCount(1);
    await expect(pager.getByRole("link")).toHaveAttribute("rel", "next");

    await page.goto(`/projects/${GRID_ORDER.at(-1)}`);
    await expect(pager.getByRole("link")).toHaveCount(1);
    await expect(pager.getByRole("link")).toHaveAttribute("rel", "prev");
  });

  test("following Next from the first visits all six in grid order", async ({
    page,
  }) => {
    await page.goto(`/projects/${GRID_ORDER[0]}`);
    const visited = [GRID_ORDER[0]];
    for (let i = 1; i < GRID_ORDER.length; i += 1) {
      // Wait for the router's page-load, not the URL: the URL changes
      // before the swap, and clicking "Next" then can hit the old page.
      await follow(
        page,
        page
          .getByRole("navigation", { name: "More projects" })
          .getByRole("link", { name: /Next project/ }),
      );
      await expect(page).toHaveURL(new RegExp(`/projects/${GRID_ORDER[i]}/?$`));
      visited.push(new URL(page.url()).pathname.split("/").pop() ?? "");
    }
    expect(visited).toEqual(GRID_ORDER);
  });

  test("each link's name includes the neighbour's title", async ({ page }) => {
    await page.goto("/projects/component-library");
    const pager = page.getByRole("navigation", { name: "More projects" });
    await expect(
      pager.getByRole("link", { name: /Previous project.*Invoice Tracker/ }),
    ).toBeVisible();
    await expect(
      pager.getByRole("link", { name: /Next project.*API Gateway/ }),
    ).toBeVisible();
  });
});

test("Home renders exactly three featured projects", async ({ page }) => {
  await page.goto("/");
  const featured = page.getByRole("region", { name: "Featured projects" });
  await expect(featured.locator("[data-card-link]")).toHaveCount(3);
});

test.describe("Experience", () => {
  test("roles come first, then Education as its own named band", async ({
    page,
  }) => {
    await page.goto("/experience");
    const h2s = await page.locator("main h2").allTextContents();
    expect(h2s.map((t) => t.trim())).toEqual(["Roles", "Education"]);
    await expect(
      page.getByRole("heading", { level: 2, name: "Education" }),
    ).toBeVisible();
  });

  test("each qualification is an article with an h3 and machine-readable dates", async ({
    page,
  }) => {
    await page.goto("/experience");
    const items = page.locator(
      'section[aria-labelledby="education-heading"] ol > li',
    );
    await expect(items).toHaveCount(2);
    for (const item of await items.all()) {
      await expect(item.locator("article h3")).toHaveCount(1);
      for (const time of await item.locator("time").all()) {
        expect(await time.getAttribute("datetime")).toMatch(/^\d{4}-\d{2}$/);
      }
    }
  });

  test("an entry without details or location leaves nothing behind", async ({
    page,
  }) => {
    await page.goto("/experience");
    const minimal = page
      .locator('section[aria-labelledby="education-heading"] article')
      .filter({ hasText: "Certificate or course name" });
    await expect(minimal.locator("ul")).toHaveCount(0);
    await expect(minimal.locator("p")).toHaveText(
      /^TODO: Provider · Jan 2022 — Apr 2022$/,
    );
  });
});

test("Home opens with Darya's quote above the headline", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator('section[aria-labelledby="hero-title"]');
  const quote = hero.locator("blockquote");
  await expect(quote).toHaveText(/^“.+”$/);
  const quoteBox = await quote.boundingBox();
  const h1Box = await hero.locator("h1").boundingBox();
  expect(quoteBox!.y + quoteBox!.height).toBeLessThan(h1Box!.y);
});
