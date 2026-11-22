# Build Roadmap

**Status:** Draft, awaiting approval

Eight phases. Each has a goal, ordered tasks with acceptance criteria and a verification step, and a gate that must pass before the next phase starts.

Ordering is by **dependency**, not by what is most interesting. Tokens come before components because a component built against hardcoded values has to be rebuilt. The build system comes before content because content needs somewhere to render. The temptation is to start with the hero section, which is the most visible and the most dependent on everything else.

No task touches more than about five files.

---

## Phase 0 — Documentation approval

**Goal:** agreement on what is being built before anything is built.

| #   | Task                                         | Acceptance                                        | Verify                                      |
| --- | -------------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| 0.1 | Darya reads the doc set                      | Every doc read                                    | —                                           |
| 0.2 | Resolve open questions 3 and 4 in the spec   | Social URLs and the Inter decision settled        | Spec updated — **both resolved 2026-11-21** |
| 0.3 | Confirm or correct placeholder content shape | Sitemap, skill categories and project list agreed | Docs updated                                |
| 0.4 | Approve or amend the token values            | Darya has seen the type scale and colour table    | Docs updated                                |
| 0.5 | Tag the approval                             | `git tag docs-approved`                           | `git tag -l`                                |

**Gate:** explicit approval. Nothing is installed before this.

---

## Phase 1 — Project foundation

**Goal:** a repo that builds, lints, type-checks and deploys nothing.

| #    | Task                                                                                                   | Acceptance                        | Verify                         |
| ---- | ------------------------------------------------------------------------------------------------------ | --------------------------------- | ------------------------------ |
| 1.1  | `npm create astro@latest`, minimal template, TypeScript strict                                         | `npm run dev` serves a blank page | Browser                        |
| 1.2  | Pin Node: `engines.node: ">=22.23.4"` plus `.nvmrc`                                                    | Both present                      | `node -v`                      |
| 1.3  | Install Tailwind v4 via `@tailwindcss/vite`, wire the plugin                                           | A utility class applies           | Browser                        |
| 1.4  | ESLint + `eslint-plugin-astro` + `jsx-a11y`                                                            | `npm run lint` passes clean       | Command                        |
| 1.5  | Prettier + astro and tailwindcss plugins                                                               | `npm run format:check` passes     | Command                        |
| 1.6  | Husky + lint-staged                                                                                    | A commit triggers the hook        | Test commit                    |
| 1.7  | `tsconfig.json` with the `@/*` → `src/*` alias                                                         | An aliased import resolves        | `npm run typecheck`            |
| 1.8  | All npm scripts from spec §4, including `verify`                                                       | Each runs                         | Run each                       |
| 1.9  | `.gitignore`, `README`, `astro.config.mjs` with `output: "static"`, placeholder `site`, **no adapter** | No platform config anywhere       | Inspect                        |
| 1.10 | CI workflow: `verify` on push and PR, **no deploy step**                                               | Green on a test PR                | GitHub Actions                 |
| 1.11 | Vitest and Playwright configured, one trivial test each                                                | Both suites run                   | `npm test`, `npm run test:e2e` |

**Gate:** `npm run verify` passes from a clean clone on Node 22. CI green.

---

## Phase 2 — Design tokens

**Goal:** every value from the token doc exists in CSS, and nothing is hardcoded thereafter.

| #    | Task                                                                                                                                             | Acceptance                                                                                                 | Verify                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 2.1  | `global.css`: `@import "tailwindcss"` and the colour tokens                                                                                      | Utilities like `bg-section` work                                                                           | Browser                                  |
| 2.2  | Type tokens with grouped line-height, weight and letter-spacing modifiers, in `rem`                                                              | `text-body` applies all four properties                                                                    | Devtools                                 |
| 2.3  | Responsive type overrides at the 735 and 1069 breakpoints in the base layer                                                                      | Sizes change at each breakpoint; no component carries a responsive type class                              | Resize                                   |
| 2.4  | Spacing, radius, shadow, z-index, sizing tokens                                                                                                  | All present                                                                                                | Devtools                                 |
| 2.5  | Breakpoints and container widths                                                                                                                 | `md:` and `lg:` fire at 735 and 1069                                                                       | Resize                                   |
| 2.6  | Motion tokens                                                                                                                                    | Present                                                                                                    | Devtools                                 |
| 2.7  | Base layer: reset, `scroll-margin-top` on focusable elements and headings, focus-visible ring, `prefers-reduced-motion` block, `.no-js` fallback | Each applies                                                                                               | Browser + keyboard                       |
| 2.8  | A throwaway `/_tokens` page rendering every token                                                                                                | Every colour, size and radius visible on one page                                                          | Visual review                            |
| 2.9  | Verify the token doc against the CSS, line by line                                                                                               | No token in the doc is missing, and none in the CSS is undocumented                                        | Manual diff                              |
| 2.10 | `scripts/contrast.mjs`, run over the final palette                                                                                               | Output matches the doc's ratio table                                                                       | `node scripts/contrast.mjs`              |
| 2.11 | `npm run check:tokens` script                                                                                                                    | Fails on a deliberately planted `text-[23px]`                                                              | Command                                  |
| 2.12 | Inter via Astro's Fonts API from `@fontsource-variable/inter`, `<Font />` in `BaseLayout` **without** `preload`, stack order per the token doc   | Linux browsers render Inter; no font preload in the HTML; the Inter file size is recorded in the token doc | Devtools Network panel + `fonts.spec.ts` |

**Gate:** the `/_tokens` page shows the full system; contrast output matches the doc; `check:tokens` works. Delete `/_tokens` before Phase 7.

---

## Phase 3 — Layout shell and primitives

**Goal:** chrome and primitives that every page will use. No page content yet.

| #    | Task                                                                                                                                 | Acceptance                                                                   | Verify                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------- |
| 3.1  | `Container`, `Section`                                                                                                               | `tone`, `width`, `padding`, `labelledBy` all work; bands alternate correctly | Browser                    |
| 3.2  | `BaseLayout`: head, meta, viewport with `viewport-fit=cover`, skip link, `#main` with `tabindex="-1"`                                | Skip link is first in tab order and works                                    | Keyboard                   |
| 3.3  | `Nav`, desktop: 44px, sticky, translucent with `-webkit-backdrop-filter` first, `@supports` fallback, `aria-current`, 44px hit areas | Renders; blur works in Safari; fallback applies when disabled                | Safari + devtools          |
| 3.4  | Nav scroll shadow                                                                                                                    | Hairline appears once scrolled                                               | Browser                    |
| 3.5  | Safe-area insets on nav and footer                                                                                                   | Correct on a notched device or simulator                                     | Device                     |
| 3.6  | `MobileMenu` + `lib/menu.ts`: trigger, panel, focus trap, focus return, `Escape`, inert background, scroll lock, resize-closes       | Every row of the spec's behaviour table                                      | `mobile-menu.spec.ts`      |
| 3.7  | `Footer` with its own `aria-label` and `BackToTop`                                                                                   | Renders; back-to-top works without JS                                        | Browser, JS off            |
| 3.8  | `Button`: three variants, every state                                                                                                | All states visible; `<a>` vs `<button>` correct by `href`                    | `/_tokens` page            |
| 3.9  | `TextLink`, underlined in prose, not when standalone                                                                                 | Both cases correct                                                           | Browser                    |
| 3.10 | `Card`: both tones, stretched-`::after` link pattern, `:focus-within` ring                                                           | Whole card clickable; accessible name is the title alone                     | VoiceOver                  |
| 3.11 | `Tag`, `Eyebrow`, `Divider`                                                                                                          | Render; eyebrow is a `<p>`, not a heading                                    | Inspect                    |
| 3.12 | `Reveal` + `lib/reveal.ts`: once-only, stagger capped at 5, reduced-motion, `.no-js`                                                 | All four behaviours                                                          | `reveal.spec.ts`           |
| 3.13 | `<ClientRouter />`, nav and footer persisted, all three `init()` calls bound to `astro:page-load` and idempotent                     | Reveal and menu work after a client-side navigation                          | `view-transitions.spec.ts` |

**Gate:** keyboard pass on the shell; menu E2E green; reveal works after a view transition; axe clean on a page with just the shell.

**Why 3.13 is in this phase:** the "reveal stops working after navigation" bug is invisible on a hard reload and gets found late. Wiring `astro:page-load` before any real page exists means every page inherits correct behaviour.

---

## Phase 4 — Content model

**Goal:** typed content with realistic placeholders, rendering nowhere yet.

| #    | Task                                                                                 | Acceptance                                             | Verify             |
| ---- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------ |
| 4.1  | `src/content.config.ts` with all three collections (**not** `src/content/config.ts`) | `astro check` sees the types                           | Typecheck          |
| 4.2  | Placeholder images at correct ratios and realistic weights                           | Six projects' thumbnails, heroes and galleries present | File sizes         |
| 4.3  | Projects 1 and 2: fully populated                                                    | Validate                                               | `astro build`      |
| 4.4  | Project 3: no gallery, no live link                                                  | Validates; optional fields absent                      | Build              |
| 4.5  | Project 4: title and summary at the length limits                                    | Validates at exactly 60 and 140 characters             | Build              |
| 4.6  | Project 5: minimum viable record                                                     | Validates with everything optional omitted             | Build              |
| 4.7  | Project 6: self-referential                                                          | Validates                                              | Build              |
| 4.8  | Experience entries, two or three roles                                               | Validate; one with no `endDate`                        | Build              |
| 4.9  | Four skill categories                                                                | Validate                                               | Build              |
| 4.10 | Deliberately break a field, confirm the build fails usefully                         | Error names the file and the field                     | Build, then revert |
| 4.11 | `npm run check:todo`                                                                 | Fails with `--prod` while placeholders exist           | Command            |

**Gate:** build succeeds; a schema violation fails loudly; task 4.10 proved the validation is real.

---

## Phase 5 — Pages

**Goal:** all six page types rendering real placeholder content.

Ordered simplest-first so the patterns are established on easy pages before the hard ones.

| #     | Task                                                                                                                                                           | Acceptance                                                  | Verify                                             |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| 5.0   | `src/site.config.ts` with name, email, and the GitHub and LinkedIn URLs                                                                                        | Typed export; nothing else in `src/` contains either URL    | `grep -r linkedin.com src/` returns only this file |
| 5.1   | `ErrorPage` + `404.astro`: message h1, `Go to Home ›` text link, `Error 404` caption in secondary ink, `noindex`                                               | Renders with nav and footer; matches IA §8                  | Browser, `content.spec.ts`                         |
| 5.2   | `contact.astro`: eyebrow, h1, body, mailto button, social links with new-tab announcement                                                                      | Renders; mailto opens a client                              | Browser, VoiceOver                                 |
| 5.3   | `skills.astro`: page header + four category cards, staggered                                                                                                   | Renders; stagger caps correctly                             | Browser                                            |
| 5.4   | `Timeline` + `TimelineNode`, desktop                                                                                                                           | `<ol>`, `<article>`, `<time>`; line and dots decorative     | VoiceOver                                          |
| 5.5   | Timeline at ≤734px — same component, adjusted offsets                                                                                                          | No separate mobile component                                | Resize                                             |
| 5.6   | `experience.astro`                                                                                                                                             | Renders all roles, newest first                             | Browser                                            |
| 5.7   | `ProjectCard`                                                                                                                                                  | Clamped summary, ≤3 tags, missing-thumbnail fallback        | Browser                                            |
| 5.8   | `ProjectGrid`, 3/2/1 columns                                                                                                                                   | Correct at each breakpoint                                  | Resize                                             |
| 5.9   | `projects/index.astro`                                                                                                                                         | All six cards                                               | Browser                                            |
| 5.10  | `Gallery` + `Lightbox` + `lib/lightbox.ts` using native `<dialog>`                                                                                             | Every row of the lightbox spec                              | `lightbox.spec.ts`                                 |
| 5.11  | `ProjectLayout` + `[slug].astro`: back link, header, meta strip, hero, challenge/solution/outcome, stack, design system, gallery, links, prev/next, footer CTA | All eleven sections in order                                | Browser                                            |
| 5.11a | `src/lib/projects.ts` (`getAdjacent`, unique-`order` check) + `ProjectPager`                                                                                   | First and last projects show one link each; unit tests pass | `npm test`, browser                                |
| 5.12  | Verify optional sections omit cleanly on projects 3 and 5                                                                                                      | No empty bands, no stray dividers                           | `content.spec.ts`                                  |
| 5.13  | `Hero`: no reveal, renders at final state                                                                                                                      | Full opacity on load                                        | `reveal.spec.ts`                                   |
| 5.14  | `AboutSection`                                                                                                                                                 | Two columns desktop, stacked mobile                         | Resize                                             |
| 5.15  | `FeaturedProjects` with the exactly-three assertion                                                                                                            | Build fails at two or four featured                         | Toggle a flag, build                               |
| 5.16  | `SkillsGrid` teaser on Home                                                                                                                                    | Renders; `All skills ›` links out                           | Browser                                            |
| 5.17  | `index.astro` assembling all four sections                                                                                                                     | Band sequence white → grey → white → grey                   | Browser                                            |
| 5.18  | `lib/seo.ts` + per-page meta, canonical, OG, Twitter                                                                                                           | Unique title and description per page                       | View source                                        |
| 5.19  | `@astrojs/sitemap`, `robots.txt`, favicons, `apple-touch-icon`, `og-image.png`                                                                                 | `sitemap-index.xml` lists all pages                         | Build output                                       |

**Gate:** every page renders; `content.spec.ts` and `lightbox.spec.ts` green; no horizontal scroll at any viewport.

---

## Phase 6 — Verification and polish

**Goal:** meet every success criterion in the spec.

| #    | Task                                                         | Acceptance                                                          | Verify                |
| ---- | ------------------------------------------------------------ | ------------------------------------------------------------------- | --------------------- |
| 6.1  | Write the full E2E suite per the test plan                   | All specs exist and pass                                            | `npm run test:e2e`    |
| 6.2  | `a11y.spec.ts`, including menu-open and lightbox-open states | Zero violations                                                     | `npm run test:a11y`   |
| 6.3  | Unit tests for all four `lib/` modules, edge cases included  | Pass                                                                | `npm test`            |
| 6.4  | Visual baselines at four widths, generated in CI             | Committed, stable across two runs                                   | `npm run test:visual` |
| 6.5  | Lighthouse CI wired with budgets                             | Every budget met                                                    | CI                    |
| 6.6  | Keyboard-only pass, all pages                                | Ring always visible, never clipped by the nav; focus always returns | Manual                |
| 6.7  | VoiceOver pass, macOS and iOS                                | Heading outline sensible; links list clean                          | Manual                |
| 6.8  | Reduced-motion pass                                          | Nothing moves; everything visible; hover/focus colour intact        | Manual                |
| 6.9  | 200% zoom, 400% reflow, 20px default font size               | No clipping, overlap or horizontal scroll                           | Manual                |
| 6.10 | Text-spacing override pass                                   | No content lost                                                     | Bookmarklet           |
| 6.11 | Physical iPhone, Safari                                      | Safe areas, blur performance, momentum scroll, menu feel            | Device                |
| 6.12 | Non-Apple platform typography check                          | Tracking reads correctly on Segoe UI / Roboto                       | Device                |
| 6.13 | Image optimisation review                                    | No oversized images; AVIF/WebP served                               | Network panel         |
| 6.14 | Delete `/_tokens`                                            | Gone from the build                                                 | Build output          |
| 6.15 | Write `docs/accessibility-report.md`                         | Date, tools, AT versions, findings, exceptions                      | Review                |

**Gate:** every item in the spec's success criteria is demonstrably true.

---

## Phase 7 — Hosting and deploy

**Goal:** live.

| #   | Task                                                                            | Acceptance                                 | Verify         |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------ | -------------- |
| 7.1 | Choose the host (spec open question 1)                                          | Decided; ADR-0005 updated                  | Doc            |
| 7.2 | Decide custom domain vs platform subdomain                                      | Decided                                    | Doc            |
| 7.3 | **Resolve `base`.** Subpath hosting needs it set; root hosting must not have it | Correct for the chosen host                | Deployed site  |
| 7.4 | Set the real `site` value                                                       | Canonical URLs and sitemap correct         | View source    |
| 7.5 | Add the deploy step to CI                                                       | `main` deploys                             | GitHub Actions |
| 7.6 | Re-run the **full** verification against the deployed URL                       | Everything that passed locally passes live | All suites     |
| 7.7 | Verify no mixed content and TLS is valid                                        | Clean console                              | Browser        |
| 7.8 | Tag `v1.0`                                                                      | Tag pushed                                 | `git tag -l`   |

**Gate:** live site passes the complete release checklist in [docs/07-test-plan.md](07-test-plan.md) §9.

**Task 7.3 is the risky one.** The `base`-path mismatch does not appear in local development and breaks every link and image on the deployed site. It gets its own verification against the real URL.

---

## Phase 8 — Real content

**Goal:** replace every placeholder.

| #    | Task                                                        | Acceptance                                                | Verify              |
| ---- | ----------------------------------------------------------- | --------------------------------------------------------- | ------------------- |
| 8.1  | Hero and about copy                                         | No `TODO:`                                                | `check:todo --prod` |
| 8.2  | Real project screenshots, optimised                         | No placeholder images                                     | Visual              |
| 8.3  | Real case studies: challenge, solution, outcome per project | Written; outcomes quantified where honest                 | Read                |
| 8.4  | Real tech stacks and design-system notes                    | Accurate                                                  | Read                |
| 8.5  | Real alt text on every image                                | Describes content, not medium                             | VoiceOver           |
| 8.6  | Real experience entries                                     | Accurate dates and bullets                                | Read                |
| 8.7  | Confirmed skill categories                                  | Accurate                                                  | Read                |
| 8.8  | Contact details                                             | Email, GitHub and LinkedIn all open the right destination | Click each          |
| 8.9  | Re-run the full release checklist                           | All green                                                 | All suites          |
| 8.10 | Tag `v1.1`                                                  | Tag pushed                                                | `git tag -l`        |

**Gate:** `npm run check:todo --prod` passes. No placeholder text is public.

---

## Risks

| Risk                                                     | Likelihood          | Impact             | Mitigation                                                                 |
| -------------------------------------------------------- | ------------------- | ------------------ | -------------------------------------------------------------------------- |
| `base`-path mismatch breaks the deployed site            | Medium              | High               | Task 7.3 with live verification; root-relative links throughout            |
| Placeholder copy ships                                   | Medium              | High               | `check:todo --prod` in the release checklist                               |
| Hardcoded values creep in past the tokens                | High                | Medium             | `check:tokens` in CI, plus review                                          |
| Reveal breaks after a view transition                    | High if unaddressed | Medium             | Wired in Phase 3.13, tested in `view-transitions.spec.ts`                  |
| Focus ring hidden behind the sticky nav                  | High                | High (WCAG 2.4.11) | `scroll-margin-top` in Phase 2.7; keyboard pass in 6.6                     |
| Visual regression suite becomes flaky and gets abandoned | Medium              | Low                | Animations disabled, reveals forced, fixed images, CI-generated baselines  |
| Image weight blows the performance budget                | Medium              | Medium             | Realistic placeholder sizes from Phase 4; `astro:assets`; Lighthouse in CI |
| `backdrop-filter` janks on older phones                  | Low                 | Medium             | Real-device test in 6.11; reduce blur radius if needed                     |
| Docs drift from the code                                 | Medium              | Medium             | Docs land in the same commit as behaviour changes                          |
| "Decide later" on hosting never gets decided             | Medium              | Medium             | Phase 7 is a gate, not optional                                            |

---

## What can run in parallel

Little of it, honestly — the dependency chain is mostly linear. The real opportunities:

- Phase 4 (content model) is independent of Phase 3 (layout shell) and can be done alongside it.
- Within Phase 5, pages 5.1 to 5.6 are independent of 5.7 to 5.12.
- Phase 6's test authoring can begin as soon as the matching page exists.
- Phase 8's copywriting can happen any time after Phase 0 — it needs no code at all, and it is the task most likely to become the bottleneck. Starting it early is the single best scheduling decision available.
