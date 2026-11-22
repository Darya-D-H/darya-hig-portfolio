import { expect, test } from "@playwright/test";
import { site } from "@/site.config";
import { NAV, PAGES } from "./pages";

// The rows of docs/07-test-plan.md §4 navigation.spec.ts that the pages
// built so far can answer. The rest land with the remaining pages.

test.describe("the 404 page", () => {
  test("is served with status 404 for an unknown path", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
  });

  test("leads with the message, not the code", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "The page you're looking for can't be found.",
    );
    await expect(page.getByRole("heading", { name: /404/ })).toHaveCount(0);
  });

  test("offers a text link home, not a button, at least 44px tall", async ({
    page,
  }) => {
    await page.goto("/no-such-page");
    const home = page
      .getByRole("main")
      .getByRole("link", { name: "Go to Home" });
    await expect(home).toHaveAttribute("href", "/");
    await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);
    const box = await home.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);

    await home.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("puts the status code after the link", async ({ page }) => {
    await page.goto("/no-such-page");
    const codeComesAfter = await page.evaluate(() => {
      const main = document.querySelector("main")!;
      const link = main.querySelector('a[href="/"]')!;
      const code = [...main.querySelectorAll("p")].find(
        (p) => p.textContent?.trim() === "Error 404",
      )!;
      return Boolean(
        link.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(codeComesAfter).toBe(true);
  });

  test("is kept out of search indexes and keeps the nav and footer", async ({
    page,
  }) => {
    await page.goto("/no-such-page");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.getByRole("navigation", { name: "Main" })).toBeAttached();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
});

test("contact and footer social links come from site.config", async ({
  page,
}) => {
  await page.goto("/contact");
  for (const scope of [page.getByRole("main"), page.getByRole("contentinfo")]) {
    await expect(scope.getByRole("link", { name: /^GitHub/ })).toHaveAttribute(
      "href",
      site.github,
    );
    await expect(
      scope.getByRole("link", { name: /^LinkedIn/ }),
    ).toHaveAttribute("href", site.linkedin);
  }
  await expect(
    page.getByRole("main").getByRole("link", { name: "Email me" }),
  ).toHaveAttribute("href", `mailto:${site.email}`);
});

test("the current page's nav link carries aria-current", async ({ page }) => {
  test.skip(
    (page.viewportSize()?.width ?? 0) < 735,
    "the desktop nav list is hidden below 735px",
  );
  for (const [path, label] of [
    ["/skills", "Skills"],
    ["/experience", "Experience"],
    ["/contact", "Contact"],
  ]) {
    await page.goto(path);
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.locator("[aria-current]")).toHaveCount(1);
  }
});

test.describe("site navigation", () => {
  test("every nav link reaches its page", async ({ page }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) < 735,
      "below 735px the links live in the mobile menu, covered by its spec",
    );
    for (const { href, label, h1 } of NAV) {
      await page.goto("/");
      await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: label, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`${href}/?$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
    }
  });

  test("the wordmark returns Home from every page", async ({ page }) => {
    for (const path of PAGES.filter((p) => p !== "/")) {
      await page.goto(path);
      await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: "Darya" })
        .click();
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test("the footer nav matches the header nav", async ({ page }) => {
    await page.goto("/");
    const hrefs = (name: string) =>
      page
        .getByRole("navigation", { name })
        .locator("a[data-nav-link]")
        .evaluateAll((links) =>
          links
            .map((a) => a.getAttribute("href"))
            .filter((href) => href !== "/"),
        );
    expect(await hrefs("Footer")).toEqual(await hrefs("Main"));
    expect(await hrefs("Footer")).toEqual(NAV.map((n) => n.href));
  });
});

test.describe("search metadata", () => {
  test("every page has its own title and description", async ({ page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const path of PAGES) {
      await page.goto(path);
      const title = await page.title();
      const description = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(title).toMatch(/ — Darya$|^Darya — /);
      expect(description?.length ?? 0).toBeGreaterThan(0);
      expect(description?.length ?? 0).toBeLessThanOrEqual(160);
      titles.add(title);
      descriptions.add(description ?? "");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        /^https?:\/\/.+\/$/,
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        /^https?:\/\//,
      );
    }
    expect(titles.size).toBe(PAGES.length);
    expect(descriptions.size).toBe(PAGES.length);
  });

  test("the sitemap lists every page and leaves out the 404", async ({
    request,
  }) => {
    const index = await request.get("/sitemap-index.xml");
    expect(index.ok()).toBe(true);
    const sitemap = await (await request.get("/sitemap-0.xml")).text();
    const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) =>
      new URL(loc ?? "").pathname.replace(/(.)\/$/, "$1"),
    );
    expect(paths.sort()).toEqual([...PAGES].sort());
    expect(sitemap).not.toContain("404");
  });

  test("robots.txt points at the sitemap", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/^Sitemap: https?:\/\/.+\/sitemap-index\.xml$/m);
  });

  test("the 404 has no canonical", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });
});
