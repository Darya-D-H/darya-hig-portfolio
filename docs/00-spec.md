# Spec: darya-hig-portfolio

**Status:** Draft, awaiting approval
**Owner:** Darya
**Last updated:** 2026-11-20

---

## 1. Objective

Build a static personal portfolio that presents Darya — a software engineer working in PHP and web development — to recruiters and hiring managers, using Apple's Human Interface Guidelines and the visual language of apple.com as the design reference.

**Primary user:** a recruiter or engineering manager, on a phone or laptop, who has somewhere between 30 seconds and 3 minutes. They want to know, in order: what Darya does, whether the work looks competent, what the tech stack is, and how to get in touch.

**Secondary user:** an engineer evaluating the code itself. The repo should read as evidence of craft.

**Success looks like:**

- A visitor can tell what Darya does within 5 seconds of the hero loading.
- Any project's detail page is reachable in two clicks from the landing page.
- The site is indistinguishable from a careful Apple-style product page in its spacing, type rhythm, and restraint — without copying Apple's content or assets.
- Lighthouse 95+ on all four categories, mobile profile.
- Zero WCAG 2.2 AA violations in automated and manual checks.

### Non-goals (v1)

- Dark mode (tokens are structured so it can be added later without refactoring)
- A blog, an RSS feed, or a CMS
- A downloadable resume
- A contact form, server, or database
- Internationalisation
- Analytics

---

## 2. Assumptions

These were confirmed during planning. If any is wrong, the spec changes before code is written.

1. Fully static output. No SSR, no API routes, no backend.
2. Hosting is undecided, so the build stays host-agnostic: a plain `dist/` folder of static files with no platform-specific adapters. A GitHub Actions workflow is written but kept inert until a host is chosen ([ADR-0005](adr/ADR-0005-defer-hosting-decision.md)).
3. Modern evergreen browsers only. Last two versions of Safari, Chrome, Firefox and Edge. No IE, no legacy Android WebView.
4. Mobile-first implementation, with breakpoints modelled on apple.com.
5. Content is realistic placeholder text marked `TODO`, which Darya replaces. Six placeholder projects.
6. Light theme only, using the colours specified: sections `rgb(245,245,247)`, cards `rgb(255,255,255)`, accent `#0071e3`.
7. No Apple intellectual property is reproduced: no SF Pro font files served, no Apple logos, product renders, marketing copy, or SF Symbols glyphs.

---

## 3. Tech stack

| Layer         | Choice                                                                                                    | Version                     | Rationale                                                                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | Astro                                                                                                     | 7.x                         | Ships zero JavaScript by default, static output, components, content collections, built-in view transitions. See [ADR-0001](adr/ADR-0001-astro-as-framework.md)      |
| Styling       | Tailwind CSS                                                                                              | 4.x via `@tailwindcss/vite` | Tokens live in a CSS-native `@theme` block. See [ADR-0002](adr/ADR-0002-tailwind-v4-tokens.md)                                                                       |
| Language      | TypeScript                                                                                                | 6.0.x, strict mode          | Typed content schemas and component props. Pinned below 7 because `@astrojs/check` and `typescript-eslint` do not support TypeScript 7 yet                           |
| Content       | Astro content collections                                                                                 | built in                    | One Markdown file per project, validated by a Zod schema. See [ADR-0004](adr/ADR-0004-project-detail-pages-via-content-collections.md)                               |
| Images        | `astro:assets` + `sharp`                                                                                  | 0.35.x                      | Automatic responsive `srcset`, AVIF/WebP, intrinsic sizing to prevent layout shift                                                                                   |
| Fallback font | Inter via Astro's Fonts API (`fontProviders.local()`, reading the file from `@fontsource-variable/inter`) | 5.3.x                       | Served from this site to visitors without SF Pro; Apple visitors never download it. Never preloaded. See [ADR-0003](adr/ADR-0003-typography-and-sf-pro-licensing.md) |
| Interactivity | Vanilla TypeScript                                                                                        | —                           | Mobile menu, scroll reveal, lightbox. No React, Vue or Svelte island is needed                                                                                       |
| Lint          | ESLint + `eslint-plugin-astro` + `eslint-plugin-jsx-a11y`                                                 | latest                      | Catches a11y mistakes in markup                                                                                                                                      |
| Format        | Prettier + `prettier-plugin-astro` + `prettier-plugin-tailwindcss`                                        | latest                      | Consistent class ordering                                                                                                                                            |
| Unit tests    | Vitest                                                                                                    | latest                      | For the few pure functions (slug helpers, reveal utilities)                                                                                                          |
| E2E / a11y    | Playwright + `@axe-core/playwright`                                                                       | latest                      | Keyboard paths, menu behaviour, automated a11y scan per page                                                                                                         |
| Node types    | `@types/node`                                                                                             | 22.x                        | Types for the Node-side config, tests and scripts. Each such file references them itself, so code in `src/` never sees Node globals                                  |
| Sitemap       | `@astrojs/sitemap`                                                                                        | 3.x                         | SEO                                                                                                                                                                  |

**Environment requirement:** Astro 7 requires Node.js 22.23.4 or newer. The repo pins this in `package.json` `engines` (`>=22.23.4`, Astro's own floor) and in `.nvmrc` (`22`).

### Browser support

Supported: **the last two major versions** of Safari on macOS, Safari on iOS/iPadOS, Chrome, Edge and Firefox. "Supported" means it is tested in the Playwright matrix ([docs/07-test-plan.md](07-test-plan.md) §4) and any visual or functional defect there is a bug.

Older browsers are not blocked. They get a page that works and reads correctly, and may lose polish. Tailwind v4's own floor (Safari 16.4, Chrome 111, Firefox 128) sits well below this policy, so the two never conflict.

That floor is also the CSS build target (`vite.build.cssTarget` in `astro.config.mjs`). Astro's default target is `esnext`, which tells the minifier no browser needs a prefix, and it then strips `-webkit-backdrop-filter`, which Safari before 18 needs for the nav material.

Features with a defined fallback rather than an assumption of support:

| Feature                          | Without it                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `backdrop-filter` (nav material) | Opaque nav background via `@supports` — [docs/02-design-tokens.md](02-design-tokens.md)                      |
| View Transition API              | `<ClientRouter />` uses its built-in fallback; navigation still works                                        |
| `IntersectionObserver`           | Every reveal element is shown immediately — [docs/04-motion.md](04-motion.md)                                |
| JavaScript entirely              | All content visible; lightbox thumbnails link to the full image; mobile menu falls back to a plain link list |

### Astro 7 notes that affect how we write code

Astro 7 moved to a Rust compiler and Vite 8. Three consequences matter here:

- **Markup must be valid.** Unclosed tags are now errors rather than silently repaired. This is a benefit for a site that must be semantically clean anyway.
- **`compressHTML` defaults to `'jsx'`**, so whitespace between inline elements collapses the way it does in React. Where a literal space between two inline elements matters, write `{" "}` explicitly. This is a real source of subtle visual bugs, so it goes in the review checklist.
- **Markdown renders through Sätteri by default**, and `@astrojs/markdown-remark` is no longer installed automatically. If we ever need a remark or rehype plugin, we install that package and opt into `unified()` deliberately. For v1 we do not need one.
- `Astro.glob()` is gone; use `getCollection()` for content and `import.meta.glob()` for anything else.

---

## 4. Commands

```bash
# install (Node 22+ required)
npm install

# development server on http://localhost:4321
npm run dev

# production build to ./dist
npm run build

# preview the production build locally
npm run preview

# type checking, including .astro files
npm run typecheck          # astro check && tsc --noEmit

# linting
npm run lint               # eslint .
npm run lint:fix           # eslint . --fix

# formatting
npm run format             # prettier --write .
npm run format:check       # prettier --check .

# unit tests
npm run test               # vitest run
npm run test:watch         # vitest

# end-to-end and accessibility
npm run test:e2e           # playwright test
npm run test:a11y          # playwright test --grep @a11y

# everything CI runs, in order
npm run verify             # format:check && lint && typecheck && test && build

# no arbitrary or raw values in src/ (also run in CI)
npm run check:tokens
```

`npm run verify` is the single gate. If it passes, the change is committable.

---

## 5. Project structure

```
darya-hig-portfolio/
├── docs/                          # this documentation set (committed, kept current)
│   └── adr/                       # architecture decision records
├── public/                        # copied verbatim to dist; favicons and og image (robots.txt is src/pages/robots.txt.ts)
├── src/
│   ├── assets/                    # images processed by astro:assets
│   │   └── projects/<slug>/       # per-project screenshots
│   ├── components/
│   │   ├── layout/                # Nav, MobileMenu, Footer, Container, Section
│   │   ├── ui/                    # Button, Card, Tag, Eyebrow, Divider, Reveal
│   │   └── sections/              # Hero, AboutSection, FeaturedProjects, SkillsGrid,
│   │                              # Timeline, ContactPanel, Gallery, ProjectMeta, ProjectPager, ErrorPage
│   ├── content.config.ts          # collection schemas (Zod) — note: src/ root, not src/content/
│   ├── site.config.ts             # name, email, GitHub and LinkedIn URLs — the only place they are written
│   ├── content/
│   │   ├── projects/              # 6 markdown files, one per project
│   │   ├── experience/            # one markdown file per role
│   │   └── skills/                # skill category data
│   ├── layouts/
│   │   ├── BaseLayout.astro       # <head>, nav, footer, view transitions, skip link
│   │   └── ProjectLayout.astro    # project detail page chrome
│   ├── lib/
│   │   ├── reveal.ts              # IntersectionObserver scroll reveal
│   │   ├── menu.ts                # mobile menu open/close + focus trap
│   │   ├── lightbox.ts            # gallery lightbox
│   │   ├── projects.ts            # build-time only: sorting, featured and prev/next helpers
│   │   └── seo.ts                 # title/description/og helpers
│   ├── pages/
│   │   ├── index.astro            # Home
│   │   ├── projects/
│   │   │   ├── index.astro        # Projects grid
│   │   │   └── [slug].astro       # Project detail
│   │   ├── skills.astro
│   │   ├── experience.astro
│   │   ├── contact.astro
│   │   └── 404.astro
│   └── styles/
│       └── global.css             # @import "tailwindcss" + @theme tokens + base layer
├── tests/
│   ├── unit/                      # Vitest
│   └── e2e/                       # Playwright specs, including a11y scans
├── .github/workflows/ci.yml       # verify on push and PR
├── LICENSE                        # MIT — covers code only; content is reserved (see README)
├── astro.config.mjs
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── .nvmrc
└── package.json
```

**Rules about where things go:**

- A component that renders a whole band of the page goes in `components/sections/`. A reusable primitive goes in `components/ui/`. Page chrome goes in `components/layout/`.
- No component reaches into another component's folder for styles. Shared values come from tokens only.
- Nothing in `src/lib/` touches the DOM at import time; each module exports an `init()` that a page calls.

---

## 6. Code style

One real example beats a paragraph. This is the house style for a section component:

```astro
---
// src/components/sections/SkillsGrid.astro
import Section from "@/components/layout/Section.astro";
import Card from "@/components/ui/Card.astro";
import Tag from "@/components/ui/Tag.astro";
import Reveal from "@/components/ui/Reveal.astro";
import { staggerDelay } from "@/lib/reveal";
import type { SkillCategory } from "@/content/config";

interface Props {
  /** Rendered as the section's h2. */
  heading: string;
  categories: SkillCategory[];
  /** Tints the band; defaults to the light grey used between white bands. */
  tone?: "grey" | "white";
}

const { heading, categories, tone = "grey" } = Astro.props;
---

<Section tone={tone} labelledBy="skills-heading">
  <h2 id="skills-heading" class="text-headline text-text-primary">
    {heading}
  </h2>

  <ul class="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {categories.map((category, index) => (
      <li>
        <Reveal delay={staggerDelay(index)}>
          <Card>
            <h3 class="text-card-title text-text-primary">{category.name}</h3>
            <ul class="mt-4 flex flex-wrap gap-2">
              {category.items.map((item) => (
                <li>
                  <Tag>{item}</Tag>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </li>
    ))}
  </ul>
</Section>
```

### Conventions

- **Components:** `PascalCase.astro`. One component per file. Props declared as a named `interface Props` with a doc comment on anything non-obvious.
- **Modules:** `camelCase.ts`. Named exports only; no default exports outside of `.astro` pages.
- **Types:** `PascalCase`. Content types are inferred from the Zod schema and re-exported, never hand-duplicated.
- **CSS classes:** Tailwind utilities in markup. Semantic token names (`text-headline`, `bg-surface-sunken`, `rounded-card`) rather than raw values. A raw value such as `text-[23px]` in a component is a bug: it means a token is missing.
- **Order of Tailwind classes:** enforced by `prettier-plugin-tailwindcss`. Never hand-sort.
- **Paths:** `@/` alias for `src/`. No `../../..` chains.
- **Accessibility in markup:** every section has an accessible name; every interactive element is a real `<button>` or `<a>`; lists of things are real lists.
- **No `!important`.** If specificity is fighting you, the token or component boundary is wrong.
- **Comments explain why, not what.** A comment restating the code gets deleted in review.

---

## 7. Testing strategy

Full detail in [docs/07-test-plan.md](07-test-plan.md). Summary:

| Level               | Tool                   | Lives in                   | Covers                                                                           |
| ------------------- | ---------------------- | -------------------------- | -------------------------------------------------------------------------------- |
| Types               | `astro check`, `tsc`   | —                          | Props, content schema conformance                                                |
| Lint                | ESLint                 | —                          | Code smells, markup a11y rules                                                   |
| Unit                | Vitest                 | `tests/unit/`              | Pure helpers: slug formatting, reveal threshold maths, SEO string building       |
| Component behaviour | Playwright             | `tests/e2e/`               | Mobile menu open/close/focus trap, lightbox keyboard handling, reveal fires once |
| Accessibility       | Playwright + axe-core  | `tests/e2e/a11y.spec.ts`   | Automated scan on all 6 page types, tagged `@a11y`                               |
| Visual              | Playwright screenshots | `tests/e2e/visual.spec.ts` | Each page at 1440, 1068, 734, 375 widths                                         |
| Performance         | Lighthouse CI          | CI                         | Budgets from the spec below                                                      |
| Manual              | Checklist              | `docs/07-test-plan.md`     | Real-device Safari iOS, keyboard-only pass, VoiceOver pass, reduced-motion pass  |

**Coverage expectation:** there is very little pure logic in a static site, so a line-coverage percentage would be a vanity metric. Instead the rule is: every module in `src/lib/` has unit tests for its edge cases, and every interactive component has an E2E test for its keyboard path.

### Performance budgets

Measured by Lighthouse CI on the mobile profile against the built site:

| Metric                     | Budget                    |
| -------------------------- | ------------------------- |
| Performance score          | ≥ 95                      |
| Accessibility score        | 100                       |
| Best practices             | ≥ 95                      |
| SEO                        | ≥ 95                      |
| LCP                        | < 2.0s                    |
| CLS                        | < 0.05                    |
| Total JS shipped (gzipped) | < 15 KB                   |
| Largest single page weight | < 500 KB including images |

A page that cannot hit the JS budget is a design problem, not a budget problem.

---

## 8. Boundaries

### Always

- Run `npm run verify` before every commit.
- Use a design token for every colour, size, radius, duration and easing.
- Give every interactive element a visible focus state and a keyboard path.
- Wrap every scroll-triggered animation in a reduced-motion guard.
- Write real `alt` text for content images, and `alt=""` for decorative ones.
- Keep commits atomic and conventionally prefixed (see [docs/08-git-workflow.md](08-git-workflow.md)).
- Update the relevant doc in the same commit as the code that changes its meaning.

### Ask first

- Adding any npm dependency beyond those listed in section 3.
- Adding a UI framework or an animation library.
- Changing a design token's value, since tokens cascade everywhere.
- Changing the sitemap or a page's section order.
- Adding a page or a content collection.
- Anything that ships JavaScript to the client beyond the three listed modules.
- Choosing the host, or adding a host-specific adapter or config.

### Never

- Serve SF Pro, SF Compact, SF Mono or New York font files from this site.
- Use Apple logos, product images, SF Symbols artwork, or copy lifted from apple.com.
- Commit secrets, `.env` files, or `node_modules/`.
- Commit build output.
- Disable an accessibility lint rule to make a build pass.
- Use a raw hex, px or ms value in a component when a token exists.
- Hide content from screen readers that sighted users can see.
- Force-push to `main`.

---

## 9. Success criteria

The build is done when all of these are true and demonstrable:

1. All six page types render with placeholder content: Home, Projects index, Project detail, Skills, Experience, Contact. Plus a 404 built from `ErrorPage`.
2. `npm run verify` passes from a clean clone on Node 22.
3. Lighthouse mobile meets every budget in section 7.
4. `npm run test:a11y` reports zero violations across all pages.
5. A keyboard-only pass reaches every link, button, menu item and lightbox control, in a sensible order, with a visible focus ring throughout, and nothing becomes a keyboard trap.
6. With `prefers-reduced-motion: reduce` set, no element animates position, scale or opacity on scroll, and all content is visible.
7. At 375px, 734px, 1068px and 1440px there is no horizontal scroll and no overlapping text.
8. Every design token in [docs/02-design-tokens.md](02-design-tokens.md) exists in `global.css`, and no component contains an arbitrary value.
9. Six project Markdown files validate against the schema, and each produces a detail page reachable from the Projects grid.
10. Each doc in `/docs` describes what the code actually does.

---

## 10. Open questions

These do not block the documentation phase, but need answers before the phases they affect.

| #   | Question                                | Blocks              | Default if unanswered                          |
| --- | --------------------------------------- | ------------------- | ---------------------------------------------- |
| 1   | Which host?                             | Phase 7, deployment | Build stays host-agnostic; nothing is deployed |
| 2   | Custom domain, or a platform subdomain? | Phase 7             | Platform subdomain                             |

### Resolved

| #   | Question                          | Decision                                                                                                                                                                      | Recorded in                                                                                                              |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 3   | GitHub, LinkedIn and email        | `https://github.com/Darya-D-H` and `https://www.linkedin.com/in/darya-dler-hussein`, plus email `darya.dler.contact@gmail.com`, all held in `src/site.config.ts` (2026-11-21) | [docs/01-information-architecture.md](01-information-architecture.md) §7                                                 |
| 4   | Non-Apple fallback typeface       | Self-host Inter, loaded only where SF Pro is unavailable, never preloaded (2026-11-21)                                                                                        | [ADR-0003](adr/ADR-0003-typography-and-sf-pro-licensing.md), [docs/02-design-tokens.md](02-design-tokens.md) §2          |
| 5   | Prev/next on project detail pages | Yes, following grid order, no wraparound (2026-11-21)                                                                                                                         | [docs/01-information-architecture.md](01-information-architecture.md) §4, [docs/03-components.md](03-components.md) §4.5 |
| 7   | Browser support                   | Last two major versions of Safari, iOS Safari, Chrome, Edge, Firefox (2026-11-21)                                                                                             | §3 above                                                                                                                 |
| 6   | Error page copy                   | Plain-language message as the h1, a blue `Go to Home ›` text link (not a button), and the status code small in secondary ink at the bottom (2026-11-21)                       | [docs/01-information-architecture.md](01-information-architecture.md) §8                                                 |
| 8   | Repository licence                | MIT for code; written content and images all rights reserved (2026-11-21)                                                                                                     | `LICENSE`, `README.md`                                                                                                   |
