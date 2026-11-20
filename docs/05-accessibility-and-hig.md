# Accessibility and HIG Adaptation

**Status:** Draft, awaiting approval
**Conformance target:** WCAG 2.2 Level AA

Two separate standards apply to this project and they are not the same thing:

- **WCAG 2.2 AA** is the measurable conformance target. It is testable, and the build either meets it or does not.
- **Apple's Human Interface Guidelines** are the design reference. They were written for native apps, so parts of them translate to the web directly, parts need adaptation, and a few parts do not apply at all.

This document covers both, and is explicit about where they disagree — because they do, in two places, and both are resolved in favour of accessibility.

> Reference material in this section is sourced from Apple's Human Interface Guidelines. HIG audit guidance via the HIG Compliance Auditor knowledge base curated by Omraj Kumar (omrajguru.com/linktree, GitHub @omrajguru05, X @omrajguru_). The design principles described are Apple's, not this project's.

---

## Part 1 — HIG adaptation

### 1.1 The six core principles, applied to this site

| Principle | HIG intent | How it lands here |
|---|---|---|
| **Clarity** | Legible, precise, immediately comprehensible; every element has one explicit purpose | One primary CTA per view. 17px minimum body text. The hero states what Darya does in one sentence. No element requires explanation |
| **Deference** | The UI supports content; chrome recedes | No heavy borders, no saturated panels, no decorative illustration. The nav is 44px and translucent. The content is the project work |
| **Depth** | Convey spatial relationships through layers | White cards on grey bands; nav floating above content via material; lightbox in the top layer with a scrim. Z-order is a named token ladder, not ad-hoc values |
| **Hierarchy** | The eye knows where to look first | The type scale spans 12px to 56px with real jumps between steps. Eyebrow → headline → body is one repeated pattern. The primary action is a filled pill; everything else is quieter |
| **Harmony** | Software geometry echoes hardware geometry | The 28px card radius and 980px pill radius echo Apple hardware corners. Concentric radii on nested elements |
| **Consistency** | Use established patterns; don't break interaction conventions | Standard link and button behaviour, no custom scrolling, no custom cursor, no hijacked gestures. Safari's swipe-back is never intercepted |

**The audit questions**, which get asked at review of every page:

- Can a visitor complete the primary task without instructions?
- Does any UI element draw more attention than the content?
- Can you identify the primary action within two seconds?
- Do layered elements communicate their Z-position clearly?

### 1.2 Dynamic Type, adapted

The HIG requires that text scale to 200% without truncation, clipping or overlap, and that absolute font sizes never be hardcoded. The web has no Dynamic Type API, so the equivalent is:

1. **All font sizes in `rem`**, so the reader's browser font-size preference is honoured. See [docs/02-design-tokens.md](02-design-tokens.md) §2.
2. **No `vw`-based type and no `clamp()` on viewport units.** Both ignore zoom, because zooming does not change the viewport width in CSS pixels. Breakpoint-based sizes instead.
3. **No fixed heights on anything containing text.** Containers grow. A card with `height: 320px` breaks the moment text scales.
4. **`line-clamp` is used in exactly one place** — the two-line project summary — and the clamp is on a `-webkit-line-clamp` with the container free to grow, so at 200% the card gets taller rather than cutting words off mid-sentence. Everywhere else, text wraps.
5. **Tested at 200% zoom** on every page as a release gate, and additionally with the browser default font size set to 20px.

The HIG's 11pt minimum text size maps to our 12px caption floor, which is the smallest size used anywhere.

### 1.3 Materials, adapted

Per the HIG, translucent material belongs on the **control layer only**: navigation bars, toolbars, sidebars, tab bars. Never on content cards, text boxes or list backgrounds, because it collapses the layer hierarchy.

On this site that means exactly two surfaces use material: the sticky nav, and the lightbox chrome. Project cards are opaque white. This is stated here because "frosted glass everything" is the single most common way an Apple-inspired web design goes wrong.

Implementation notes (prefix requirement, `@supports` fallback, performance) are in [docs/02-design-tokens.md](02-design-tokens.md) §7.

**Scroll edge transition:** the HIG describes nav bars reacting as content scrolls beneath them — transparent at rest, frosted once content passes under. Ours adds a hairline shadow on scroll, which is the soft iOS-style transition rather than the harder macOS one.

### 1.4 Touch targets

| Requirement | Value | Where enforced |
|---|---|---|
| Absolute minimum | 44 × 44 px | Every link, button, menu item, gallery thumbnail, lightbox control |
| Spacing between adjacent targets | ≥ 8 px | Nav items, social link rows, lightbox prev/next |

Nav link text is 14–17px tall, so padding brings the hit area to 44px. The visible text is small; the target is not. This is checked in the E2E suite by asserting the bounding box of every interactive element.

There are no destructive actions on this site, so the HIG's separation requirement for them does not apply.

### 1.5 Safe areas

The sticky nav, the full-screen mobile menu and the footer respect `env(safe-area-inset-*)`, and the viewport meta includes `viewport-fit=cover` without which those values are zero. Covered in [docs/02-design-tokens.md](02-design-tokens.md) §7.

### 1.6 What the HIG asks for that this project deliberately does not do

| HIG expectation | Why it does not apply |
|---|---|
| Semantic system colours (`label`, `systemBackground`) | A web page has no access to them. We approximate with a semantic token layer that maps to fixed values, which is what makes a dark theme a token swap later |
| Dark Mode with a dual-tier background system | Out of scope for v1 by decision. The token structure is built for it: adding a theme means reassigning `--color-*` under `prefers-color-scheme: dark`, not rewriting components |
| SF Symbols | Not licensed for web use. Alternatives in [docs/02-design-tokens.md](02-design-tokens.md) §7 |
| Tab bars, sheets, popovers, platform navigation patterns | Native app components. A five-page static site uses links |
| Liquid Glass as a full four-layer material | We use the translucent base + blur + hairline. The heavier edge highlight and large elevation shadow would fight the "deference" principle on a page this quiet |
| PWA `display: standalone`, manifest, apple-touch-icon | A portfolio is not an app someone installs to their home screen. A favicon and an `apple-touch-icon` ship; a manifest and standalone display do not |

### 1.7 Where the HIG and WCAG disagree

Both resolved in favour of WCAG, and both already recorded in the token doc:

1. **Button hover colour.** apple.com's hover blue `#0077ed` is lighter than the base and yields 4.32:1 with white text — below AA for normal text. We use `#0068d1` (5.38:1) and hover darker instead of lighter.
2. **Font size units.** apple.com uses `px`. We use `rem`, because `px` defeats the reader's font-size preference and the HIG's own Dynamic Type requirement is the stronger instruction.

---

## Part 2 — WCAG 2.2 AA requirements

Organised by principle, listing only the criteria that this site can actually violate. A criterion that cannot apply (there is no audio, video, form validation or time limit anywhere) is omitted rather than padded.

### 2.1 Perceivable

| SC | Level | Requirement | How it is met |
|---|---|---|---|
| 1.1.1 Non-text Content | A | All images have text alternatives | Content images get descriptive `alt`; decorative images get `alt=""`; icons get `aria-hidden="true"` with a visually hidden label on the control |
| 1.3.1 Info and Relationships | A | Structure conveyed programmatically | Real headings, real lists, `<ol>` for the timeline, `<time>` for dates, `<nav>` per navigation region |
| 1.3.2 Meaningful Sequence | A | Reading order matches visual order | Single-column DOM order; no CSS reordering that changes meaning. The timeline is a single column at every breakpoint, specifically so order never diverges |
| 1.3.4 Orientation | AA | Works in both orientations | No orientation lock; layouts reflow |
| 1.3.5 Identify Input Purpose | AA | Autocomplete on inputs | No form inputs in v1 |
| 1.4.1 Use of Color | A | Colour is not the only signal | Links inside prose are underlined at rest. The current nav item carries `aria-current="page"` and a weight change, not just colour |
| 1.4.3 Contrast (Minimum) | AA | 4.5:1 text, 3:1 large text | Full ratio table in [docs/02-design-tokens.md](02-design-tokens.md) §1, with two colours restricted to large text only |
| 1.4.4 Resize Text | AA | 200% without loss | `rem` sizing, no fixed heights, tested at 200% |
| 1.4.5 Images of Text | AA | Use real text | No text baked into images anywhere |
| 1.4.10 Reflow | AA | No horizontal scroll at 320px width / 400% zoom | Mobile-first; tested at 320px. The gallery grid wraps rather than scrolling horizontally |
| 1.4.11 Non-text Contrast | AA | 3:1 for UI components and focus indicators | Focus ring `#0071e3` is 4.70:1 on white and 4.31:1 on `#f5f5f7`. Dividers are decorative only — see the note in the token doc |
| 1.4.12 Text Spacing | AA | No loss when spacing is overridden | No fixed-height text containers; tested with the text-spacing bookmarklet |
| 1.4.13 Content on Hover or Focus | AA | Hover content is dismissible, hoverable, persistent | Nothing on this site appears on hover alone |

### 2.2 Operable

| SC | Level | Requirement | How it is met |
|---|---|---|---|
| 2.1.1 Keyboard | A | All functionality by keyboard | Menu, lightbox, gallery, every link and button. Verified in the E2E suite |
| 2.1.2 No Keyboard Trap | A | Focus can always leave | The mobile menu and lightbox trap focus *while open by design*, and both close on `Escape` returning focus to the trigger. That is the permitted pattern; a trap with no exit is not |
| 2.1.4 Character Key Shortcuts | A | Single-key shortcuts can be disabled | The only key handlers are `Escape` and arrows inside an open dialog, which is a modal context and therefore exempt |
| 2.4.1 Bypass Blocks | A | Skip repeated content | Skip link to `#main`, first in the tab order |
| 2.4.2 Page Titled | A | Descriptive title | `Page — Darya` per page, unique |
| 2.4.3 Focus Order | A | Logical order | DOM order is reading order. Focus moves into the menu on open and back to the trigger on close |
| 2.4.4 Link Purpose (In Context) | A | Link text makes sense | `View projects`, `View live site`, project titles. No `Click here`, no bare `Read more` repeated six times |
| 2.4.5 Multiple Ways | AA | More than one route to a page | Global nav plus footer nav plus in-page cross-links |
| 2.4.6 Headings and Labels | AA | Descriptive | One `h1` per page, no skipped levels, no heading chosen for its size |
| 2.4.7 Focus Visible | AA | Visible focus indicator | 2px accent ring at 2px offset on every focusable element. `:focus-visible`, never `outline: none` |
| **2.4.11 Focus Not Obscured (Minimum)** | **AA (new in 2.2)** | Focused element is not entirely hidden by other content | **This is the one the sticky nav threatens.** A 44px sticky header will cover a focused element that the browser scrolls to the very top of the viewport. Mitigated with `scroll-margin-top: calc(var(--size-nav-height) + var(--space-4))` on every focusable element and heading. Explicitly tested |
| 2.5.1 Pointer Gestures | A | Multipoint/path gestures have a single-pointer alternative | Lightbox swipe is additive; prev/next buttons do the same job |
| 2.5.2 Pointer Cancellation | A | Action fires on up-event | Default button behaviour; no `mousedown` handlers |
| 2.5.3 Label in Name | A | Visible label is in the accessible name | Icon buttons' hidden labels match their purpose; no mismatch between visible text and `aria-label` |
| 2.5.4 Motion Actuation | A | No device-motion-only actions | None |
| **2.5.7 Dragging Movements** | **AA (new in 2.2)** | Dragging has a single-pointer alternative | No drag interactions exist. Noted so none is added casually |
| **2.5.8 Target Size (Minimum)** | **AA (new in 2.2)** | 24 × 24 px minimum | Exceeded everywhere: the HIG's 44px is the project standard |

### 2.3 Understandable

| SC | Level | Requirement | How it is met |
|---|---|---|---|
| 3.1.1 Language of Page | A | `lang` attribute | `<html lang="en">` |
| 3.1.2 Language of Parts | AA | Mark language changes | Any non-English phrase gets its own `lang` |
| 3.2.1 On Focus | A | Focus does not change context | Nothing opens or navigates on focus |
| 3.2.2 On Input | A | Input does not change context | No inputs |
| 3.2.3 Consistent Navigation | AA | Nav in the same relative order | Same `Nav` component on every page |
| 3.2.4 Consistent Identification | AA | Same function, same label | One `Button` component; `View live site` means the same thing on every project page |
| 3.3.1 / 3.3.2 Error handling | A | Identify and label errors | No forms |
| **3.3.7 Redundant Entry** | **A (new in 2.2)** | Don't ask twice for the same info | No forms |
| **3.3.8 Accessible Authentication** | **AA (new in 2.2)** | No cognitive-function test | No authentication |

### 2.4 Robust

| SC | Level | Requirement | How it is met |
|---|---|---|---|
| 4.1.2 Name, Role, Value | A | Correct semantics for controls | Native elements throughout. `aria-expanded` on the menu trigger, `aria-current` on the active nav link. ARIA is used to annotate native elements, never to simulate them |
| 4.1.3 Status Messages | AA | Status changes announced | The lightbox's `Image 3 of 6` live region, `aria-live="polite"` |

**On Astro 7's stricter parser:** the Rust compiler now errors on unclosed tags instead of silently repairing them. The old 4.1.1 Parsing criterion was removed in WCAG 2.2, but valid markup still matters because assistive technology behaviour on malformed HTML is unpredictable. Getting this enforced at build time is a free win.

---

## Part 3 — Verification

### Automated

`npm run test:a11y` runs axe-core via Playwright against every page type at desktop and mobile widths, and against the mobile menu and lightbox in their *open* states — a scan of a page with a closed menu tests nothing about the menu.

Automated tools catch roughly a third of real issues. They will not catch a wrong heading level that is technically valid, an alt text that describes the wrong thing, a focus order that is legal but illogical, or a focus ring hidden behind the sticky nav. Hence the manual pass.

### Manual passes, each a release gate

**Keyboard only.** Unplug the mouse. From the top of each page: `Tab` through every element in order, confirm the ring is always visible and never clipped by the nav, open and close the mobile menu with `Enter` and `Escape`, open the lightbox, navigate it with arrows, close it with `Escape`, and confirm focus returns to the thumbnail that opened it.

**Screen reader.** VoiceOver on macOS with Safari, and VoiceOver on iOS. Check: the heading outline (`VO + U`) reads as a sensible table of contents; the links list contains no duplicate or meaningless entries; images are described usefully or skipped; the timeline reads as an ordered list of roles; the lightbox announces its image count.

**Reduced motion.** Enable the OS setting, reload, scroll every page: nothing moves, and all content is visible. Confirm hover and focus colour feedback still works — reduced motion removes movement, not state indication.

**Zoom and text size.** 200% browser zoom on every page, then 400% at a 1280px window (the Reflow criterion), then the browser default font size raised to 20px. No horizontal scrolling, no clipped text, no overlap.

**Real device.** Safari on a physical iPhone, which is the only reliable way to catch safe-area problems, `backdrop-filter` performance, momentum-scroll jank, and the 100vh viewport issue.

### The accessibility statement

Honest conformance claims require evidence. Once the manual passes are complete, record the date, the tools and versions used, the assistive technology tested, and any known exceptions in `docs/accessibility-report.md`. "WCAG 2.2 AA" asserted without a test record is marketing, not a conformance claim.
