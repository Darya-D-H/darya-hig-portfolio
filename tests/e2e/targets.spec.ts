import { expect, test, type Page } from "@playwright/test";
import { PAGES } from "./pages";

// docs/07-test-plan.md §4 and docs/05-accessibility-and-hig.md §1.4: every
// control is at least 44 × 44px, and adjacent targets are at least 8px
// apart. Two kinds of link are measured differently, as WCAG 2.5.8 allows:
// - a link inside a sentence (its size is set by the line of text), and
// - a card's title link, whose target is the whole card via ::after.
const MIN = 44;
const GAP = 8;

interface Target {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

async function targets(page: Page): Promise<Target[]> {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        // Visually hidden until focused, like the skip link: checked below.
        style.clipPath !== "inset(50%)" &&
        box.width > 1 &&
        box.height > 1 &&
        !el.closest("[inert], dialog:not([open]), #mobile-menu")
      );
    };
    const inSentence = (el: Element) => {
      const parent = el.parentElement;
      if (!parent || !["P", "LI", "DD"].includes(parent.tagName)) return false;
      // Text on either side in the same block means it sits in running text.
      return [...parent.childNodes].some(
        (node) =>
          node !== el &&
          node.nodeType === Node.TEXT_NODE &&
          (node.textContent ?? "").trim().length > 0,
      );
    };
    return [...document.querySelectorAll("a[href], button, [role='button']")]
      .filter((el) => visible(el) && !inSentence(el))
      .map((el) => {
        const card = el.matches("[data-card-link]")
          ? el.closest(".card")
          : null;
        const box = (card ?? el).getBoundingClientRect();
        return {
          label:
            (el.getAttribute("aria-label") ?? el.textContent ?? "")
              .replace(/\s+/g, " ")
              .trim() || el.outerHTML.slice(0, 60),
          x: box.x,
          y: box.y + window.scrollY,
          width: box.width,
          height: box.height,
        };
      });
  });
}

const overlaps = (a: Target, b: Target, gap: number) =>
  a.x < b.x + b.width + gap &&
  b.x < a.x + a.width + gap &&
  a.y < b.y + b.height + gap &&
  b.y < a.y + a.height + gap;

for (const path of PAGES) {
  test(`${path}: every target is at least 44 × 44px`, async ({ page }) => {
    await page.goto(path);
    const small = (await targets(page))
      .filter((t) => t.width < MIN - 0.5 || t.height < MIN - 0.5)
      .map(
        (t) => `${t.label} (${Math.round(t.width)}×${Math.round(t.height)})`,
      );
    expect(small).toEqual([]);
  });

  test(`${path}: adjacent targets are at least 8px apart`, async ({ page }) => {
    await page.goto(path);
    const all = await targets(page);
    const crowded: string[] = [];
    for (let i = 0; i < all.length; i += 1) {
      for (let j = i + 1; j < all.length; j += 1) {
        const [a, b] = [all[i], all[j]];
        if (!a || !b) continue;
        // A target nested in another (a link inside a card) is not a neighbour.
        const nested =
          (a.x <= b.x &&
            a.y <= b.y &&
            a.x + a.width >= b.x + b.width &&
            a.y + a.height >= b.y + b.height) ||
          (b.x <= a.x &&
            b.y <= a.y &&
            b.x + b.width >= a.x + a.width &&
            b.y + b.height >= a.y + a.height);
        if (!nested && overlaps(a, b, GAP - 0.5)) {
          crowded.push(`${a.label} ↔ ${b.label}`);
        }
      }
    }
    expect(crowded).toEqual([]);
  });
}

test("the skip link is at least 44px tall when focused", async ({ page }) => {
  await page.goto("/");
  // Focused directly: WebKit's default Tab order skips links, as Safari
  // does unless "Press Tab to highlight each item" is on.
  const skip = page.getByRole("link", { name: "Skip to content" });
  await skip.focus();
  await expect(skip).toBeFocused();
  const box = await skip.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(MIN);
  expect(box?.height).toBeGreaterThanOrEqual(MIN);
});
