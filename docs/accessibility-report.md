# Accessibility Report

**Standard:** WCAG 2.2 Level AA
**Date of this pass:** 2026-11-23, including the Apple device passes
**Scope:** every public page of the site (Home, Projects, all six project pages, Skills, Experience, Contact) and the 404, at every width in the test matrix, plus the mobile menu open and the lightbox open
**Status:** automated, browser-based and Apple device passes complete and passing (see [Device passes](#device-passes)). An optional look on a non-Apple device is still open.

This report records what was checked, how, what was found and fixed, and the exceptions. It is a record of a point in time: any change to markup, tokens or behaviour after this date needs the relevant checks run again. The continuous checks below run on every pull request, so they stay current; the manual sections do not.

---

## 1. Tools and versions

| Tool                                 | Version                           | Used for                                                                         |
| ------------------------------------ | --------------------------------- | -------------------------------------------------------------------------------- |
| axe-core, via `@axe-core/playwright` | 4.14.1                            | Automated WCAG scan, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` |
| Playwright                           | 1.65.1                            | E2E, keyboard, target-size, reflow and text-spacing checks                       |
| Chromium                             | 159.0.8154.6                      | Playwright engine                                                                |
| WebKit                               | 27.2                              | Playwright engine, the closest available proxy for Safari                        |
| Firefox                              | 159.0                             | Playwright engine, CI only (it cannot launch on the Windows development machine) |
| Lighthouse CI                        | `treosh/lighthouse-ci-action` v12 | Accessibility category and performance budgets, mobile profile                   |
| Node.js                              | 22 (CI)                           | Build and test runtime                                                           |

CI runs on Ubuntu, where no engine has SF Pro, so every automated check renders in Inter. The browser-based passes in §3 were made in Chromium on Windows 11, also in Inter.

---

## 2. Automated checks

All run in CI on every pull request and every push to `main`.

| Check                                                                                                               | Where                                                              | Result                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| axe scan, every page, at every width in the seven-project matrix, plus the 404, the menu open and the lightbox open | `tests/e2e/a11y.spec.ts`                                           | **0 violations.** Zero is the gate, not zero serious                                                          |
| Lighthouse accessibility score, seven representative pages, median of three runs                                    | `lighthouse` CI job                                                | **100** on every page                                                                                         |
| Target size: every link and button at least 44 × 44px, neighbours at least 8px apart (WCAG 2.5.8, HIG 44pt)         | `tests/e2e/targets.spec.ts`                                        | Pass. Links inside sentences are exempt as 2.5.8 allows; card title links are measured by the card they cover |
| Keyboard: Tab through every page; every stop shows a 2px ring, none sits under the sticky nav, no trap              | `tests/e2e/keyboard.spec.ts`, Chromium and Firefox, 1280 and 390px | Pass                                                                                                          |
| Reflow and text: 200% and 400% zoom, a 20px default font, the 1.4.12 text-spacing overrides                         | `tests/e2e/resilience.spec.ts`                                     | Pass: no sideways scroll, no clipped text, on every page                                                      |
| No horizontal scroll at any viewport                                                                                | `tests/e2e/responsive.spec.ts`                                     | Pass                                                                                                          |
| Mobile menu: focus trap, Escape, focus return, inert background, scroll lock, resize                                | `tests/e2e/mobile-menu.spec.ts`                                    | Pass                                                                                                          |
| Lightbox: focus to Close, arrows, ends disabled, `Image N of M`, Escape and scrim return focus to the thumbnail     | `tests/e2e/lightbox.spec.ts`                                       | Pass                                                                                                          |
| Reduced motion: every reveal visible without scrolling; nothing moves                                               | `tests/e2e/reveal.spec.ts`, `reduced-motion` project               | Pass                                                                                                          |
| Contrast of every documented colour pair, recomputed from the CSS                                                   | `node scripts/contrast.mjs`                                        | Every row matches the token doc                                                                               |

---

## 3. Browser-based passes

Made with Playwright and the browser pane, and recorded here because a passing test is only as good as what it measures.

### Keyboard-only (roadmap 6.6)

Tabbed through all twelve pages at 1280px and at 390px. Order follows the page: skip link, wordmark, nav, then the content top to bottom, then the footer. Gallery thumbnails announce their alt text; the pager links announce "Previous project" or "Next project" and the neighbour's title. Every stop showed the 2px ring, none was hidden by the 44px sticky nav (`scroll-margin-top` holds, WCAG 2.4.11), and every page could be tabbed through to the end and back to the start. The menu and lightbox were operated with Enter, the arrow keys and Escape; focus returned to the trigger each time.

### Reduced motion (roadmap 6.8)

With `prefers-reduced-motion: reduce`: reveal content is visible from the start, the menu and lightbox open and close instantly, buttons do not scale on press and cards do not lift on hover. Hover and focus **colour** changes remain, as the motion doc requires.

### Zoom, reflow and font size (roadmap 6.9)

200% zoom (a 640px viewport from 1280px), 400% zoom (320px, the 1.4.10 floor) and a 20px default font size, on every page. No clipping, no overlap, no sideways scroll. The 20px case is the one `px` type would fail; the `rem` tokens pass it.

### Text spacing (roadmap 6.10)

The 1.4.12 overrides (line height 1.5, paragraph spacing 2em, letter spacing 0.12em, word spacing 0.16em) on every page at 1280 and 375px, and combined with a 20px default font on the longest project title. All content stays readable; nothing is lost or clipped.

### Non-Apple typography (roadmap 6.12)

Checked on Windows 11 in Chromium and in the Linux renders behind the visual baselines, both in Inter. Headings sit well at their SF-tuned tracking. Body text at 17px and −0.022em is readable and no letters touch, but it is a little tighter than Inter's own recommended tracking at that size (about −0.01em). **Recommendation for Darya, not a failure:** if the body copy reads dense on her Windows or Android devices, the fix is a token value change (`--text-body--letter-spacing`), which is hers to decide. A real-device look is still worthwhile (see Pending).

---

## 4. Found and fixed during the build

| Finding                                                                                                                                                           | WCAG / rule             | Fix                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| The tinted button's hover (0.16 accent tint) measured 4.45:1                                                                                                      | 1.4.3                   | Hover tint 0.14 (4.58:1), decided with Darya                                                                     |
| The blue focus ring measured about 1.2:1 against the lightbox scrim                                                                                               | 1.4.11, 2.4.7           | White ring on the lightbox controls (about 3.7:1)                                                                |
| The skip link was 20px tall when focused: `not-sr-only` reset its padding                                                                                         | 2.5.8, HIG 44pt         | Padding and 44px height applied on focus                                                                         |
| Footer nav links were as narrow as 33px                                                                                                                           | 2.5.8, HIG 44pt         | 44px minimum width, label centred                                                                                |
| Under reduced motion the menu's first link was briefly unfocusable on open                                                                                        | 2.4.3                   | Nothing in the menu transitions under reduced motion                                                             |
| After a client-side navigation, the router restored `no-js`, and WebKit briefly showed then hid reveal content                                                    | Motion spec             | `no-js` stripped from the incoming page before the swap                                                          |
| The Projects grid's first row, above the fold, was revealed, so its LCP image counted as unpainted until a fade began                                             | Motion spec, LCP budget | The first row is never revealed                                                                                  |
| On a screen taller than the page (Skills at 2560 × 1440; Projects and Experience at 4K), a strip of page white sat between the last grey band and the grey footer | Layout                  | The page's last band takes the spare height, so its background meets the footer. Covered by `responsive.spec.ts` |

---

## 5. Exceptions

| Exception                                                | Why it is acceptable                                                                                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project card summaries are clamped to two lines          | The card is a teaser; the full summary is the first paragraph of the project page the card links to. Text resizing makes the card taller rather than cutting words mid-line       |
| Divider and card-border colour `#d2d2d7` is 1.51:1       | Decorative only: no information or control is identified by a border alone (token doc §1). Revisit if a form is ever added                                                        |
| WebKit, like Safari, skips links when tabbing by default | A browser setting, not the site: Safari users who navigate by keyboard turn on "Press Tab to highlight each item". The keyboard spec runs in Chromium and Firefox for this reason |
| The nav's scroll hairline does not appear in Firefox     | Firefox lacks scroll-driven animations. The hairline is decoration; nothing depends on it                                                                                         |

---

## Device passes

Release gates from [docs/07-test-plan.md](07-test-plan.md) §5 that need real Apple hardware, done by Darya on 2026-11-23 and recorded here as she reported them.

### VoiceOver, macOS Safari and iOS (roadmap 6.7)

**Pass on both.** VoiceOver worked as expected on macOS and on iOS. The checklist the pass worked from:

- the heading list (`VO + U`, then Headings) reads as a sensible outline: one h1, then h2 sections, then h3 cards and roles;
- the links list has no duplicate or meaningless entries, and external links say they open a new tab;
- gallery images are described, and the lightbox announces "Image N of M" as it changes;
- the Experience timeline reads as an ordered list of roles with their dates;
- the nav announces the current page, and inside a project, that Projects is the current section;
- the mobile menu, opened on iOS, keeps VoiceOver inside it until closed.

### Physical iPhone, Safari (roadmap 6.11)

**Pass.** Layout, menu and animations behaved as expected, and with iOS Reduce Motion on, motion was removed as specified.

### Fonts on Apple devices (ADR-0003)

**Pass.** On both the Mac and the iPhone the system's SF Pro rendered, not Inter. The release checklist in the test plan §9 repeats the Network-panel check (no Inter request at all) on the live site once it is deployed.

### Also found on real hardware

On a 2560 × 1440 monitor, the Skills page showed a white strip between its grey band and the grey footer. Fixed; see §4.

### Optional: a non-Apple device

A look at the body text on a real Windows or Android device, to settle the tracking recommendation in §3.
