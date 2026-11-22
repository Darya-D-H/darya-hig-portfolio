# Design Tokens

**Status:** Draft, awaiting approval

Every value in this document becomes a token in `src/styles/global.css`. A component that needs a value not listed here is a signal that a token is missing — add it to this doc first, then to the CSS.

Tailwind v4 reads its theme from a CSS-native `@theme` block, so these tokens are real custom properties. They are available both as Tailwind utilities (`bg-surface-sunken`, `text-headline`) and as plain CSS variables (`var(--color-surface-sunken)`) in the rare cases where a utility will not do.

---

## 1. Colour

### Palette

| Token                   | Value                    | Used for                                         |
| ----------------------- | ------------------------ | ------------------------------------------------ |
| `--color-canvas`        | `#ffffff`                | Page background, white bands, card surfaces      |
| `--color-section`       | `#f5f5f7`                | Alternating section bands, as specified          |
| `--color-card`          | `#ffffff`                | Card surfaces sitting on a grey band             |
| `--color-ink`           | `#1d1d1f`                | Primary text, headings                           |
| `--color-ink-secondary` | `#6e6e73`                | Body copy, captions, metadata                    |
| `--color-ink-tertiary`  | `#86868b`                | De-emphasised labels, timestamps                 |
| `--color-accent`        | `#0071e3`                | Filled buttons, focus ring                       |
| `--color-accent-hover`  | `#0068d1`                | Filled button hover — **darker**, see note below |
| `--color-link`          | `#0066cc`                | Text links                                       |
| `--color-divider`       | `#d2d2d7`                | Hairline rules, card borders, timeline line      |
| `--color-nav-bg`        | `rgba(255,255,255,0.72)` | Translucent nav background                       |
| `--color-overlay`       | `rgba(0,0,0,0.48)`       | Lightbox and mobile-menu scrim                   |

### Why two blues

`#0071e3` is the accent for filled buttons, where the text is white on blue and contrast is calculated against the blue. `#0066cc` is the colour for text links, where the blue itself is the text and must pass contrast against both band colours.

Checked against WCAG 2.2 AA (4.5:1 for normal text, 3:1 for large text and UI components):

| Foreground | Background | Ratio   | Normal text | Verdict                                  |
| ---------- | ---------- | ------- | ----------- | ---------------------------------------- |
| `#1d1d1f`  | `#ffffff`  | 16.83:1 | pass        | Primary text                             |
| `#1d1d1f`  | `#f5f5f7`  | 15.46:1 | pass        | Primary text on grey bands               |
| `#6e6e73`  | `#ffffff`  | 5.07:1  | pass        | Body copy                                |
| `#6e6e73`  | `#f5f5f7`  | 4.66:1  | pass        | Body copy on grey bands                  |
| `#86868b`  | `#ffffff`  | 3.62:1  | **fail**    | Large text only, ≥ 24px or ≥ 19px bold   |
| `#86868b`  | `#f5f5f7`  | 3.33:1  | **fail**    | Large text only                          |
| `#ffffff`  | `#0071e3`  | 4.70:1  | pass        | Filled button label                      |
| `#0071e3`  | `#ffffff`  | 4.70:1  | pass        | Accent text on white                     |
| `#0071e3`  | `#f5f5f7`  | 4.31:1  | **fail**    | Do not use for body-size text on grey    |
| `#ffffff`  | `#0068d1`  | 5.38:1  | pass        | Filled button label, hover               |
| `#ffffff`  | `#0077ed`  | 4.32:1  | **fail**    | Apple's hover blue — rejected, see below |
| `#0066cc`  | `#ffffff`  | 5.57:1  | pass        | Text links                               |
| `#0066cc`  | `#f5f5f7`  | 5.11:1  | pass        | Text links on grey bands                 |

Ratios computed with the WCAG 2.x relative-luminance formula; the script used is in [docs/07-test-plan.md](07-test-plan.md) so any new colour can be checked the same way.

Three rules follow, and they are enforced in review:

1. **`--color-ink-tertiary` is never used below 24px** (or below 19px at weight 600). It is for the eyebrow and large labels only. If a small caption needs to be quiet, use `--color-ink-secondary`.
2. **`--color-accent` is never used as text on a grey band.** Use `--color-link`. This is exactly the trap of specifying one accent colour and assuming it works everywhere.
3. **The button hover goes darker, not lighter.** apple.com's hover blue is `#0077ed`, which is _lighter_ than `#0071e3` and drops white-on-blue to 4.32:1 — below the 4.5:1 threshold for normal text. Apple can absorb that; a portfolio claiming AA conformance cannot. `--color-accent-hover` is therefore `#0068d1` (5.38:1), which also gives a more conventional "pressed/engaged" direction. This is the first deliberate divergence from apple.com's own CSS, and it is a case where the HIG's accessibility guidance and apple.com's marketing CSS disagree.

### A note on the divider colour

`#d2d2d7` on white is 1.51:1, far below the 3:1 that WCAG 1.4.11 requires of user-interface components. That is acceptable **only** because every divider and card border in this design is decorative: no information is conveyed by the line alone, and no control is identifiable solely by its border. The moment a bordered input, a bordered-only button, or a border that signals state is introduced, that border needs a colour at 3:1 or better against its background. There are no form inputs in v1, so the question does not arise — but it is written down so it is not forgotten when a form is eventually added.

### Semantic aliases

Components reference the semantic name, never the raw palette entry. This is what makes a dark theme a token swap rather than a rewrite later.

```
--color-text-primary    → --color-ink
--color-text-secondary  → --color-ink-secondary
--color-text-tertiary   → --color-ink-tertiary
--color-surface         → --color-canvas
--color-surface-sunken  → --color-section
--color-surface-raised  → --color-card
--color-border-subtle   → --color-divider
--color-focus           → --color-accent
```

In markup that means `text-text-primary`, `text-text-secondary`, `bg-surface`, `bg-surface-sunken`, `bg-surface-raised`, `border-border-subtle` and `outline-focus`, never `text-ink` or `bg-section`. The doubled `text-text-` prefix is the cost of keeping the alias names readable as custom properties; it is accepted rather than renamed.

Six palette colours have no alias, because each has exactly one role and the palette name already says what it is for. Components use these directly: `--color-accent` and `--color-accent-hover` (filled buttons), `--color-link` (text links), `--color-nav-bg` and `--color-nav-bg-fallback` (the nav material), and `--color-overlay` (the scrim). A dark theme would reassign them along with the rest.

---

## 2. Typography

### Font stack

```css
--font-sans:
  -apple-system, BlinkMacSystemFont, var(--font-inter), system-ui, "Segoe UI",
  Roboto, Helvetica, Arial, sans-serif;
--font-mono:
  ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

One stack, used for everything. On Apple hardware it resolves to genuine SF Pro through the system. Everywhere else it resolves to Inter, self-hosted. **No SF Pro file is ever served from this site** — see [ADR-0003](adr/ADR-0003-typography-and-sf-pro-licensing.md) for the licensing reason.

`--font-inter` is defined by Astro's Fonts API, not by hand: it expands to the hashed Inter family plus a metric-matched local fallback, so the swap from fallback to Inter on first visit does not shift layout. Configuration is in [ADR-0003](adr/ADR-0003-typography-and-sf-pro-licensing.md) § Decision.

**Inter's cost.** One file: the latin variable subset from `@fontsource-variable/inter` 5.3.0, **48,256 bytes (47.1 KB) woff2**, covering every weight. Only non-Apple visitors download it, once.

**The order of the first four families is load-bearing.** Three rules follow from it:

1. **Inter must come before `system-ui`.** On Windows `system-ui` _is_ Segoe UI and on Android it _is_ Roboto, so anything after it is unreachable. (The first draft of this doc put `system-ui` first, which would have made Inter dead code.)
2. **Apple visitors never download Inter.** Browsers fetch a web font only when it is actually needed to render a character. On macOS and iOS, `-apple-system` (Safari, Firefox) or `BlinkMacSystemFont` (Chrome) matches first and covers every glyph, so the Inter request is never made. No JavaScript is involved.
3. **Inter is never preloaded.** A `<link rel="preload">` forces the download for every visitor, which would charge Apple visitors for a font they never render and undo rule 2. The `<Font />` component is used without its `preload` prop.

**Tracking on Inter.** The letter-spacing values below are tuned to SF. Inter is close but not identical, so typography gets a visual check on a non-Apple platform before release ([docs/07-test-plan.md](07-test-plan.md) §9). Note that CI screenshots come from Linux, where all three engines render Inter — CI never shows SF, so SF rendering is checked by hand on a Mac and an iPhone.

**Why `"SF Pro Display"` is deliberately _not_ named in the stack.** SF has an optical-size threshold at 20pt: below it the system uses SF Pro Text, which has looser tracking tuned for body copy, and at or above it SF Pro Display, which is tighter and tuned for headings. `-apple-system` and `system-ui` select the correct optical variant automatically based on the rendered size. Naming `"SF Pro Display"` explicitly in a single shared stack would force display metrics onto 14px captions and 17px body text, which is precisely the mistake the threshold exists to prevent. Let the system choose.

### Sizes are declared in `rem`, not `px`

apple.com sets its type in `px`. We do not, and this is the second deliberate divergence.

A `px` font size ignores the reader's browser font-size preference entirely. Someone who has set their default text size to 20px because 16px is uncomfortable gets no benefit from a site built in `px` — the text stays at whatever the stylesheet says. Browser _zoom_ still works, but zoom and default-font-size are two different settings, and a reader who uses the latter is simply failed. On the web, honouring that preference is the closest equivalent to the HIG's Dynamic Type, which the guidelines treat as a hard requirement rather than a nicety.

So every size below is written as its `px` intent with the `rem` value that implements it, against a 16px root. The root `font-size` is never overridden.

| px  | rem    |
| --- | ------ |
| 12  | 0.75   |
| 14  | 0.875  |
| 17  | 1.0625 |
| 19  | 1.1875 |
| 21  | 1.3125 |
| 24  | 1.5    |
| 28  | 1.75   |
| 32  | 2      |
| 40  | 2.5    |
| 48  | 3      |
| 56  | 3.5    |

Line heights stay unitless, which is correct — a unitless line height multiplies the element's own font size and inherits proportionally. Letter-spacing stays in `em` so it scales with the text. Spacing, radius and layout values stay in `px`, because a 28px corner radius should not grow when someone enlarges their text; only type scales.

### Type scale

Three columns because apple.com restyles type at each breakpoint rather than merely reflowing it. Every row is `size / line-height / weight / letter-spacing`, sizes shown in px for readability and implemented in rem per the table above.

| Token                  | > 1068px                     | ≤ 1068px                        | ≤ 734px                      |
| ---------------------- | ---------------------------- | ------------------------------- | ---------------------------- |
| `--text-hero`          | 56 / 1.0714 / 600 / −0.005em | 48 / 1.0833 / 600 / −0.003em    | 40 / 1.1 / 600 / 0           |
| `--text-title` (h1)    | 48 / 1.0833 / 600 / −0.003em | 40 / 1.1 / 600 / 0              | 32 / 1.125 / 600 / 0.004em   |
| `--text-headline` (h2) | 40 / 1.1 / 600 / 0           | 32 / 1.125 / 600 / 0.004em      | 28 / 1.1428 / 600 / 0.007em  |
| `--text-subhead` (h3)  | 28 / 1.1428 / 600 / 0.007em  | **24 / 1.1667 / 600 / 0.009em** | 21 / 1.1905 / 600 / 0.011em  |
| `--text-card-title`    | 24 / 1.1667 / 600 / 0.009em  | 21 / 1.1905 / 600 / 0.011em     | 19 / 1.2105 / 600 / 0.012em  |
| `--text-body-lg`       | 21 / 1.381 / 400 / 0.011em   | 19 / 1.4211 / 400 / 0.012em     | 17 / 1.4706 / 400 / −0.022em |
| `--text-body`          | 17 / 1.4706 / 400 / −0.022em | 17 / 1.4706 / 400 / −0.022em    | 17 / 1.4706 / 400 / −0.022em |
| `--text-body-sm`       | 14 / 1.4286 / 400 / −0.016em | 14 / 1.4286 / 400 / −0.016em    | 14 / 1.4286 / 400 / −0.016em |
| `--text-caption`       | 12 / 1.3334 / 400 / −0.01em  | 12 / 1.3334 / 400 / −0.01em     | 12 / 1.3334 / 400 / −0.01em  |
| `--text-eyebrow`       | 19 / 1.2105 / 600 / 0.012em  | 17 / 1.2353 / 600 / 0.012em     | 17 / 1.2353 / 600 / 0.012em  |

The bolded cell is the exact rule from the brief (`.CopyLockup_header` at `max-width: 1068px`): 24px, line-height 1.1666666667, weight 600, letter-spacing .009em. It lands on `--text-subhead` at the 1068px breakpoint, which means that style is now a token used everywhere that size of heading appears, rather than a one-off.

### How the letter-spacing works

The pattern in the scale is not arbitrary: large display sizes get **negative** tracking (tightened, because at 48px the default gaps look loose), and smaller text gets **positive** tracking (opened up, because at 14px the glyphs need air). Body copy at 17px is the exception at −0.022em, which matches how apple.com sets its body text. Keep the pattern when adding a size; a new 36px heading sits between −0.003em and 0.

### Body copy rules

- Measure: `max-width: 68ch` on prose blocks. Long lines are the single most common readability failure on a wide screen.
- Never set `font-size` below 12px anywhere, including captions and tag chips.
- Text never uses `text-align: justify`.
- Headings use `text-wrap: balance`; single-line subheads use `text-wrap: pretty`.

### Never scale type with `vw`

A `clamp()` on `vw` means a user who zooms gets nothing, because the viewport width has not changed. The site is tested at 200% zoom as part of the AA requirement, and `vw`-based type fails that test. Breakpoint-based sizes, as above.

---

## 3. Spacing

Base unit 4px. The scale is the subset actually needed; adding an entry requires a reason.

| Token        | Value | Typical use                              |
| ------------ | ----- | ---------------------------------------- |
| `--space-1`  | 4px   | Icon-to-label gap                        |
| `--space-2`  | 8px   | Tag chip padding, tight stacks           |
| `--space-3`  | 12px  | Inside small components                  |
| `--space-4`  | 16px  | Default gap in a stack                   |
| `--space-5`  | 20px  | —                                        |
| `--space-6`  | 24px  | Card inner padding, mobile               |
| `--space-8`  | 32px  | Card inner padding, desktop; grid gutter |
| `--space-10` | 40px  | Heading to content                       |
| `--space-12` | 48px  | Sub-section spacing                      |
| `--space-16` | 64px  | Section padding, mobile                  |
| `--space-20` | 80px  | Section padding, tablet                  |
| `--space-25` | 100px | Section padding, desktop                 |
| `--space-32` | 128px | Hero padding, desktop                    |

### Section vertical rhythm

| Viewport   | Section padding (top and bottom) | Hero padding |
| ---------- | -------------------------------- | ------------ |
| > 1068px   | 100px                            | 128px        |
| 735–1068px | 80px                             | 96px         |
| ≤ 734px    | 64px                             | 72px         |

Consecutive bands do **not** double their padding at the seam. A `Section` component owns its own vertical padding and two adjacent sections produce 200px of space on desktop, which is correct and is how Apple's slabs breathe. Do not "fix" this by halving it.

### Grid gutters

32px desktop, 24px tablet, 16px mobile.

---

## 4. Layout

### Container widths

Modelled directly on apple.com's content column.

| Viewport   | Max content width | Side gutter |
| ---------- | ----------------- | ----------- |
| > 1068px   | 980px             | 22px        |
| 735–1068px | 692px             | 22px        |
| ≤ 734px    | 100%              | 22px        |

A `--container-wide` of 1280px exists for the project gallery and the hero image, which are allowed to exceed the text column.

### Breakpoints

```css
--breakpoint-sm: 480px; /* small phone adjustments */
--breakpoint-md: 735px; /* tablet: apple.com's lower breakpoint + 1 */
--breakpoint-lg: 1069px; /* desktop: apple.com's 1068px breakpoint + 1 */
--breakpoint-xl: 1441px; /* large desktop */
```

Tailwind's breakpoints are `min-width`, while the brief's CSS is `max-width: 1068px`. These describe the same boundary from opposite sides: `max-width: 1068px` is the complement of `min-width: 1069px`. The implementation is mobile-first, so styles are written for small screens and `lg:` adds the desktop treatment. The one `max-width` query we keep is the `≤734px` mobile menu, where expressing it as a max-width reads more clearly.

### Z-index

A named ladder, so no component invents `z-index: 9999`.

| Token           | Value | Layer                                           |
| --------------- | ----- | ----------------------------------------------- |
| `--z-base`      | 0     | Page content                                    |
| `--z-sticky`    | 100   | Sticky nav                                      |
| `--z-menu`      | 200   | Mobile menu panel                               |
| `--z-overlay`   | 300   | Scrim                                           |
| `--z-lightbox`  | 400   | Lightbox                                        |
| `--z-skip-link` | 500   | Skip-to-content link, must sit above everything |

---

## 5. Radius

| Token           | Value | Applies to                                                                                             |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------ |
| `--radius-card` | 28px  | Cards, hero images, gallery items, as specified                                                        |
| `--radius-md`   | 18px  | Elements nested inside a card, so they do not fight the 28px parent                                    |
| `--radius-sm`   | 12px  | Thumbnails, code blocks                                                                                |
| `--radius-xs`   | 8px   | Tag chips                                                                                              |
| `--radius-pill` | 980px | Buttons. The large value guarantees a full semicircle at any height, which is the trick apple.com uses |

**Nesting rule:** a child's radius should be roughly the parent's radius minus the padding between them. A 28px card with 24px padding wants an inner radius near 12–18px, not another 28px. Concentric radii are what make the corners look drawn rather than defaulted.

---

## 6. Elevation

Apple leans on the white-card-on-grey-band contrast rather than drop shadows, so shadows here are restrained and exist mainly as hover feedback.

| Token                 | Value                          | Use                                         |
| --------------------- | ------------------------------ | ------------------------------------------- |
| `--shadow-none`       | `none`                         | Default card state on a grey band           |
| `--shadow-card-hover` | `0 4px 24px rgba(0,0,0,0.08)`  | Card hover and focus-visible                |
| `--shadow-nav`        | `0 1px 0 rgba(0,0,0,0.06)`     | Hairline under the sticky nav once scrolled |
| `--shadow-lightbox`   | `0 24px 64px rgba(0,0,0,0.24)` | Lightbox panel                              |

Cards on a **white** band get a `1px` `--color-divider` border instead of a shadow, since a white card on a white background has nothing to separate it otherwise.

---

## 7. Materials

The nav uses a translucent blurred background, which is the web analogue of the HIG's material layers.

```css
--blur-nav: saturate(180%) blur(20px);
--color-nav-bg: rgba(255, 255, 255, 0.72);
--color-nav-bg-fallback: rgba(255, 255, 255, 0.96);
```

Applied with the prefix first, which is not optional:

```css
.nav {
  background-color: var(--color-nav-bg);
  -webkit-backdrop-filter: var(--blur-nav); /* Safari requires the prefix */
  backdrop-filter: var(--blur-nav);
}

@supports not (
  (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))
) {
  .nav {
    background-color: var(--color-nav-bg-fallback);
  }
}
```

**`-webkit-backdrop-filter` must be present.** Safari still needs the prefixed property, and omitting it breaks the effect on exactly the devices this design is aimed at — the unprefixed-only version degrades to a flat 72%-opaque white on iOS, with content sliding visibly behind the text.

`backdrop-filter` is otherwise well supported but not universal, and it is disabled by some privacy configurations, hence the `@supports` fallback to a near-opaque white. Text contrast is checked against the **fallback** colour, not the translucent one, because that is the worst case.

Per the HIG, material goes on the **control layer** only — the nav and the lightbox chrome. Content never sits on a blurred surface, because the blur competes with it. In practice that means: no frosted-glass project cards, no translucent text boxes. This is the most commonly broken HIG rule in Apple-inspired web design, and it collapses the layer hierarchy that makes the nav read as floating above the page.

A heavy blur is also expensive to composite on older phones. 20px is modest; if scroll performance on a real device suffers, reduce the radius rather than adding more layers.

### Safe-area insets

On a notched or Dynamic Island iPhone, and in a home-screen web app, the viewport extends under the system UI. The sticky nav and the full-screen mobile menu both need insets:

```css
--inset-top: env(safe-area-inset-top, 0px);
--inset-bottom: env(safe-area-inset-bottom, 0px);
```

`--blur-nav` and the two insets are declared on `:root` in the base layer rather than in `@theme`. Their names fall in Tailwind namespaces that expect other kinds of value (`--blur-*` is a single length, `--inset-*` feeds the `inset` utilities), so inside `@theme` they would generate broken utilities.

The nav adds `--inset-top` to its top padding; the mobile menu panel pads both top and bottom; the footer adds `--inset-bottom`. This requires `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` — without `viewport-fit=cover` the `env()` values are all zero and the insets silently do nothing.

### Icons

**No SF Symbols.** Apple's licence permits their use only in software running natively on Apple operating systems, built with Xcode; they may not be extracted, served as a web font, or inlined as SVG on a public site. That applies to this portfolio.

Where an icon is genuinely needed (the menu glyph, the close glyph, the chevron, the social marks), use an open-source set with comparable stroke character — Lucide or Phosphor are the closest matches — or hand-draw the two or three glyphs this site needs. Do not mix sets: inconsistent stroke weights are visible immediately. Every decorative icon carries `aria-hidden="true"` and every icon-only control carries a visually hidden text label.

---

## 8. Motion tokens

Values and rationale in [docs/04-motion.md](04-motion.md). Listed here because they are tokens.

| Token                | Value                               |
| -------------------- | ----------------------------------- |
| `--duration-instant` | 100ms                               |
| `--duration-fast`    | 200ms                               |
| `--duration-base`    | 300ms                               |
| `--duration-menu`    | 400ms                               |
| `--duration-reveal`  | 600ms                               |
| `--ease-out`         | `cubic-bezier(0.16, 1, 0.3, 1)`     |
| `--ease-in-out`      | `cubic-bezier(0.4, 0, 0.2, 1)`      |
| `--ease-nav`         | `cubic-bezier(0.32, 0.08, 0.24, 1)` |
| `--reveal-distance`  | 24px                                |
| `--reveal-stagger`   | 80ms                                |

---

## 9. Sizing

| Token                 | Value | Use                                               |
| --------------------- | ----- | ------------------------------------------------- |
| `--size-nav-height`   | 44px  | Nav bar height; also the HIG minimum touch target |
| `--size-touch-min`    | 44px  | Minimum hit area on every interactive element     |
| `--size-focus-ring`   | 2px   | Focus outline width                               |
| `--size-focus-offset` | 2px   | Focus outline offset                              |
| `--size-hairline`     | 1px   | Dividers                                          |

The 44px nav height is not a coincidence: it is the HIG's minimum comfortable touch target, and apple.com's global nav is the same height. Where a link's text is shorter than 44px tall, padding brings the hit area up to 44px even though the visible text is smaller.

---

## 10. The `@theme` block

This is the implementation target. `src/styles/global.css` begins:

```css
@import "tailwindcss";

@theme {
  /* ---- colour ---- */
  --color-canvas: #ffffff;
  --color-section: #f5f5f7;
  --color-card: #ffffff;
  --color-ink: #1d1d1f;
  --color-ink-secondary: #6e6e73;
  --color-ink-tertiary: #86868b;
  --color-accent: #0071e3;
  --color-accent-hover: #0068d1;
  --color-link: #0066cc;
  --color-divider: #d2d2d7;
  --color-overlay: rgb(0 0 0 / 0.48);

  /* ---- type ---- */
  /* --font-inter is injected by Astro's <Font /> component — see §2 */
  --font-sans:
    -apple-system, BlinkMacSystemFont, var(--font-inter), system-ui, "Segoe UI",
    Roboto, Helvetica, Arial, sans-serif;
  --font-mono:
    ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  /* mobile-first values; breakpoint overrides live in the base layer */
  --text-hero: 2.5rem; /* 40px */
  --text-hero--line-height: 1.1;
  --text-hero--font-weight: 600;
  --text-hero--letter-spacing: 0em;

  --text-body: 1.0625rem; /* 17px */
  --text-body--line-height: 1.4706;
  --text-body--font-weight: 400;
  --text-body--letter-spacing: -0.022em;

  /* …remaining sizes per the scale table above… */

  /* ---- radius ---- */
  --radius-card: 28px;
  --radius-md: 18px;
  --radius-sm: 12px;
  --radius-xs: 8px;
  --radius-pill: 980px;

  /* ---- breakpoints ---- */
  --breakpoint-sm: 480px;
  --breakpoint-md: 735px;
  --breakpoint-lg: 1069px;
  --breakpoint-xl: 1441px;

  /* ---- containers ---- */
  --container-content: 980px;
  --container-content-md: 692px;
  --container-wide: 1280px;

  /* ---- motion ---- */
  --duration-fast: 200ms;
  --duration-base: 300ms;
  --duration-menu: 400ms;
  --duration-reveal: 600ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-nav: cubic-bezier(0.32, 0.08, 0.24, 1);

  /* ---- shadow ---- */
  --shadow-card-hover: 0 4px 24px rgb(0 0 0 / 0.08);
  --shadow-nav: 0 1px 0 rgb(0 0 0 / 0.06);
  --shadow-lightbox: 0 24px 64px rgb(0 0 0 / 0.24);
}
```

Tailwind v4 turns a `--text-*` entry plus its `--line-height`, `--font-weight` and `--letter-spacing` modifiers into a single utility, so `class="text-hero"` applies all four properties at once. That is why the type scale is expressed this way rather than as four separate utilities per size — it makes the correct pairing the easy one and a mismatched pairing impossible by accident.

Responsive type sizes are applied in the base layer with media queries that reassign the same custom properties, so `text-hero` keeps working and no component carries `lg:text-[56px]`. The queries are written as `@variant md { … }` and `@variant lg { … }`, so they read their widths from the breakpoint tokens rather than repeating `735px` and `1069px`.

### How the tokens map onto Tailwind

The implementation adds four things the block above does not show. None of them is a new value; each exposes a documented token, or stops Tailwind from exposing something undocumented.

- **`@theme static`.** Every token is emitted as a custom property on `:root` whether or not a utility uses it, so all of them can be inspected in devtools and used in `var()`.
- **Defaults are cleared** in each namespace the design owns: `--color-*`, `--font-*`, `--text-*`, `--font-weight-*`, `--tracking-*`, `--leading-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--breakpoint-*`, `--container-*` and `--ease-*` are each set to `initial` first. So `text-sm`, `rounded-lg`, `p-7`, `font-bold` and `tracking-tight` do not exist, and a type token's line height, weight or tracking cannot be overridden on its own.
- **Spacing, z-index and duration aliases.** Tailwind reads spacing from `--spacing-*`, z-index from `--z-index-*` and durations from `--transition-duration-*`, so each documented token gets a one-line alias: `--spacing-4: var(--space-4)`, `--z-index-sticky: var(--z-sticky)`, `--transition-duration-fast: var(--duration-fast)`. That gives `p-4`, `z-sticky` and `duration-fast`, and only for steps on the scale.
- **Transition defaults.** `--default-transition-duration` is `var(--duration-fast)` and `--default-transition-timing-function` is `var(--ease-in-out)`, so a bare `transition-colors` uses the hover timing from [docs/04-motion.md](04-motion.md) §5.

`npm run check:tokens` catches what the theme cannot prevent: arbitrary values (`text-[23px]`, `bg-(--x)`), bare durations and z-indexes (`duration-300`, `z-10`), and raw hex, `px` or `ms` in a component's styles.

---

## 11. Token governance

- A new token is added to this doc in the same commit as the CSS.
- Changing an existing token's **value** is an "ask first" change in the spec, because it cascades everywhere.
- Renaming a token requires updating every usage in the same commit; no aliases are kept for compatibility on a project this size.
- Any arbitrary value in a component (`p-[27px]`, `text-[#333]`, `duration-[450ms]`) fails review. The fix is a token, not an exception.
