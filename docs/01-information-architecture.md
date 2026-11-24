# Information Architecture and Page Specs

**Status:** Draft, awaiting approval

---

## 1. Sitemap

```
/                        Home          — hero, about, featured projects, skills grid
/projects                Projects      — full card grid
/projects/[slug]         Project       — detail page, one per project (6 at launch)
/skills                  Skills        — category cards
/experience              Experience    — vertical timeline
/contact                 Contact       — email button and social links
/404                     Not found
```

Five top-level pages. There is no About page; the about content is a section on Home. There is no Resume page in v1.

### Navigation model

The global nav shows four links. Home is reached via the wordmark on the left, which is standard on apple.com and saves a slot.

```
[ Darya ]                 Projects   Skills   Experience   Contact
```

This is a **flat** hierarchy, which is what the HIG recommends when content divides into a few equal categories. The one exception is `/projects/[slug]`, which is hierarchical and therefore needs an explicit way back — covered in section 5.

**Depth guarantee:** every project detail page is two clicks from Home (Home → Projects → project), or one click from Home if it is one of the three featured.

### Footer

The footer repeats the four nav links, adds the social links, a copyright line, and a "Back to top" control. Apple's footer is dense with legal text; ours is deliberately not, because there is nothing to disclose.

---

## 2. Home — `/`

Four sections, in this order. Bands alternate between white and `#f5f5f7` so each section reads as a distinct slab.

### 2.1 Hero — white band

Full-width, generous vertical padding, centred text. No image, no illustration. The restraint is the point; an Apple product page opens with one enormous sentence. The one drawn element is Darya's signature, which is handwriting rather than illustration.

| Element       | Token                               | Placeholder content                                                                                                                                                                                   |
| ------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eyebrow       | `text-eyebrow`, accent colour       | `Software Developer`                                                                                                                                                                                  |
| Headline      | `text-hero`                         | `Quality is the part nobody asked for.` _(TODO: Darya's own line, a placeholder until she settles it)_                                                                                                |
| Signature     | Inline SVG, one stroke, primary ink | `darya`, in Darya's own hand. Replaces the subhead, and with it the stack and location line, once she supplies the SVG. Until then the subhead reads `TODO: Darya's Signature`, marking where it goes |
| Primary CTA   | Button, filled pill                 | `View projects` → `/projects`                                                                                                                                                                         |
| Secondary CTA | Button, text link with chevron      | `Get in touch ›` → `/contact`                                                                                                                                                                         |

**Behaviour:** the hero does not animate in on load. Content above the fold appears immediately — a fade-in on the first thing a visitor sees reads as slowness, and it hurts LCP. Everything below the fold reveals on scroll. This is a deliberate exception to the motion spec and is recorded in [docs/04-motion.md](04-motion.md).

**The signature is the one exception** (decided with Darya, 2026-11-24): it writes itself once on load, as if signed. An inline SVG is not an LCP candidate, so the draw costs nothing against the 2.0s budget, and the headline beside it still renders final. Under reduced motion it appears already written. Details in [docs/04-motion.md](04-motion.md) §3.

**The headline** is Darya's own line on quality (2026-11-24), so it carries no attribution: the signature below it signs it.

### 2.2 About — `#f5f5f7` band

A short self-introduction. Two columns on desktop, stacked on mobile: a section heading on the left, two or three paragraphs on the right. No portrait photo in v1 (adding one is a content decision, not a layout one — the layout reserves space for it should Darya want it later).

| Element                                      | Placeholder content                                                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Heading (h2)                                 | `About`                                                                                                                                                        |
| Body, para 1                                 | `TODO: I'm a software developer focused on web applications. I work mostly in PHP, and I care about the part of the stack where the interface meets the data.` |
| Body, para 2                                 | `TODO: Two or three sentences on how you work, what you're drawn to, and what you're looking for.`                                                             |
| Inline stat row _(optional, off by default)_ | Reserved. Not rendered in v1.                                                                                                                                  |

### 2.3 Featured projects — white band

Exactly three projects, chosen by a `featured: true` flag in the project front matter. The build fails if the count is not three, so this cannot silently drift.

- Desktop: three columns.
- `≤1068px`: three columns become two, with the third wrapping.
- `≤734px`: single column.

Each card shows thumbnail, title, one-line summary, and up to three tech tags. The whole card is one link to the detail page. Below the grid, a text link: `See all projects ›` → `/projects`.

### 2.4 Skills grid — `#f5f5f7` band

A teaser, not the full Skills page. Four category cards, each listing its top items as tags. Below: `All skills ›` → `/skills`.

This is the one piece of duplication across pages, and it is intentional: a recruiter who never leaves the landing page should still see the stack.

---

## 3. Projects — `/projects`

### Structure

| Element                 | Content                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Page header, white band | Eyebrow `Work`; h1 `Projects`; one-line intro: `TODO: A selection of things I've built, with notes on the decisions behind them.` |
| Grid, `#f5f5f7` band    | All six project cards                                                                                                             |

### Grid behaviour

| Viewport   | Columns |
| ---------- | ------- |
| > 1068px   | 3       |
| 735–1068px | 2       |
| ≤ 734px    | 1       |

Cards reveal on scroll in a staggered sequence, 80ms apart, row by row rather than one long cascade — a six-item cascade at 80ms each takes 480ms to finish and starts to feel like a loading spinner. The first row is the exception: it sits above the fold on arrival, so it renders at its final state, like the hero. Its first image is the page's LCP element on a phone, and a revealed element cannot count as painted until its fade begins.

### Card anatomy

```
┌─────────────────────────────┐
│  [ 16:10 thumbnail ]        │   rounded top corners, 28px
│                             │
│  Project title              │   card title type
│  One-line summary, two      │   body-sm, secondary ink
│  lines maximum.             │
│                             │
│  [PHP] [Astro] [MySQL]      │   up to 3 tags
└─────────────────────────────┘
```

No filters, no sort, no search. Six items do not need them, and each control would be another thing to make accessible.

### Ordering

By an explicit `order` field in front matter, ascending. Not by date, because "most recent" and "most impressive" are rarely the same project, and a portfolio should lead with its best.

---

## 4. Project detail — `/projects/[slug]`

Generated from the `projects` collection. Content model in [docs/06-content-model.md](06-content-model.md).

### Section order

1. **Back link** — `‹ Projects`, pinned at the top of the content column, above the title. Fulfils the HIG requirement that a hierarchical screen always offers a route back to its parent.
2. **Header, white band** — eyebrow (project type), h1 (title), one-paragraph summary.
3. **Meta strip** — a thin row of label/value pairs. Not selected during planning, so v1 shows only `Year` and `Role` if present in front matter, and nothing if absent.
4. **Hero image** — the project's primary screenshot, full content width, 28px radius.
5. **Challenge / Solution / Outcome** — three subsections, each with an h2 and prose. This is the case-study spine a recruiter skims.
6. **Tech stack** — a tag cloud grouped by role: language, framework, database, tooling.
7. **Design system notes** — prose plus an optional small swatch and type-sample block, for projects where the design system is worth describing. Omitted entirely when the front matter field is absent.
8. **Gallery** — 2–6 screenshots in a grid, each opening a lightbox. Full interaction spec in [docs/03-components.md](03-components.md).
9. **External links** — `View live site ›` and `View source ›` as text links with chevrons. Rendered only when the URL exists.
10. **Previous / next projects** — a two-up pair of links to the neighbouring projects, separated from the links above by a divider. Component spec in [docs/03-components.md](03-components.md) §4.5.
11. **Footer CTA, `#f5f5f7` band** — `See all projects ›` and `Get in touch ›`.

**Prev/next rules:**

- Neighbours follow the Projects grid order (`order` ascending, drafts excluded), so the pair walks the same sequence a recruiter sees on `/projects`.
- No wraparound. The first project shows only _Next_, the last only _Previous_. Jumping from the last project back to the first without saying so is disorienting, for the same reason the lightbox does not wrap.
- Each link shows its direction and the neighbouring project's title — never a bare arrow.

### Band rhythm

Alternating white and grey bands on a page this long becomes stripey. Instead the detail page is white throughout, and separation comes from spacing and hairline dividers, with one grey band at the end to close the page. This is how Apple handles long-form product detail pages.

---

## 5. Skills — `/skills`

| Element                        | Content                                        |
| ------------------------------ | ---------------------------------------------- |
| Page header, white band        | Eyebrow `Toolkit`; h1 `Skills`; one-line intro |
| Category cards, `#f5f5f7` band | Four cards                                     |

### Categories (placeholder)

| Category  | Items _(TODO: Darya to confirm and expand)_                   |
| --------- | ------------------------------------------------------------- |
| Backend   | PHP, Laravel, MySQL, REST APIs, Composer                      |
| Frontend  | JavaScript, TypeScript, HTML, CSS, Astro, Tailwind CSS        |
| Tooling   | Git, GitHub Actions, Vite, npm, Docker                        |
| Practices | Accessibility, responsive design, design systems, code review |

Each card: an h3 heading, an optional one-line description, then items as tag chips in a wrapping row.

**No proficiency bars, levels, or percentages.** They are self-assessed, unverifiable, and invite a recruiter to screen you out on a number you invented. The decision is recorded here so it does not get re-litigated.

Cards reveal on scroll, 80ms stagger.

---

## 6. Experience — `/experience`

| Element                  | Content                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Page header, white band  | Eyebrow `Career`; h1 `Experience`; one-line intro                                   |
| Timeline, `#f5f5f7` band | One node per role, newest first                                                     |
| Education, white band    | Visible h2 `Education`; the same timeline, one node per qualification, newest first |

Education lives here rather than on a page of its own (decided with Darya, 2026-11-24): a recruiter reads it beside the work history, and one or two entries would make a thin page. The roles band keeps its visually hidden h2, because the page's h1 already names it.

### Desktop timeline (> 1068px)

A single vertical hairline at the left of the content column, with a dot at each node and the role card to the right of the line.

```
 ●───┐  ┌──────────────────────────────┐
 │   │  │ Senior Engineer              │
 │   └──│ Company · 2024 — Present     │
 │      │ • Bullet                     │
 │      │ • Bullet                     │
 │      └──────────────────────────────┘
 │
 ●───┐  ┌──────────────────────────────┐
 │   └──│ Engineer                     │
```

Deliberately _not_ the alternating left/right zigzag timeline. It reads as a decorative infographic, it doubles the horizontal space needed, and it forces an awkward reading order for screen readers and for anyone scanning quickly.

### Mobile (≤ 734px)

The line and dots stay, moved to the far left with a reduced indent, and the cards go full width. The structure is identical, so there is no separate mobile component and no risk of the two drifting apart.

### Semantics

The timeline is an ordered list (`<ol>`), one `<li>` per role. The line and dots are drawn with CSS pseudo-elements and are invisible to assistive technology. Each role is an `<article>` with an `<h3>` naming the title, and the company and dates in a `<p>`, with the date range also in a `<time>` element.

### Node content

| Field           | Placeholder                                                                             |
| --------------- | --------------------------------------------------------------------------------------- |
| Role            | `TODO: Software Developer`                                                              |
| Company         | `TODO: Company name`                                                                    |
| Dates           | `TODO: 2024 — Present`                                                                  |
| Location / mode | `TODO: Remote` _(optional)_                                                             |
| Bullets         | 2–4 achievement lines, each starting with a verb and, where possible, carrying a number |

### Education

The same timeline as the roles, on a white band: the hairline, a dot per entry, and a card per qualification, newest first (Darya's call, 2026-11-24, so the two halves of the page read as one history). The semantics match a role: an `<li>` holding an `<article>` with an `<h3>` naming the qualification, and the institution and dates in a `<p>`, each date in a `<time>`.

| Field         | Placeholder                                                               |
| ------------- | ------------------------------------------------------------------------- |
| Qualification | `TODO: BSc Computer Science`                                              |
| Institution   | `TODO: University Name`                                                   |
| Dates         | `2017 — 2021`; no end date reads as Present                               |
| Location      | `TODO: City` _(optional)_                                                 |
| Details       | 0–3 lines: a final project, honours, coursework worth naming _(optional)_ |

---

## 7. Contact — `/contact`

Short page, no form. One white band, vertically centred, generous padding.

| Element         | Content                                                                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eyebrow         | `Contact`                                                                                                                                                                                          |
| Heading (h1)    | `Let's talk.`                                                                                                                                                                                      |
| Body            | `TODO: The best way to reach me is email. I usually reply within a day.`                                                                                                                           |
| Primary CTA     | Filled pill button, `Email me` → `mailto:darya.dler.contact@gmail.com`                                                                                                                             |
| Phone, location | In an `<address>` under the button: `+964 751 463 2525` as a standalone `tel:` link (its name starts "Phone:" for screen readers), then `Based in Erbil, Iraq` in secondary ink (added 2026-11-24) |
| Social links    | `GitHub ›` → `https://github.com/Darya-D-H`, `LinkedIn ›` → `https://www.linkedin.com/in/darya-dler-hussein` — text links with chevrons, `rel="me noopener"`, opening in a new tab                 |

**On the mailto link:** a plain `mailto:` href is visible to scrapers. The alternatives are worse — assembling the address in JavaScript breaks it for anyone without JS and for a crawler that should find it, and a form adds a third-party dependency for a site that has none. The address ships in plain text, and modern mail providers filter the resulting spam adequately. Recorded here so the trade-off is explicit. The phone number is in plain text for the same reason, and the same trade-off applies: it is public and can be scraped, which Darya accepted when she added it.

Links that open a new tab announce that they do, via visually hidden text, so the behaviour is not a surprise to a screen reader user.

**One source for contact details.** The email address, phone number, location and both social URLs live in `src/site.config.ts` and nowhere else. Contact and Footer both read from it, so a changed URL is changed once and the two can never drift.

---

## 8. Error pages — `/404`

Error pages lead with what happened in plain language. The HTTP status code is there for anyone who wants it, but it sits at the bottom as a small detail, never as the headline. A bare "404" means nothing to most visitors.

One white band, centred vertically and horizontally, and the same layout as every other page, so the nav and footer are present and the visitor is never stranded. Top to bottom:

| Element      | Content                                       | Style                                                                                                                                 |
| ------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Heading (h1) | `The page you're looking for can't be found.` | `--text-headline`, `--color-ink`                                                                                                      |
| Link home    | `Go to Home ›` → `/`                          | Standalone `TextLink`: `--text-body-lg`, `--color-link` (`#0066cc`), no underline at rest, underline on hover and focus. Not a button |
| Status code  | `Error 404`                                   | `--text-caption`, `--color-ink-secondary`, placed last with `--space-16` above it                                                     |

**Why a link and not a button.** The page has one job, getting the visitor home, and a single blue link does it without competing with the message. It stands alone, with no body text around it, so the rule in [docs/03-components.md](03-components.md) §3.2 applies: colour is enough to mark it as a link, and the underline appears on hover and focus. Its hit area is padded to 44px tall even though the text is shorter.

**Why secondary ink and not tertiary.** The code is meant to look quiet, but at caption size `--color-ink-tertiary` fails WCAG contrast, and the token rules in [docs/02-design-tokens.md](02-design-tokens.md) forbid it below 24px. `--color-ink-secondary` (`#6e6e73`) is the quietest colour that stays readable.

**Built as a reusable `ErrorPage` component** taking `code` and `message` ([docs/03-components.md](03-components.md) §4.6). Only `404.astro` uses it in v1. A static site never produces any other status itself: a missing path is the one error our HTML is served for, while 5xx errors happen at the host before any of our pages could load. If the chosen host supports custom 5xx pages (decided in Phase 7), each one is a single line using the same component.

**Page metadata:** `<title>` is `Page Not Found — Darya`, `<meta name="robots" content="noindex">`, and the page is excluded from the sitemap. The host must serve this page with a real `404` status, not `200`. That gets checked in Phase 7, because a 404 page returned with a `200` status gets indexed as a real page.

---

## 9. Cross-page conventions

### Page header pattern

Every page except Home and 404 opens with the same block: eyebrow, h1, one-line intro, on a white band. Consistency here is what makes a multi-page site feel like one product rather than five pages.

### Band alternation

| Page           | Band sequence                         |
| -------------- | ------------------------------------- |
| Home           | white → grey → white → grey           |
| Projects       | white → grey                          |
| Project detail | white throughout → grey (closing CTA) |
| Skills         | white → grey                          |
| Experience     | white → grey → white                  |
| Contact        | white                                 |

A page never opens on grey. The nav is translucent white, and a grey band immediately beneath it muddies the blur.

### Heading hierarchy

Exactly one `h1` per page. Section headings are `h2`. Card and node titles are `h3`. No level is ever skipped, and heading level is never chosen for its size — size comes from a type token applied to the semantically correct element.

### SEO per page

Each page sets its own `<title>` (`Page — Darya`; Home is `Darya — Software Developer`), a unique meta description, a canonical URL, and Open Graph plus Twitter card tags. Project pages derive all of these from front matter, and use their hero (or thumbnail) as the preview image. Every other page shares `og-image.png` in `public/`: the name and role on white, in the site's type. Designed per-project preview images are a later enhancement.

- **Canonical URLs end in a slash** (`/skills/`), because Astro builds each page as a folder with an `index.html` and the sitemap lists that form. The 404 has no canonical: it is served at every unknown URL and is `noindex`.
- **`robots.txt` is generated** by `src/pages/robots.txt.ts` from the configured `site`, so it can never point at an old origin.
- **The favicon and touch icon are placeholders** (a plain rounded square in the secondary ink) until Darya has a logo. `node scripts/generate-site-images.mjs` regenerates them and the preview image from the tokens and `site.config.ts`.
