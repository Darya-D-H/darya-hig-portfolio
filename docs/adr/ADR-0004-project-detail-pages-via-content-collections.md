# ADR-0004: Project detail pages from a content collection

**Status:** Accepted
**Date:** 2026-11-20
**Deciders:** Darya

---

## Context

Darya's requirement: the Projects grid links through to "a subdirectory showing the project in detail, for example, the images, description, tech stack, design systems, external links and all that info."

So each project needs its own URL at `/projects/<slug>` carrying a structured case study: hero image, description, challenge/solution/outcome narrative, grouped tech stack, design-system notes, a gallery with a lightbox, and external links to the live site and source.

Six projects at launch, with more expected over time. Several fields are optional — one project has no live URL, another has no design system worth documenting, a third has only two screenshots. The structure has to tolerate absent fields without leaving visible gaps.

## Decision

Define a `projects` content collection in `src/content.config.ts` using the `glob` loader with a Zod schema, store one Markdown file per project in `src/content/projects/`, and generate the pages from a single `src/pages/projects/[slug].astro` template via `getStaticPaths()`.

Images are declared with Astro's `image()` schema helper so they are processed by `astro:assets`.

## Options considered

### Option A — Content collection with a Zod schema (chosen)

| Dimension        | Assessment                                                 |
| ---------------- | ---------------------------------------------------------- |
| Complexity       | Low. One schema, one template, six Markdown files          |
| Type safety      | Full. Fields are typed and validated at build time         |
| Adding a project | Create one Markdown file. Nothing else changes             |
| Image handling   | `image()` resolves paths and supplies intrinsic dimensions |
| Optional fields  | Expressed directly as `.optional()` in the schema          |

**Pros**

- A mistyped field name fails the build with a message naming the file and the field. The alternative is a section that silently renders empty, which is the failure mode you discover in production.
- `image()` hands the component intrinsic width and height, so every `<Image>` renders with explicit dimensions and layout shift is prevented structurally rather than by remembering to type the numbers. That directly protects the CLS < 0.05 budget.
- `.min(2).max(6)` on the gallery encodes a design rule in the type system: a one-image lightbox is worse than an inline image, and a seven-image gallery breaks the grid.
- Required `thumbnailAlt` makes it impossible to add an image without a description — accessibility enforced by the schema instead of by review.
- Adding a seventh project is one file. No registry to update, no component to touch.
- Case-study prose lives in front matter and Markdown rather than inside a `.astro` file, so content edits never risk breaking markup.

**Cons**

- Zod schemas are a thing to learn, and the error messages take getting used to.
- Front matter with long prose blocks and nested objects gets visually heavy; YAML's `>` folded scalars are easy to get subtly wrong (indentation matters).
- Rigid by design: a project that wants a section nobody else has needs either a schema change or the free-form Markdown body.
- Image paths in front matter are relative to the content file, which is a common source of confusion (`../../assets/...` rather than `/src/assets/...`).

### Option B — One hand-written `.astro` page per project

`src/pages/projects/invoice-tracker.astro`, and five more like it.

**Pros:** total freedom per project; no schema to satisfy; each page can be laid out however suits that project.

**Cons:** six near-identical files. A change to the case-study layout is six edits, and the sixth is where it gets missed. No validation, so a forgotten section is invisible until someone looks. Content and markup are entangled, so editing a sentence means editing a component. This scales badly from the second project onward, which is exactly when it stops being obvious.

### Option C — A single JSON or TS data file

One `projects.ts` exporting an array of objects, consumed by one template.

**Pros:** one file to edit; typed if written in TypeScript; no YAML.

**Cons:** multi-paragraph prose in a JS string literal is unpleasant to write and worse to diff — a one-word change shows as a whole-line change. No Markdown, so emphasis and links inside the case study need HTML in strings. Loses `image()`, so image paths become unvalidated strings and intrinsic dimensions must be hand-typed, surrendering the layout-shift guarantee. Every project edit touches the same file, making history muddier.

### Option D — A headless CMS

**Pros:** edit content without touching code; good if a non-technical person maintained it.

**Cons:** an external dependency and an account for a site with six records, maintained by the engineer who wrote it. Introduces a network call at build time and a service that can go away. No benefit here.

### Option E — Flat routes, no detail pages

The option originally proposed and rejected during planning: show everything on the Projects grid with external links only.

**Cons:** no room for a case study, which is the content most likely to persuade a hiring manager. Darya specifically asked for detail pages.

## Trade-off analysis

Option B is tempting at six projects and indefensible at ten. Option C's weakness is specific and serious: giving up `image()` means giving up automatic intrinsic dimensions, and hand-typed image dimensions drift from the files they describe, which shows up as layout shift.

Option A's real cost is YAML front matter getting heavy for long prose. That is mitigated by keeping the three case-study fields to a few sentences each and putting anything longer in the Markdown body, which is where prose belongs anyway.

The schema's rigidity is the point. A portfolio where each project is described differently reads as inconsistent; a schema that requires challenge, solution and outcome on every project produces a set of case studies that can actually be compared.

## Consequences

**Easier**

- Adding a project is one file.
- Field typos, missing required fields and bad image paths all fail the build.
- Layout shift is prevented by construction.
- Alt text cannot be omitted.
- SEO metadata is derived from front matter, so it cannot drift from the content.

**Harder**

- Image paths in front matter are relative to the Markdown file. This will be got wrong at least once; the error message is clear.
- A schema change is a breaking change across all six files. Prefer adding optional fields over changing existing ones.
- YAML folded scalars need care with indentation.
- The config file is `src/content.config.ts` at the root of `src/`, **not** `src/content/config.ts`. The older location is no longer read, and placing it there produces a collection that silently does not exist.

**To revisit**

- If a project needs a genuinely bespoke layout, add an optional `layout` discriminator to the schema rather than hand-writing a page outside the collection.
- If the project count passes roughly fifteen, the Projects grid needs pagination or filtering, and filtering needs a new interaction spec.
- `draft: true` exists in the schema; confirm it is actually excluded from production builds and not merely from the index.

## Action items

1. [ ] Create `src/content.config.ts` with the `projects`, `experience` and `skills` collections per [docs/06-content-model.md](../06-content-model.md)
2. [ ] Build `src/pages/projects/[slug].astro` with `getStaticPaths()`
3. [ ] Write the six placeholder project files, including the two deliberately sparse records (`api-gateway`, `cli-toolkit`)
4. [ ] Assert the exactly-three-featured invariant on the Home page
5. [ ] Verify each optional section omits itself cleanly, with no empty band left behind
6. [ ] Confirm `draft: true` entries are absent from the production build
