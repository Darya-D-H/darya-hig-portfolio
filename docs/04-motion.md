# Motion Specification

**Status:** Draft, awaiting approval

The brief asked for "the floating animations when the stuff load" — Apple's scroll-reveal, where content fades up into place as you move down the page. This document pins down exactly how, and more importantly when _not_ to.

Motion on apple.com works because it is uniform, short, and never repeats. Every element uses the same distance, the same duration, and the same curve, and it plays once. The moment an element re-animates on every scroll pass, or each section invents its own timing, the page feels cheap.

---

## 1. Principles

1. **Motion clarifies, it does not decorate.** Every animation answers a question: what just appeared, what did I just press, where did this panel come from.
2. **One vocabulary.** One reveal distance, one reveal duration, one curve. Variety comes from stagger, not from different animations.
3. **Play once.** A reveal fires the first time an element enters the viewport and then unobserves itself. Nothing re-animates when scrolling back up.
4. **Never animate what is already visible.** Above-the-fold content renders at final state. Animating the hero delays the thing the visitor came for and damages LCP.
5. **Never block interaction.** No animation gates a click. Direct-manipulation feedback stays at or under 200ms, which is the threshold at which a response still feels instantaneous.
6. **Compositor-only properties.** `opacity` and `transform` only. Animating `height`, `top`, `width` or `margin` forces layout on every frame and janks on mid-range phones.
7. **Reduced motion is a real mode, not a courtesy.** It is not "the same animation, faster". It is the absence of movement, with content fully visible.

---

## 2. Motion tokens

| Token                  | Value                               | Applies to                                  |
| ---------------------- | ----------------------------------- | ------------------------------------------- |
| `--duration-instant`   | 100ms                               | Button press (`scale`)                      |
| `--duration-fast`      | 200ms                               | Hover, focus ring, colour transitions       |
| `--duration-base`      | 300ms                               | Lightbox open/close, small panels           |
| `--duration-menu`      | 400ms                               | Mobile menu panel                           |
| `--duration-reveal`    | 600ms                               | Scroll reveal                               |
| `--duration-signature` | 2200ms                              | The hero signature writing itself, in total |
| `--ease-out`           | `cubic-bezier(0.16, 1, 0.3, 1)`     | Reveals and entrances                       |
| `--ease-in-out`        | `cubic-bezier(0.4, 0, 0.2, 1)`      | Reversible transitions: hover in and out    |
| `--ease-nav`           | `cubic-bezier(0.32, 0.08, 0.24, 1)` | Mobile menu                                 |
| `--reveal-distance`    | 24px                                | Vertical travel on reveal                   |
| `--reveal-stagger`     | 80ms                                | Delay between siblings                      |

### On the easing curves

These are modelled on how Apple's interfaces feel, not copied from apple.com's stylesheet — the exact values there vary per component and are not published as a system.

`--ease-out` is a strong ease-out: it covers most of the distance early and settles slowly. That is what makes a reveal feel like an object arriving under its own momentum rather than a linear slide. It is the right curve for anything entering, and the wrong curve for anything leaving.

`--ease-in-out` is symmetric, which is what a reversible state change needs. A hover that eases out on the way in and on the way out feels sticky.

**Never use `linear`** for anything except an indeterminate spinner, and there are none on this site.

---

## 3. Scroll reveal

The signature effect. Implemented in `src/lib/reveal.ts`.

### Specification

| Property          | Value                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| From              | `opacity: 0`, `translateY(24px)`                                                                                                                |
| To                | `opacity: 1`, `translateY(0)`                                                                                                                   |
| Duration          | 600ms                                                                                                                                           |
| Easing            | `--ease-out`                                                                                                                                    |
| Trigger threshold | 15% of the element visible                                                                                                                      |
| Root margin       | `0px 0px -10% 0px` — fires slightly before the element reaches the bottom edge, so it is already settling by the time it is comfortably in view |
| Repeat            | Never. The observer unobserves the element on first intersection                                                                                |
| Stagger           | 80ms per sibling within one group, capped at 5 steps (400ms)                                                                                    |

### The stagger cap

A six-card grid at 80ms each takes 480ms for the last card to begin, and nearly 1.1s to finish. Past about five steps a stagger stops reading as "elegant sequence" and starts reading as "slow page". So the delay is `min(index, 4) * 80ms`: the first five cards cascade, and everything after shares the fifth delay. On the six-project grid that means cards 5 and 6 arrive together, which is imperceptible and keeps the grid feeling responsive.

### What reveals, and what does not

| Element                                    | Reveals?                               |
| ------------------------------------------ | -------------------------------------- |
| Hero eyebrow, headline, subhead, CTAs      | **No** — above the fold, renders final |
| Hero signature                             | **Draws once on load**; see below      |
| Nav, footer                                | No                                     |
| Section headings below the fold            | Yes                                    |
| Project cards, skill cards, timeline nodes | Yes, staggered within their group      |
| Project detail prose sections              | Yes, per section, not per paragraph    |
| Images                                     | Yes, but see the LCP note below        |
| Anything inside an open lightbox           | No                                     |

**The signature is the one thing above the fold that moves** (decided with Darya, 2026-11-24). It writes itself once, as if being signed: a mask of pen strokes, each animating `stroke-dashoffset`, reveals the letters stroke by stroke (details in [docs/03-components.md](03-components.md) §4.2a). CSS only, no script, so it adds nothing to the three client modules. Seven strokes run one after another, with a short pause for each pen lift, over `--duration-signature` (2.2s) after a `--duration-base` pause, each stroke eased with `--ease-in-out` so the pen speeds up and settles like a hand. It replays when Home is reached by a client-side navigation, because the page is new each time. It costs nothing against LCP because an inline SVG is not an LCP candidate, and the headline beside it is already final. Under reduced motion it is drawn from the start, and with scripts off it is drawn too, because the animation is CSS.

**Per section, not per paragraph.** Revealing individual paragraphs makes reading feel like a slideshow, because the next paragraph is still invisible when you reach it.

### Implementation sketch

```ts
// src/lib/reveal.ts
const SELECTOR = "[data-reveal]";

export function initReveal(): void {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const elements = document.querySelectorAll<HTMLElement>(SELECTOR);

  // No observer support, or the user asked for no motion: show everything now.
  if (prefersReduced || !("IntersectionObserver" in window)) {
    elements.forEach((el) => el.setAttribute("data-revealed", "true"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-revealed", "true");
        observer.unobserve(entry.target); // play once
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );

  elements.forEach((el) => observer.observe(el));
}
```

The CSS owns the actual animation, which keeps it off the main thread:

```css
@media (prefers-reduced-motion: no-preference) {
  [data-reveal] {
    opacity: 0;
    transform: translateY(var(--reveal-distance));
    transition:
      opacity var(--duration-reveal) var(--ease-out),
      transform var(--duration-reveal) var(--ease-out);
    transition-delay: var(--reveal-delay, 0ms);
  }
  [data-reveal][data-revealed="true"] {
    opacity: 1;
    transform: none;
  }
}
```

Two things to notice. First, the initial hidden state lives **inside** `prefers-reduced-motion: no-preference`, so a reduced-motion user never has `opacity: 0` applied at all — there is no dependency on JavaScript running to make content visible. Second, `transform: none` rather than `translateY(0)` so the element drops out of its own compositing layer when it is done.

### The no-JS and LCP safeguards

- `<html class="no-js">` is set in the markup, and an inline script in `<head>` removes it immediately. If scripts are blocked, the class stays and a `.no-js [data-reveal] { opacity: 1; transform: none; }` rule shows everything.
- `initReveal()` is called from a module with `is:inline` deferred until after first paint, so it never delays LCP.
- **No image that could be the LCP element is given a reveal.** The hero image on a project page renders at final state with `loading="eager"` and `fetchpriority="high"`. Fading in the largest image on the page is a direct, measurable hit to the Largest Contentful Paint score, and the performance budget is 2.0s.

---

## 4. Page transitions

Astro's `<ClientRouter />` from `astro:transitions`, added once in `BaseLayout`.

| Property           | Value                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default transition | Cross-fade, 300ms, `--ease-in-out`                                                                                                                 |
| Persisted elements | Nav and footer carry `transition-persist`, so they do not flicker between pages                                                                    |
| Shared element     | A project card's thumbnail and its detail-page hero image share a `transition:name`, so the image appears to expand into place                     |
| Reduced motion     | Astro's built-in animations already respect `prefers-reduced-motion`; we additionally force `transition: none` on persisted elements to be certain |

**The reveal-after-navigation problem.** View transitions swap the DOM without a full page load, so a reveal initialised on first load will not be wired up to the new page's elements. `initReveal()` must therefore run on `astro:page-load`, which fires both on the initial load and after every transition — not on `DOMContentLoaded`, which fires only once. The same applies to `initMenu()` and `initLightbox()`.

```ts
document.addEventListener("astro:page-load", () => {
  initReveal();
  initMenu();
  initLightbox();
});
```

Astro 7 removed the old `astro:transitions` internal helpers (`TRANSITION_*` constants, `isTransitionBeforePreparationEvent()`, `createAnimationScope()`), so we use the plain lifecycle event-name strings as above. Nothing here depends on the removed internals.

Each `init()` must be idempotent: re-running it on a page that has already been initialised must not double-bind listeners. The menu module guards with a `data-initialised` attribute.

---

## 5. Interaction feedback

| Interaction           | Animation                            | Duration | Easing          |
| --------------------- | ------------------------------------ | -------- | --------------- |
| Button hover          | Background colour shift              | 200ms    | `--ease-in-out` |
| Button press          | `scale(0.97)`                        | 100ms    | `--ease-out`    |
| Plain-button hover    | Chevron `translateX(2px)`            | 200ms    | `--ease-in-out` |
| Card hover            | `translateY(-2px)` + shadow fade in  | 200ms    | `--ease-out`    |
| Link hover            | Underline appears                    | 200ms    | `--ease-in-out` |
| Focus ring            | Appears instantly                    | 0ms      | —               |
| Nav shadow on scroll  | Opacity fade                         | 200ms    | `--ease-in-out` |
| Mobile menu           | `translateY(-100%)` → `0`            | 400ms    | `--ease-nav`    |
| Lightbox open         | Opacity 0→1, image `scale(0.98)`→`1` | 300ms    | `--ease-out`    |
| Lightbox image change | Opacity cross-fade                   | 200ms    | `--ease-in-out` |

**The focus ring never animates.** A fading focus indicator is harder to locate, and for someone tabbing quickly through a page the ring needs to be at full strength the instant it lands.

---

## 6. Reduced motion

`prefers-reduced-motion: reduce` is honoured through a single global rule plus the structural choice described in section 3.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is the one place `!important` is permitted, and the reason is in the spec's "never" list with this exception noted: a user's accessibility preference must win over every component's local style, including any third-party CSS.

### What changes under reduced motion

| Element         | Normal           | Reduced                                      |
| --------------- | ---------------- | -------------------------------------------- |
| Scroll reveal   | Fade + 24px lift | No animation; content visible from the start |
| Page transition | 300ms cross-fade | Instant swap                                 |
| Mobile menu     | 400ms slide      | Instant open/close                           |
| Lightbox        | Fade + scale     | Instant                                      |
| Button press    | `scale(0.97)`    | No scale; colour change only                 |
| Card hover      | Lift + shadow    | Shadow only, no movement                     |
| `BackToTop`     | Smooth scroll    | Instant jump                                 |
| Hero signature  | Draws once       | Already written                              |

Note that hover and focus **colour** changes are kept. Reduced motion means less movement, not less feedback — removing the hover state entirely would make the interface feel broken, and `prefers-reduced-motion` is specifically about motion, not about contrast or state indication.

Also note that the global rule sets durations to `0.01ms` rather than `0`. A zero-duration transition does not fire a `transitionend` event in some engines; `0.01ms` is visually instant but still fires, so any code that waits on `transitionend` continues to work.

### Testing it

Reduced motion is not an edge case; it is a system setting that a meaningful share of users have on, often because motion makes them physically unwell. It gets a dedicated pass in [docs/07-test-plan.md](07-test-plan.md), and Playwright runs a project with `reducedMotion: "reduce"` so this is covered automatically rather than by remembering to toggle an OS setting.

---

## 7. What we are deliberately not building

Recorded so these do not get added later without a decision:

| Effect                              | Why not                                                                                                                                                                                                                                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parallax backgrounds                | Scroll-linked, so it janks on low-end devices, and it is a common trigger for motion sickness                                                                                                                                                                                                                  |
| Scroll-hijacking / pinned sections  | Takes control of scrolling away from the user, breaks keyboard paging and `Find in page`                                                                                                                                                                                                                       |
| Scale-on-scroll images              | Continuous scroll-linked transform on a large image; expensive and distracting on a portfolio                                                                                                                                                                                                                  |
| Text that animates in word by word  | Slows reading and plays badly with screen readers                                                                                                                                                                                                                                                              |
| Marquee / auto-scrolling tech logos | Auto-moving content needs a pause control under WCAG 2.2.2, and it adds nothing                                                                                                                                                                                                                                |
| Custom cursor                       | Breaks pointer affordances and accessibility expectations                                                                                                                                                                                                                                                      |
| Loading spinners or skeletons       | A static site has nothing to wait for; a spinner would be theatre                                                                                                                                                                                                                                              |
| Preloader or whole-page blur-in     | Considered with Darya, 2026-11-24. Every page's text is in the first response, and hiding it until a script decides would delay LCP on every page. If real screenshots load slowly after Phase 8, the candidate is a build-time blurred placeholder per image that sharpens on load and is skipped when cached |

The brief chose "subtle Apple-style", and this table is what that choice excludes.
