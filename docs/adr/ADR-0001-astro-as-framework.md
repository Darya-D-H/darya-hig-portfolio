# ADR-0001: Astro as the framework

**Status:** Accepted
**Date:** 2026-11-20
**Deciders:** Darya

---

## Context

The portfolio is a five-page site with no backend, no authentication, and no data that changes after build. Its content is a handful of Markdown records and some prose. Its audience is recruiters, often on a phone, often on a mediocre connection, who will leave if it is slow.

The constraints that matter:

- Static output, deployable anywhere, with no server to run or pay for.
- Minimal JavaScript. The design needs three small behaviours (mobile menu, scroll reveal, lightbox) and nothing else.
- Component reuse, because the same card appears on Home and on the Projects page, and the same section band appears a dozen times.
- Typed content, so a mistyped front-matter field fails loudly rather than rendering an empty section.
- Per-page detail routes generated from content files.
- Smooth page-to-page navigation.

Darya's existing experience is PHP and frontend work, so unfamiliarity with any particular JS framework is a cost worth weighing, but none of the candidates requires deep framework expertise for a site of this size.

## Decision

Use **Astro 7** with static output (`output: "static"`, which is the default), no framework integration, and no SSR adapter.

## Options considered

### Option A — Astro (chosen)

| Dimension | Assessment |
|---|---|
| Complexity | Low. `.astro` components are HTML with a frontmatter script block |
| Cost | Free; static hosting |
| JS shipped | Zero by default. Only what we explicitly add |
| Content handling | Content collections with Zod schemas, built in |
| Detail routes | `[slug].astro` + `getStaticPaths()`, built in |
| Page transitions | `<ClientRouter />`, built in |
| Image optimisation | `astro:assets` with intrinsic sizing, built in |
| Team familiarity | New, but the component model is close to PHP templating — markup with a logic block above it |

**Pros**

- Everything on the requirements list is a built-in feature, not a dependency to pick and wire up. That is the single strongest argument: four of the six requirements are solved by the framework itself.
- Zero-JS default aligns with the performance budget. The 15 KB JS ceiling is comfortable rather than a fight.
- Markdown-plus-schema is the right shape for project case studies.
- Astro 7's build is 15–61% faster than v6 thanks to the Rust compiler and Vite 8, which matters for iteration speed more than for the shipped site.
- The escape hatch is real: if an interactive React island is ever needed, it can be added for that one component without rewriting anything.

**Cons**

- Astro 7 requires Node 22+. Fine here, but it rules out older CI images and needs pinning.
- The Rust compiler is stricter: unclosed tags now error rather than being silently repaired. This is a benefit for a site that must be semantically clean, but it will surprise anyone used to forgiving HTML.
- `compressHTML` now defaults to `'jsx'`, so whitespace between inline elements collapses. This causes subtle spacing bugs that look like CSS problems but are not. Mitigation: it is a named item on the review checklist, and `{" "}` is used where a literal space matters.
- Markdown now renders through Sätteri rather than remark by default. Any future need for a remark or rehype plugin means installing `@astrojs/markdown-remark` and opting into `unified()` deliberately. Not needed for v1.
- Smaller ecosystem than Next.js, and fewer answers when something goes wrong.

### Option B — Next.js

| Dimension | Assessment |
|---|---|
| Complexity | Medium-high. App Router, server vs client components, caching semantics |
| JS shipped | A React runtime baseline even on a fully static page |
| Content handling | Needs `contentlayer` or hand-rolled `fs` reading plus Zod |
| Familiarity | React knowledge required |

**Pros:** largest ecosystem; the default answer most tutorials assume; trivial to add dynamic features later.

**Cons:** ships a React bundle to render static text, which directly costs the performance budget. The App Router's server/client component distinction is a meaningful amount of concept to learn for a site with no server. Content typing is a bolt-on. The framework is built for applications, and this is a document.

### Option C — Eleventy

**Pros:** genuinely zero JS, very fast builds, simple mental model, excellent for content sites.

**Cons:** no built-in component scoping, no typed content collections, no image pipeline, no view transitions — each would be a plugin or hand-rolled. Nunjucks templating is less pleasant than JSX-like syntax for component props. For a site that wants typed content and view transitions, Astro provides both and Eleventy provides neither.

### Option D — Hand-written HTML, CSS and vanilla JS

**Pros:** nothing to learn, no build step, no dependencies, no framework to go stale.

**Cons:** the nav and footer get copy-pasted into five files, and the sixth copy is where they drift. Six project detail pages means six near-identical HTML files, and a change to the case-study layout means six edits. No image optimisation, no content validation. Cheapest to start and the most expensive to maintain. This option was seriously considered and rejected on the duplication argument alone.

### Option E — SvelteKit / Nuxt / Astro + a UI framework

Rejected as unnecessary. There is no application state on this site. The three interactive behaviours are a toggle, an IntersectionObserver, and a `<dialog>` — all of which are less code in vanilla TypeScript than the framework needed to manage them.

## Trade-off analysis

The decision turns on one question: is this a document or an application? It is a document. Everything about it is known at build time.

Next.js optimises for applications and pays for that with a client runtime this site has no use for. Eleventy optimises for documents but leaves four of our six requirements as homework. Hand-written HTML wins on simplicity until the second page exists.

Astro is the only option where "static document with components and typed content" is the thing it was designed for. The cost is Astro 7's stricter compiler and a smaller ecosystem, both of which are acceptable on a project this size — and the strictness is arguably a feature given the accessibility target.

## Consequences

**Easier**

- Zero-JS by default means the performance budget is met by doing nothing special.
- Project detail pages come free from one `[slug].astro` template.
- Front-matter typos become build failures.
- Nav and footer exist once.

**Harder**

- Node 22+ is required, so CI images and any contributor's local environment must be pinned.
- Invalid HTML now fails the build. Expect friction early, then benefit.
- Whitespace behaviour under `compressHTML: 'jsx'` needs watching.
- Debugging Astro-specific issues means a smaller pool of prior art.

**To revisit**

- If a genuinely interactive feature arrives (a filterable project grid, a live demo embed), evaluate adding a single island rather than changing framework.
- If the site ever needs server-rendered or per-request content, that is an adapter decision and a new ADR.

## Action items

1. [ ] `npm create astro@latest` with the minimal template, TypeScript strict
2. [ ] Pin `engines.node` to `>=22` in `package.json` and add `.nvmrc`
3. [ ] Confirm `output: "static"` and add no adapter
4. [ ] Add `{" "}` / `compressHTML` to the code review checklist
5. [ ] Verify the Rust compiler accepts the initial markup without warnings
