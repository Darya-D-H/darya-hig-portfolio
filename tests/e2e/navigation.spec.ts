import { expect, test } from "@playwright/test";
import { site } from "@/site.config";

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
