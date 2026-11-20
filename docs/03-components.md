# Component Specifications

**Status:** Draft, awaiting approval

Every component here is specified across four axes: **variants**, **states**, **accessibility contract**, and **tokens used**. A component is not finished until all four are implemented.

The state list is not boilerplate. The most common failure in a portfolio build is designing only the default state and discovering at review time that focus is invisible, the hover is missing on touch, and the empty case renders a blank box.

---

## 1. Component inventory

| Component | Folder | Ships JS | Used on |
|---|---|---|---|
| `Nav` | layout | no | all |
| `MobileMenu` | layout | yes | all, below 735px |
| `Footer` | layout | no | all |
| `Container` | layout | no | all |
| `Section` | layout | no | all |
| `SkipLink` | layout | no | all |
| `Button` | ui | no | most |
| `TextLink` | ui | no | most |
| `Card` | ui | no | projects, skills, experience |
| `Tag` | ui | no | projects, skills |
| `Eyebrow` | ui | no | most |
| `Divider` | ui | no | project detail |
| `Reveal` | ui | yes (shared module) | all below the fold |
| `Hero` | sections | no | home |
| `AboutSection` | sections | no | home |
| `ProjectCard` | sections | no | home, projects |
| `ProjectGrid` | sections | no | home, projects |
| `SkillsGrid` | sections | no | home, skills |
| `Timeline` | sections | no | experience |
| `TimelineNode` | sections | no | experience |
| `ProjectMeta` | sections | no | project detail |
| `ProjectPager` | sections | no | project detail |
| `ErrorPage` | sections | no | 404 |
| `Gallery` | sections | yes (lightbox) | project detail |
| `Lightbox` | sections | yes | project detail |
| `ContactPanel` | sections | no | contact |
| `BackToTop` | ui | yes | all (in footer) |

Three client-side modules in total: `menu.ts`, `reveal.ts`, `lightbox.ts`. `BackToTop` is a plain anchor to `#main` with `scroll-behavior: smooth` in CSS, so it needs no JavaScript. That keeps the site inside the 15 KB JS budget with room to spare.

---

## 2. Layout components

### 2.1 `Section`

The band primitive. Owns vertical padding and background colour so no page ever hand-rolls either.

**Props**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `tone` | `"white" \| "grey"` | `"white"` | Maps to `--color-canvas` / `--color-section` |
| `labelledBy` | `string?` | — | ID of the heading that names this section; sets `aria-labelledby` |
| `width` | `"content" \| "wide"` | `"content"` | 980px vs 1280px inner column |
| `as` | `"section" \| "div"` | `"section"` | `div` for a band that has no heading of its own |
| `padding` | `"default" \| "hero" \| "none"` | `"default"` | Hero gets the larger scale |

**Rules**

- A `<section>` without an accessible name is just a `<div>` to assistive technology. If `as="section"` and no `labelledBy` is given, the build warns. Use `as="div"` when the band genuinely has no heading.
- Never nest a `Section` inside a `Section`.

### 2.2 `Container`

Max-width plus gutters. Nothing else — no padding, no background. Separating it from `Section` means the hero image on a project page can break out to `wide` while the prose around it stays at `content`.

### 2.3 `Nav`

Sticky translucent bar, 44px tall.

**Structure**

```html
<header class="sticky top-0 z-sticky">
  <nav aria-label="Main">
    <a href="/">Darya</a>                 <!-- wordmark, links home -->
    <ul>                                   <!-- 4 links, hidden below 735px -->
      <li><a href="/projects">Projects</a></li>
      …
    </ul>
    <button aria-expanded="false" aria-controls="mobile-menu">  <!-- shown below 735px -->
      <span class="sr-only">Menu</span>
    </button>
  </nav>
</header>
```

**States**

| State | Appearance |
|---|---|
| Default (top of page) | `--color-nav-bg` with `--blur-nav`, no shadow |
| Scrolled (> 0px) | Same, plus `--shadow-nav` hairline |
| Link hover | Link colour moves from `--color-ink` to full black, 200ms |
| Link current page | `aria-current="page"`, rendered at weight 600 and full `--color-ink` |
| Link focus-visible | 2px `--color-accent` outline, 2px offset |

**Accessibility contract**

- `<nav aria-label="Main">`, since there is a second nav in the footer and both need distinguishing.
- The current page is marked with `aria-current="page"`, not just a colour. Colour alone is not a state a screen reader can perceive.
- Every link's hit area is at least 44px tall, achieved with padding even though the text is 14–17px.
- The nav does not trap focus and is reachable by keyboard before the main content.
- The scrolled shadow is applied by a CSS-only technique where possible. If a scroll listener is needed, it is passive and throttled to `requestAnimationFrame`.

**A note on sticky nav and anchor links:** a 44px sticky header will cover the top of any element scrolled to via a fragment link. `scroll-margin-top: calc(var(--size-nav-height) + var(--space-4))` goes on every heading that can be an anchor target. This is a one-line fix that is almost always forgotten.

### 2.4 `MobileMenu`

Full-screen overlay panel below 735px, matching apple.com's pattern.

**Behaviour**

| Trigger | Result |
|---|---|
| Tap the menu button | Panel slides down over the full viewport, 400ms, `--ease-nav`. Button icon morphs to a close glyph. `aria-expanded="true"` |
| Tap a link | Panel closes, navigation proceeds |
| Tap the scrim or the close button | Panel closes |
| Press `Escape` | Panel closes, focus returns to the menu button |
| Resize above 735px while open | Panel closes immediately, so the desktop nav is never shown behind an open overlay |

**Accessibility contract**

This is the single most failure-prone component on the site. The contract:

- The trigger is a real `<button type="button">` with `aria-expanded` and `aria-controls`.
- While open, focus is **trapped** inside the panel: `Tab` from the last item wraps to the first, `Shift+Tab` from the first wraps to the last.
- On open, focus moves to the first link in the panel. On close, focus returns to the trigger button. Returning focus is what keyboard users rely on and what gets missed.
- While open, the rest of the page is `inert` (with an `aria-hidden` fallback where `inert` is unsupported), and `overflow: hidden` is set on `<body>` to stop background scroll.
- The scrim is a `<div>` with no role; it is not a button, because its function is duplicated by the close button, which is focusable.
- Icon-only buttons carry a visually hidden label (`Menu` / `Close menu`).

**Reduced motion:** the panel appears and disappears with no slide and no fade — an instant state change. It does not merely animate faster.

### 2.5 `SkipLink`

First focusable element in the document. Visually hidden until focused, then pinned top-left above everything at `--z-skip-link`. Targets `#main`, which carries `tabindex="-1"` so focus actually lands there in every browser.

### 2.6 `Footer`

Grey band. Four nav links in a `<nav aria-label="Footer">`, social links, `BackToTop`, and a copyright line. Social links open in a new tab and say so via visually hidden text.

---

## 3. UI primitives

### 3.1 `Button`

**Variants**

| Variant | Appearance | Use |
|---|---|---|
| `filled` | `--color-accent` background, white label, `--radius-pill`, 12px × 24px padding | One primary action per view |
| `tinted` | `rgba(0,113,227,0.1)` background, `--color-link` label, pill | Secondary action on a white band |
| `plain` | No background, `--color-link` label with a trailing chevron | Tertiary; this is apple.com's `Learn more ›` |

**States**

| State | filled | tinted | plain |
|---|---|---|---|
| Default | accent bg | tinted bg | link colour |
| Hover | `--color-accent-hover` | tint deepens to 0.16 alpha | chevron slides 2px right, 200ms |
| Active | scale 0.97, 100ms | scale 0.97 | — |
| Focus-visible | 2px accent outline, 2px offset | same | same |
| Disabled | 40% opacity, `pointer-events: none`, `aria-disabled="true"` | same | same |
| Loading | not applicable — this site has no async actions | — | — |

**Accessibility contract**

- Renders `<a>` when `href` is present, `<button>` otherwise. A link that performs navigation must never be a `<button>`, and an action must never be an `<a href="#">`.
- Minimum 44 × 44px hit area including padding.
- The chevron on `plain` is a CSS pseudo-element or an inline SVG with `aria-hidden="true"`, never a text character that a screen reader reads as "greater than".
- Label text is meaningful on its own. `View projects`, not `Click here`. A screen reader user listing links hears only the link text.
- `active` uses `scale`, which is a compositor-only transform — it never triggers layout. It is removed under reduced motion.

### 3.2 `TextLink`

Inline link within prose. `--color-link`, no underline at rest, underline on hover and on focus.

**The underline question:** WCAG 1.4.1 (Use of Color) says colour must not be the only means of conveying information — which includes distinguishing a link from surrounding text. `#0066cc` against `#1d1d1f` body text has a contrast ratio between the two *text colours* of well under 3:1, so colour alone is not sufficient. Therefore **links inside paragraphs are always underlined at rest.** Links that stand alone (nav items, card titles, CTA rows) are not, because there is no surrounding body text to confuse them with. apple.com makes the same distinction.

### 3.3 `Card`

**Props:** `tone` (`"onGrey"` | `"onWhite"`), `interactive` (boolean), `href` (optional), `padding`.

**States**

| State | Appearance |
|---|---|
| Default, on grey | White surface, `--radius-card`, no border, no shadow |
| Default, on white | White surface, 1px `--color-divider` border |
| Hover (interactive only) | `--shadow-card-hover`, translate `-2px` on Y, 200ms `--ease-out` |
| Focus-visible (interactive) | 2px accent outline, 2px offset, **plus** the hover shadow |
| Active | translate back to 0, scale 0.995 |

**The whole-card-link problem.** A card whose entire surface is clickable but which contains a title, a summary and three tags has a hard accessibility question: what is the link's accessible name? Three approaches, and the one we use:

- ~~Wrap everything in an `<a>`~~ — the accessible name becomes the concatenation of title, summary and every tag, which is read aloud as one long run-on string.
- ~~`<div onclick>`~~ — not focusable, not a link, invisible to keyboard and screen reader users. Never.
- **Used here:** the card is a `<div>`; the **title** is the `<a>`; a `::after` pseudo-element on the anchor is stretched over the whole card to capture pointer clicks. The accessible name is exactly the title, the whole card is clickable with a mouse, and the focus ring is drawn on the card (via `:focus-within`) rather than on the title text alone. Tags inside the card are not links, so there is no nested-interactive problem.

One consequence to accept: text inside the card is not selectable by dragging, because the overlay captures the drag. For a portfolio card that is an acceptable trade.

### 3.4 `Tag`

Non-interactive chip. `--radius-xs`, `--text-caption` at 12px minimum, `--color-ink-secondary` on a `#f5f5f7` fill when on a white card, and on a white fill when on a grey band. 8px × 12px padding.

Tags are **not** links and **not** filters. They are labels. Rendered as `<li>` inside a `<ul>` so the count is announced.

### 3.5 `Eyebrow`

The small coloured label above a heading. `--text-eyebrow`, `--color-link` (not `--color-accent`, because eyebrows appear on grey bands).

An eyebrow is **not** a heading. It is a `<p>` that sits before the `<h1>`/`<h2>`. Marking it as a heading level would break the hierarchy and make the real heading look like a subheading.

### 3.6 `Reveal`

Wrapper that fades and lifts its children when they scroll into view. Full spec in [docs/04-motion.md](04-motion.md).

**Props:** `delay` (ms, for stagger), `distance` (defaults to `--reveal-distance`), `as` (element to render).

**Contract:** the content is in the DOM and in the accessibility tree from the start. It is not `display: none` and not `visibility: hidden` — only `opacity` and `transform` change, so a screen reader reads it immediately and a search engine indexes it. If JavaScript never runs, a `.no-js` class on `<html>` leaves everything at full opacity. **Content is never hidden behind a script.**

---

## 4. Section components

### 4.1 `ProjectCard`

| Element | Token | Notes |
|---|---|---|
| Thumbnail | `--radius-card` top corners, 16:10 | `astro:assets` with explicit width/height; `loading="lazy"` except the first row, which is eager |
| Title | `--text-card-title` | The `<a>`, per the whole-card pattern above |
| Summary | `--text-body-sm`, secondary ink | Clamped to 2 lines with `line-clamp-2` |
| Tags | `Tag` | Maximum 3; a 4th becomes `+2` |

**Empty/missing states:** no thumbnail in front matter renders a flat `--color-section` block with the project's initial, not a broken image. No summary renders nothing rather than an empty gap.

### 4.2 `Timeline` / `TimelineNode`

`<ol>` with one `<li>` per role. The vertical line is a `::before` on the `<ol>`; the dot is a `::before` on each `<li>`. Both are decorative and invisible to assistive technology.

| Breakpoint | Line position | Card |
|---|---|---|
| > 1068px | 1px line at left edge of content column, dots 9px diameter | Card offset 48px right of the line |
| ≤ 734px | Line at 8px from left, dots 7px | Card offset 28px, full remaining width |

Each node: `<article>` containing `<h3>` (role), `<p>` with company and a `<time datetime="YYYY-MM">` range, and a `<ul>` of bullets.

### 4.3 `Gallery` and `Lightbox`

The gallery is a grid of 2–6 thumbnails; each is a `<button>` that opens the lightbox at that index.

**Lightbox interaction spec**

| Trigger | Result |
|---|---|
| Click/tap a thumbnail | Lightbox opens at that image, fades in 300ms, image scales from 0.98 |
| `Escape` | Closes |
| `←` / `→` | Previous / next image |
| Click the scrim | Closes |
| Click the close button | Closes |
| Swipe left/right (touch) | Previous / next |

**Accessibility contract**

- Implemented with the native `<dialog>` element and `showModal()`, which gives focus trapping, `Escape` handling, the top layer, and backdrop inerting from the platform rather than from hand-written JavaScript. This is the single biggest reduction in bug surface available here.
- `aria-label` on the dialog: `Image viewer`.
- On open, focus moves to the close button. On close, focus returns to the thumbnail that was activated — not to the top of the page.
- Prev/next are real `<button>`s with visually hidden labels, and they are `disabled` at the ends rather than wrapping. Wrapping silently is disorienting when you cannot see the carousel.
- A live region announces `Image 3 of 6` on each change.
- The thumbnail grid is a `<ul>`; each trigger button's accessible name is the image's alt text, so the list is navigable by screen reader.
- Images inside the lightbox get the same real alt text as the thumbnails. If a screenshot is genuinely decorative it does not belong in a gallery.

**Reduced motion:** no fade, no scale, no slide between images. The image simply changes.

**No-JS behaviour:** without JavaScript the thumbnails are plain links to the full-size image file. Degrading to "nothing happens" is not acceptable; degrading to "you see the image" is.

### 4.4 `ContactPanel`

Eyebrow, `h1`, body, one `filled` Button to the `mailto:`, and a row of `plain` links for social. Centred, `max-width: 680px`.

### 4.5 `ProjectPager`

Previous / next links at the end of a project detail page. Rules for which neighbours appear are in [docs/01-information-architecture.md](01-information-architecture.md) §4.

**Props**

| Prop | Type | Notes |
|---|---|---|
| `prev` | `{ slug: string; title: string } \| undefined` | Absent on the first project |
| `next` | `{ slug: string; title: string } \| undefined` | Absent on the last project |

Neighbours are computed at build time in `[slug].astro` by `getAdjacent()` in `src/lib/projects.ts` — a pure function, unit-tested. The component ships no JavaScript.

**Structure**

```html
<nav aria-label="More projects">
  <a href="/projects/alpha" rel="prev">
    <span class="eyebrow"><span aria-hidden="true">‹ </span>Previous project</span>
    <span class="title">Alpha Dashboard</span>
  </a>
  <a href="/projects/gamma" rel="next">
    <span class="eyebrow">Next project<span aria-hidden="true"> ›</span></span>
    <span class="title">Gamma CLI</span>
  </a>
</nav>
```

| Element | Token | Notes |
|---|---|---|
| Eyebrow | `--text-caption`, secondary ink | Direction label |
| Title | `--text-body`, weight 600, `--color-link` | Underlines on hover, per `TextLink` |
| Gap between the two | `--space-6` | |

**Layout:** two equal columns at ≥ 735px — *Previous* left-aligned in the left column, *Next* right-aligned in the right column. When one side is absent its column stays empty, so *Next* never drifts to the left. Below 735px the links stack full-width, *Previous* first, matching DOM order.

**Accessibility contract**

- A second `<nav>` landmark, distinguished from the site nav by `aria-label="More projects"`.
- The accessible name is the visible text ("Previous project Alpha Dashboard"), so no `aria-label` overrides it and WCAG 2.5.3 Label in Name holds.
- Chevrons are `aria-hidden`; the word carries the meaning.
- Each link's hit area is the whole tile, at least 44px tall.
- Not wrapped in `Reveal`: it is navigation, and navigation is never hidden waiting for a scroll.

**Empty state:** if a project has no neighbours at all (a collection of one), the component renders nothing — no empty `<nav>`.

### 4.6 `ErrorPage`

The body of an HTTP error page. Content rules and copy are in [docs/01-information-architecture.md](01-information-architecture.md) §8.

| Prop | Type | Example |
|---|---|---|
| `code` | `number` | `404` |
| `message` | `string` | `The page you're looking for can't be found.` |
| `cta` | `{ label: string; href: string }`, optional | defaults to `{ label: "Go to Home", href: "/" }` |

**Structure**

```html
<section aria-labelledby="error-title" class="error-page">
  <h1 id="error-title">The page you're looking for can't be found.</h1>
  <a class="button button--filled" href="/">Go to Home</a>
  <p class="error-code">Error 404</p>
</section>
```

- The message is the `<h1>`. The status code is a plain `<p>` after the button, and is never a heading. Screen readers hear the explanation first and the code last, matching the visual order.
- `Go to Home` is a link styled as a button, because it navigates. Using `<button>` with a click handler would break middle-click and "open in new tab", and it would need JavaScript.
- Focus is not moved programmatically. On a client-side navigation, the router's normal focus handling applies.
- No `Reveal` and no entrance animation. The message is the whole page and the LCP element.

---

## 5. States checklist

Before any component is marked done, every row that applies to it is verified in a browser:

- [ ] Default
- [ ] Hover (pointer devices only — never the *only* way to reveal information)
- [ ] Focus-visible, with a ring at ≥ 3:1 against its background
- [ ] Active / pressed
- [ ] Disabled, where applicable
- [ ] Current page, where applicable
- [ ] Empty / missing content
- [ ] Long content: a 60-character project title, a 12-word role name
- [ ] 200% browser zoom
- [ ] `prefers-reduced-motion: reduce`
- [ ] Keyboard-only operation, start to finish
- [ ] Touch: nothing depends on hover, every target ≥ 44px

**On hover-only information:** any detail revealed solely on hover is invisible on every touch device and to every keyboard user. In this design nothing is hover-revealed — hover only adds emphasis to something already visible. Keep it that way.

---

## 6. Component documentation convention

Each `.astro` component opens with a comment block:

```astro
---
/**
 * ProjectCard
 *
 * A single project in a grid. The title is the link; the whole card is
 * clickable via a stretched ::after overlay so the accessible name stays
 * short. See docs/03-components.md §3.3.
 *
 * @example
 * <ProjectCard project={entry} eager={index < 3} />
 */
---
```

If a component's behaviour diverges from this document, the document is updated in the same commit. A doc that describes something the code no longer does is worse than no doc.
