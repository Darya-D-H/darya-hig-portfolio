# Test and Verification Plan

**Status:** Draft, awaiting approval

A static portfolio has almost no business logic, so a line-coverage target would be a vanity number. What can actually break here is different: layout at odd widths, keyboard paths, focus visibility, motion preferences, image weight, and content that is longer than the designer imagined. The plan is built around those.

---

## 1. The verification gate

```bash
npm run verify
```

Runs, in order, stopping at the first failure:

1. `prettier --check .`
2. `eslint .`
3. `astro check && tsc --noEmit`
4. `vitest run`
5. `astro build`

Nothing is committed unless this passes. CI runs the same command on every push and pull request, so local and CI results cannot diverge.

E2E, accessibility, visual and Lighthouse suites are separate because they need a built site and a browser. They run on pull requests and before any release.

---

## 2. Static analysis

| Check          | Tool                                          | Catches                                                             |
| -------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| Formatting     | Prettier + `prettier-plugin-astro`            | Inconsistent formatting, unsorted Tailwind classes                  |
| Linting        | ESLint + `eslint-plugin-astro`                | Unused code, bad patterns                                           |
| Markup a11y    | `eslint-plugin-jsx-a11y` via the Astro plugin | Missing `alt`, click handlers on non-interactive elements, bad ARIA |
| Types          | `astro check`, `tsc --noEmit`                 | Prop mismatches, content-schema violations                          |
| Content schema | Zod, at build time                            | Missing or mistyped front-matter fields, bad image paths            |
| Dead links     | `astro build`                                 | Broken `getStaticPaths` references                                  |

### Custom checks

Two small scripts, because these are project-specific rules that no off-the-shelf linter knows about:

**`npm run check:tokens`** — greps the component tree for Tailwind arbitrary-value syntax (`text-[`, `p-[`, `bg-[#`, `duration-[`, `rounded-[`) and fails if any is found. This is the mechanical enforcement of the no-arbitrary-values rule from [ADR-0002](adr/ADR-0002-tailwind-v4-tokens.md); without it the rule depends entirely on a human noticing.

**`npm run check:todo`** — fails when `TODO:` appears in `src/content/` or `src/pages/` **and** the `--prod` flag is set. Without the flag it lists every placeholder by file and line and passes. Placeholder copy is meant to exist during the build phase and never to ship. Part of the release checklist, not of `verify`. `npm run check:todo --prod` hands the flag to npm rather than the script; the script reads it from npm's `npm_config_prod` as well, so that form and `npm run check:todo -- --prod` both work.

---

## 3. Unit tests — Vitest

Lives in `tests/unit/`. There are only a handful of pure functions, and each gets tests for its edge cases rather than its happy path.

| Module            | Cases                                                                                                                                                                                                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/seo.ts`      | Title composition; a title already ending in the suffix is not doubled; a description longer than 160 characters is truncated at a word boundary, not mid-word; special characters pass through unchanged, because Astro escapes attribute values and escaping them in `seo.ts` as well would double-escape |
| `lib/reveal.ts`   | Stagger delay is `min(index, 4) * 80`; index 0 → 0ms; index 5 and index 9 both → 320ms (the cap)                                                                                                                                                                                                            |
| `lib/menu.ts`     | Focus-trap index arithmetic: wrapping forward from the last element, wrapping backward from the first, behaviour with a single focusable element                                                                                                                                                            |
| `lib/lightbox.ts` | Index clamping at both ends; `next` at the last index does not advance; the announcement string is 1-based (`Image 1 of 6`, never `Image 0 of 6`)                                                                                                                                                           |
| Content images    | Every image path in every content file's front matter exists. Astro only resolves an `image()` path when a page renders it, so without this a draft's broken path would build cleanly                                                                                                                       |
| `lib/projects.ts` | `getAdjacent`: first project has no `prev`, last has no `next`, a middle one has both; a single-project list has neither; drafts are skipped as neighbours; an unknown slug throws. Duplicate `order` values throw and name both files                                                                      |

The off-by-one cases are listed explicitly because they are the bugs that actually occur in focus traps and carousels.

---

## 4. End-to-end tests — Playwright

Lives in `tests/e2e/`. Run against the built site via `npm run preview`.

### Projects (browser × preference matrix)

| Project            | Browser  | Viewport   | Notes                                      |
| ------------------ | -------- | ---------- | ------------------------------------------ |
| `desktop-chromium` | Chromium | 1440 × 900 |                                            |
| `desktop-webkit`   | WebKit   | 1440 × 900 | Closest available proxy for Safari         |
| `desktop-firefox`  | Firefox  | 1440 × 900 |                                            |
| `tablet`           | WebKit   | 768 × 1024 | Lands between the 735 and 1069 breakpoints |
| `mobile`           | WebKit   | 390 × 844  | iPhone-class                               |
| `mobile-small`     | WebKit   | 320 × 568  | The Reflow floor                           |
| `reduced-motion`   | Chromium | 1440 × 900 | `reducedMotion: "reduce"`                  |

Running reduced motion as a Playwright project rather than a manual toggle is what makes it get tested at all. It is otherwise the first thing forgotten.

### Specs

**`navigation.spec.ts`**

- Every nav link reaches the right page.
- The wordmark returns to Home from every page.
- The active page's nav link carries `aria-current="page"`.
- The footer nav matches the header nav.
- The 404 page renders with nav and footer intact. Its `h1` is the plain-language message, not the code. `Go to Home` is an `<a href="/">` (not a `<button>`, and not styled with the `Button` component) that reaches Home and is at least 44px tall. `Error 404` comes after the button in DOM order. The page carries `noindex` and is absent from the sitemap.
- Contact and Footer social links point at exactly the URLs in `src/site.config.ts`, so neither page hardcodes them.

**`mobile-menu.spec.ts`** — at 390px:

- The trigger has `aria-expanded="false"` initially.
- Clicking opens the panel and sets `aria-expanded="true"`.
- Focus lands on the first link in the panel.
- `Tab` from the last item wraps to the first; `Shift+Tab` from the first wraps to the last.
- `Escape` closes the panel **and returns focus to the trigger**.
- Background content is inert while open: a `Tab` press does not land on anything behind the panel.
- `<body>` does not scroll while open.
- Resizing above 735px while open closes the panel.

**`lightbox.spec.ts`** — on a project page with a gallery:

- Clicking a thumbnail opens the dialog at that index.
- Focus moves to the close button.
- `ArrowRight` / `ArrowLeft` move between images.
- Prev is disabled at the first image, next at the last.
- The live region announces `Image N of M`.
- `Escape` closes **and returns focus to the thumbnail that was clicked**, not to the top of the page.
- Clicking the scrim closes it.
- A project with no gallery renders no gallery section and no empty band.

**`reveal.spec.ts`**

- Elements below the fold start at opacity 0 and reach opacity 1 after scrolling into view.
- An element that has revealed does not re-animate when scrolled away from and back.
- **Hero content is at full opacity on load**, never animated.
- In the `reduced-motion` project, every `[data-reveal]` element is at opacity 1 immediately, without scrolling.
- With JavaScript disabled, all content is visible.

**`view-transitions.spec.ts`**

- Navigating Home → Projects → a project detail page and back leaves the nav and footer in place.
- **Scroll reveal still works after a client-side navigation.** This is the specific bug that `astro:page-load` exists to prevent, and it is invisible on a hard reload.
- The menu still opens after a client-side navigation (listeners re-bound, and not double-bound).

**`targets.spec.ts`**

- Every `a`, `button` and `[role="button"]` on every page has a bounding box of at least 44 × 44 px.
- Adjacent interactive elements are at least 8px apart.

**`content.spec.ts`**

- All six projects have a detail page reachable from the grid.
- Home renders exactly three featured projects.
- A project without a live link renders no live link, and no stray separator.
- A project without `designSystem` renders no design-system heading.
- The sparse project (`cli-toolkit`) renders without a meta strip and without visual gaps.
- Prev/next: the first project in grid order has only a _Next_ link, the last only a _Previous_ link, and following _Next_ from the first project visits all six in grid order.
- The pager sits inside `nav[aria-label="More projects"]`, and each link's text includes the neighbour's title.

**`fonts.spec.ts`** — guards the rules in [docs/02-design-tokens.md](02-design-tokens.md) §2:

- No page contains `<link rel="preload">` for a font.
- In every engine in the matrix (all Linux, so none has SF), `document.fonts.check('16px Inter')` resolves true after load and `body`'s computed `font-family` is not a serif.
- The computed `font-family` lists `-apple-system` before the Inter family, and the Inter family before `system-ui`.

**`responsive.spec.ts`** — at each viewport in the matrix:

- `document.scrollWidth` does not exceed the viewport width, on every page. This single assertion catches most horizontal-overflow bugs.
- No element overflows its container.

### Why focus-return is asserted three times

Returning focus to the triggering element after closing a menu or dialog is the most commonly omitted part of a modal implementation, and its absence is invisible to a mouse user. It is asserted for the menu, for the lightbox, and after view transitions.

---

## 5. Accessibility testing

### Automated — `tests/e2e/a11y.spec.ts`, tagged `@a11y`

axe-core via `@axe-core/playwright`, with `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` rule tags, run against:

| Target                                    | Why                                                   |
| ----------------------------------------- | ----------------------------------------------------- |
| All six page types, desktop               | Baseline                                              |
| All six page types, mobile                | Different DOM: the menu trigger replaces the nav list |
| Home with the mobile menu **open**        | A closed menu tests nothing about the menu            |
| A project page with the lightbox **open** | Same reasoning                                        |
| The 404 page                              | Routinely forgotten                                   |

Zero violations is the gate. Not "zero serious violations".

**What automated testing does not catch**, and therefore what the manual passes are for: a heading level that is valid but illogical, alt text that describes the wrong thing, a focus order that is legal but confusing, a focus ring hidden behind the sticky nav, a link whose text makes no sense out of context, and whether the page is actually usable with a screen reader. Expect axe to find roughly a third of real issues.

### Manual passes — each one a release gate

**Keyboard-only.** Mouse unplugged. Per page: `Tab` from the top through every element; confirm the focus ring is always visible and never clipped by the sticky nav (this is WCAG 2.4.11, new in 2.2, and the sticky nav is a direct threat to it); operate the menu with `Enter` and `Escape`; open the lightbox, navigate with arrows, close with `Escape`; confirm focus returns correctly each time; confirm no element becomes a trap.

**Screen reader.** VoiceOver + Safari on macOS, and VoiceOver on iOS.

- `VO+U` heading list reads as a sensible table of contents for each page.
- The links list has no duplicates and no meaningless entries ("read more" ×6).
- Images are described usefully, or correctly skipped.
- The timeline reads as an ordered list of roles with dates.
- The lightbox announces its position.
- The nav announces the current page.

**Reduced motion.** OS setting on. Every page: nothing moves on scroll, all content visible, hover and focus colour feedback still present.

**Zoom and text size.**

- 200% browser zoom, every page: no clipping, no overlap, no horizontal scroll.
- 400% zoom at a 1280px window (WCAG 1.4.10 Reflow).
- Browser default font size raised to 20px: layout holds. This is the test that `px` font sizes fail and `rem` passes, and it is the reason for that token decision.

**Text spacing.** Apply the WCAG 1.4.12 overrides (line-height 1.5×, paragraph spacing 2×, letter-spacing 0.12em, word-spacing 0.16em) via bookmarklet. No content is lost or clipped.

**Non-Apple typography.** Load the site on Windows or Android. Confirm the letter-spacing values, which were tuned for SF, do not read as too loose or too tight on Segoe UI / Roboto. This is the cost of [ADR-0003](adr/ADR-0003-typography-and-sf-pro-licensing.md) and the only way to see it.

**Real iPhone, Safari.** The only reliable way to catch: safe-area inset problems on a notched device, `backdrop-filter` scroll performance, momentum-scroll jank, the dynamic-viewport (`100vh`) issue, and whether the mobile menu actually feels right under a thumb.

### Contrast verification

Any new or changed colour is checked before it lands. The script used for the ratios in [docs/02-design-tokens.md](02-design-tokens.md):

```js
// scripts/contrast.mjs — node scripts/contrast.mjs
const lin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const L = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * lin((n >> 16) & 255) +
    0.7152 * lin((n >> 8) & 255) +
    0.0722 * lin(n & 255)
  );
};
export const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)];
  const [hi, lo] = [Math.max(x, y), Math.min(x, y)];
  return (hi + 0.05) / (lo + 0.05);
};
```

Thresholds: 4.5:1 normal text, 3:1 large text (≥24px, or ≥19px at weight 600), 3:1 for focus indicators and meaningful UI boundaries.

This script is how the `#0077ed` hover problem was found — a value copied straight from apple.com that fails AA. Check, do not assume.

---

## 6. Visual regression

`tests/e2e/visual.spec.ts`, Playwright screenshots at 1440, 1068, 734 and 375 widths, full page, for each of the six page types.

Baselines are committed. A diff fails the run and must be reviewed and either accepted (`--update-snapshots`) or fixed.

**Flakiness controls**, because without them screenshot tests get deleted within a week:

- Animations disabled for screenshot runs (`animations: "disabled"`).
- Reveal elements forced to their revealed state, so a screenshot never catches a mid-transition frame.
- Fixed placeholder images, never remote ones.
- `maxDiffPixelRatio: 0.01` to absorb font-rendering noise between machines.
- Baselines generated in CI, not locally, so the platform is consistent.

The 1068px shot matters most: it is exactly the breakpoint named in the brief, and the boundary where the type scale changes.

---

## 7. Performance

Lighthouse CI against the built site, mobile profile, three runs with the median taken.

| Metric                | Budget   | Fails if        |
| --------------------- | -------- | --------------- |
| Performance           | ≥ 95     | —               |
| Accessibility         | 100      | any violation   |
| Best practices        | ≥ 95     | —               |
| SEO                   | ≥ 95     | —               |
| LCP                   | < 2.0s   | —               |
| CLS                   | < 0.05   | —               |
| TBT                   | < 150ms  | —               |
| JS transferred (gzip) | < 15 KB  | —               |
| Page weight           | < 500 KB | any single page |

### Specific things to watch

- **The LCP element must not be animated.** The hero image on a project page is `loading="eager"` with `fetchpriority="high"` and no reveal. Fading in the largest element is a direct LCP cost.
- **Every image needs explicit dimensions.** Guaranteed by `image()` in the content schema; verified by the CLS budget.
- **`backdrop-filter` is a compositing cost.** If TBT or scroll smoothness suffers on a real mid-range phone, reduce the blur radius rather than adding layers.
- **Images are the only realistic way to blow the page-weight budget.** Placeholder images are deliberately realistic in size so the budget is tested against something representative — a 2 KB placeholder makes the score meaningless.

---

## 8. Test matrix summary

| Page           | Types | Lint | Unit | E2E | a11y | Visual | Lighthouse | Manual |
| -------------- | ----- | ---- | ---- | --- | ---- | ------ | ---------- | ------ |
| Home           | ✓     | ✓    | —    | ✓   | ✓    | ✓      | ✓          | ✓      |
| Projects       | ✓     | ✓    | —    | ✓   | ✓    | ✓      | ✓          | ✓      |
| Project detail | ✓     | ✓    | —    | ✓   | ✓    | ✓      | ✓          | ✓      |
| Skills         | ✓     | ✓    | —    | ✓   | ✓    | ✓      | ✓          | ✓      |
| Experience     | ✓     | ✓    | —    | ✓   | ✓    | ✓      | ✓          | ✓      |
| Contact        | ✓     | ✓    | —    | ✓   | ✓    | ✓      | ✓          | ✓      |
| 404            | ✓     | ✓    | —    | ✓   | ✓    | ✓      | —          | —      |
| `lib/*`        | ✓     | ✓    | ✓    | ✓   | —    | —      | —          | —      |

---

## 9. Release checklist

Run in order before any deploy:

- [ ] `npm run verify` passes from a clean clone (`rm -rf node_modules dist && npm ci`)
- [ ] `npm run test:e2e` passes across the full project matrix
- [ ] `npm run test:a11y` reports zero violations
- [ ] Visual baselines reviewed; no unexplained diffs
- [ ] Lighthouse meets every budget
- [ ] `npm run check:tokens` passes
- [ ] `npm run check:todo --prod` passes — **no placeholder copy ships**
- [ ] Keyboard-only pass complete on every page
- [ ] VoiceOver pass complete on macOS and iOS
- [ ] Reduced-motion pass complete
- [ ] 200% zoom, 400% reflow, and 20px default font size all pass
- [ ] Tested on a physical iPhone in Safari
- [ ] Tested on a non-Apple platform for typography (Inter tracking reads correctly)
- [ ] On a real Mac and iPhone, the Network panel shows **no** Inter font request
- [ ] Tested in the last two major versions of each supported browser (spec §3)
- [ ] `LICENSE` present; Inter's OFL notice included in the build
- [ ] `site` is set to the real origin; sitemap and canonical URLs are correct
- [ ] `base` resolved for the chosen host, and the deployed site re-verified ([ADR-0005](adr/ADR-0005-defer-hosting-decision.md))
- [ ] The `mailto:` opens a message to darya.dler.contact@gmail.com; GitHub and LinkedIn URLs resolve (not a 404 on either site)
- [ ] The host returns status `404`, not `200`, for an unknown path (`curl -I <site>/nope`)
- [ ] `robots.txt` and `og-image.png` present
- [ ] `docs/accessibility-report.md` written with date, tools and findings
- [ ] Every doc in `/docs` matches what the code does
