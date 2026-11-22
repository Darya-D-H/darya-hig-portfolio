# Content Model

**Status:** Draft, awaiting approval

Content lives in Astro content collections — Markdown files with typed front matter, validated by Zod at build time. A typo in a field name fails the build rather than rendering an empty section, which is the entire reason for using collections over hardcoded arrays in a component.

Three collections: `projects`, `experience`, `skills`.

---

## 1. `projects`

One file per project at `src/content/projects/<slug>.md`. The filename is the slug and therefore the URL: `src/content/projects/invoice-tracker.md` → `/projects/invoice-tracker`.

### Schema

All three collections are declared in **`src/content.config.ts`** — a file at the root of `src/`, not inside `src/content/`. Astro's Content Layer moved it there, and the old `src/content/config.ts` location is no longer picked up. The content _files_ still live under `src/content/<collection>/`, because the `glob` loader takes an explicit `base`.

```ts
// src/content.config.ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod"; // Astro 7 ships Zod 4 here

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      // --- identity ---
      title: z.string().max(60),
      summary: z.string().max(140), // one line, used on cards and in meta description
      order: z.number().int().positive(), // explicit grid order, ascending
      featured: z.boolean().default(false), // exactly 3 must be true

      // --- optional meta strip ---
      year: z.string().optional(), // "2025" or "2024—2025"
      role: z.string().optional(), // "Solo developer", "Frontend"
      projectType: z.string().optional(), // eyebrow on the detail page

      // --- imagery ---
      thumbnail: image(), // 16:10, card image
      thumbnailAlt: z.string(), // required: no image without a description
      hero: image().optional(), // detail page banner; falls back to thumbnail
      heroAlt: z.string().optional(),

      // --- case study ---
      challenge: z.string(), // markdown-capable prose
      solution: z.string(),
      outcome: z.string(),

      // --- tech stack, grouped ---
      stack: z.object({
        language: z.array(z.string()).default([]),
        framework: z.array(z.string()).default([]),
        data: z.array(z.string()).default([]),
        tooling: z.array(z.string()).default([]),
      }),
      tags: z.array(z.string()).max(3), // the <=3 shown on the card

      // --- design system notes (section omitted entirely if absent) ---
      designSystem: z
        .object({
          notes: z.string(),
          palette: z
            .array(z.object({ name: z.string(), value: z.string() }))
            .optional(),
          typeSample: z.string().optional(),
        })
        .optional(),

      // --- gallery ---
      gallery: z
        .array(z.object({ src: image(), alt: z.string() }))
        .min(2)
        .max(6)
        .optional(),

      // --- external links (rendered only when present) ---
      links: z
        .object({
          live: z.url().optional(),
          source: z.url().optional(),
        })
        .default({}),

      draft: z.boolean().default(false), // excluded from production builds
    }),
});
```

### Schema decisions worth noting

**`image()` rather than `z.string()` for image paths.** The `image()` helper resolves the path at build time and hands the component an object carrying intrinsic width and height. That means every `<Image>` renders with explicit dimensions, which eliminates layout shift by construction rather than by remembering to type width and height by hand. A missing or misspelled file is a build error, not a broken image in production.

**`thumbnailAlt` is required, `heroAlt` is not.** The thumbnail is the card's only image and always needs a description. The hero image on the detail page is frequently the same screenshot shown larger, in which case repeating the alt text is noise for a screen reader — so `heroAlt` is optional and falls back to `thumbnailAlt`, and if the hero is genuinely decorative it can be set to `""`.

**`challenge`, `solution` and `outcome` are front matter fields, not the Markdown body.** This forces all three to exist — a project file cannot be committed with a solution and no outcome. The Markdown body is left free for any additional prose a particular project needs, rendered after the outcome section.

**`gallery` has `.min(2)`.** A one-image "gallery" with a lightbox is worse than a single inline image. If there is only one screenshot, it belongs as the hero.

**`stack` is grouped rather than a flat array.** A flat list of twelve technologies reads as a word cloud. Grouped by language / framework / data / tooling, a reader can scan for the one thing they care about.

**`order` rather than sorting by date.** Explained in [docs/01-information-architecture.md](01-information-architecture.md) §3: the newest project is rarely the best one, and a portfolio should lead with its strongest work.

**`order` values must be unique.** `order` drives the Projects grid, the featured row and the prev/next pair, so a tie would make neighbours ambiguous. `src/lib/projects.ts` throws at build time if two non-draft projects share an `order`, naming both files — the same approach as the featured invariant below.

### The `featured` invariant

Home shows exactly three featured projects. Rather than silently slicing the array, the Home page asserts:

```ts
const featured = (
  await getCollection("projects", ({ data }) => data.featured && !data.draft)
).sort((a, b) => a.data.order - b.data.order);

if (featured.length !== 3) {
  throw new Error(
    `Home expects exactly 3 featured projects, found ${featured.length}. ` +
      `Set featured: true on exactly three files in src/content/projects/.`,
  );
}
```

A loud build failure beats a layout that quietly renders two cards in a three-column grid.

### Example file

```markdown
---
title: "Invoice Tracker"
summary: "A small Laravel app for issuing and chasing invoices, built for a two-person studio."
order: 1
featured: true
year: "2025"
role: "Solo developer"
projectType: "Web application"
thumbnail: "../../assets/projects/invoice-tracker/card.png"
thumbnailAlt: "Invoice list screen showing five invoices with status badges"
hero: "../../assets/projects/invoice-tracker/hero.png"
tags: ["PHP", "Laravel", "MySQL"]
stack:
  language: ["PHP 8.3", "JavaScript"]
  framework: ["Laravel 11", "Blade", "Tailwind CSS"]
  data: ["MySQL", "Eloquent"]
  tooling: ["Vite", "Pest", "GitHub Actions"]
challenge: >
  TODO: The studio tracked invoices in a shared spreadsheet. Nobody could tell
  which invoices were overdue without reading every row, and two people editing
  at once regularly overwrote each other.
solution: >
  TODO: A single-purpose app with one list view, a status derived from the due
  date rather than typed by hand, and a weekly digest email. Describe one real
  decision and the reason behind it.
outcome: >
  TODO: Overdue invoices became visible at a glance. Quantify if you can —
  time saved per week, errors avoided, invoices chased on time.
designSystem:
  notes: >
    TODO: Notes on the type scale, spacing system and component set used,
    and anything you would do differently.
  palette:
    - { name: "Primary", value: "#1f6feb" }
    - { name: "Surface", value: "#ffffff" }
gallery:
  - {
      src: "../../assets/projects/invoice-tracker/list.png",
      alt: "Invoice list with status filters applied",
    }
  - {
      src: "../../assets/projects/invoice-tracker/detail.png",
      alt: "Single invoice detail view with payment history",
    }
links:
  live: "https://example.com"
  source: "https://github.com/example/invoice-tracker"
---

TODO: Optional extra prose for this project. Anything that does not fit the
challenge / solution / outcome structure goes here and renders after it.
```

---

## 2. `experience`

One file per role at `src/content/experience/<slug>.md`.

```ts
/** "2024-03": the precision a role date really has. */
const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM, for example 2024-03");

const experience = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/experience" }),
  schema: z.object({
    role: z.string(),
    company: z.string(),
    companyUrl: z.url().optional(),
    startDate: yearMonth, // "2024-03", for <time datetime>
    endDate: yearMonth.optional(), // absent means current
    location: z.string().optional(),
    bullets: z.array(z.string()).min(2).max(4),
    order: z.number().int().positive(),
  }),
});
```

**Dates are `YYYY-MM` strings, not `Date` objects.** A role that started in March 2024 did not start on 1 March at midnight; a `Date` invents a precision that does not exist and introduces timezone bugs where a role can appear to start a month early. The string is used directly in `<time datetime="2024-03">` and formatted for display separately.

**`endDate` absent means current**, which is cleaner than a `current: boolean` that can contradict an end date.

**`bullets` is capped at 4.** Four achievement lines per role is the limit of what gets read on a portfolio. Anything longer belongs on a CV.

### Example

```markdown
---
role: "TODO: Software Engineer"
company: "TODO: Company Name"
startDate: "2024-03"
location: "TODO: Remote"
bullets:
  - "TODO: Start with a verb and include a number where you honestly can."
  - "TODO: Name a technical decision you made and its effect."
  - "TODO: Something about collaboration, review, or mentoring."
order: 1
---
```

---

## 3. `skills`

One file per category at `src/content/skills/<slug>.md`. A data collection could be a single YAML file, but one file per category keeps the diff clean when a single category changes.

```ts
const skills = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/skills" }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    items: z.array(z.string()).min(1),
    order: z.number().int().positive(),
    showOnHome: z.boolean().default(true),
  }),
});
```

No proficiency levels, for the reasons given in [docs/01-information-architecture.md](01-information-architecture.md) §5.

### Placeholder categories

| File           | Name      | Items                                                         |
| -------------- | --------- | ------------------------------------------------------------- |
| `backend.md`   | Backend   | PHP, Laravel, MySQL, REST APIs, Composer                      |
| `frontend.md`  | Frontend  | JavaScript, TypeScript, HTML, CSS, Astro, Tailwind CSS        |
| `tooling.md`   | Tooling   | Git, GitHub Actions, Vite, npm, Docker                        |
| `practices.md` | Practices | Accessibility, responsive design, design systems, code review |

All marked `TODO` for Darya to confirm and expand.

---

## 4. Placeholder content plan

Six projects, varied deliberately so the templates are tested against realistic edge cases rather than six identical ideal records.

| #   | Slug                | Featured | Shape being tested                                                                                                               |
| --- | ------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `invoice-tracker`   | yes      | The complete record: every optional field populated, 4 gallery images, both links                                                |
| 2   | `component-library` | yes      | Has `designSystem` with a palette and type sample — the design-system section at full size                                       |
| 3   | `api-gateway`       | yes      | **No gallery, no live link.** Source link only. Tests that the gallery and link sections vanish cleanly rather than leaving gaps |
| 4   | `booking-widget`    | no       | **Long title and long summary**, at the 60- and 140-character limits, to test card clamping and heading wrap                     |
| 5   | `cli-toolkit`       | no       | **Minimum viable record**: no `year`, no `role`, no `designSystem`, 2 gallery images. Tests that the meta strip omits itself     |
| 6   | `portfolio-site`    | no       | This site, self-referentially. Tests a project whose live link points to the host site itself                                    |

Projects 3 and 5 are the important ones. A set of six fully-populated records will not reveal that an absent optional section leaves 100px of empty band behind it.

### Placeholder copy rules

- Every placeholder string begins with `TODO:` so it is greppable. `npm run check:todo` fails the build when `--prod` is set, which prevents placeholder text shipping by accident.
- Placeholder prose is realistic in **length and shape** — a real two-sentence challenge, not `Lorem ipsum dolor sit amet`. A layout judged against lorem ipsum looks fine and then breaks on real sentences with real word lengths.
- Alt text placeholders are written as real alt text, because writing good alt text is a skill and leaving `TODO: alt` teaches nothing about whether the pattern works.
- Placeholder images: generated flat-colour PNGs at the correct aspect ratios and realistic file sizes (roughly 200–400 KB before optimisation), so the performance budget is tested against something representative. A 2 KB placeholder makes the Lighthouse score meaningless.

---

## 5. Content conventions

| Rule                                                            | Reason                                                                                                               |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Slugs are lowercase kebab-case, and never change once published | A changed slug is a broken URL                                                                                       |
| `summary` is one sentence, under 140 characters                 | It is reused as the page's meta description, where longer text is truncated by search engines                        |
| `title` under 60 characters                                     | Longer titles wrap to three lines on a card at mobile width                                                          |
| Images live in `src/assets/projects/<slug>/`, not in `public/`  | Only `src/assets` goes through `astro:assets` optimisation; anything in `public/` is served unprocessed at full size |
| Alt text describes the content, not the medium                  | "Invoice list showing five overdue invoices", not "screenshot of the app"                                            |
| `draft: true` excludes a project from production                | Lets a half-written case study be committed without publishing it                                                    |

### Where SEO fields come from

| Meta                          | Source                                                          |
| ----------------------------- | --------------------------------------------------------------- |
| `<title>`                     | `title` + ` — Darya`                                            |
| `meta description`            | `summary`                                                       |
| `og:title` / `og:description` | Same                                                            |
| `og:image`                    | `hero` if present, else `thumbnail`, else the shared site image |
| canonical                     | Built from the site URL and the slug                            |

All derived, none hand-written per page, so they cannot drift out of sync with the content.
