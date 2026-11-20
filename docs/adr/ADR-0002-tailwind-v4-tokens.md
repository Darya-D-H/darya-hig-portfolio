# ADR-0002: Tailwind CSS v4 with tokens in `@theme`

**Status:** Accepted
**Date:** 2026-11-20
**Deciders:** Darya

---

## Context

The design is specified as a set of precise values borrowed from apple.com: a 28px corner radius, `rgb(245,245,247)` section bands, `rgb(255,255,255)` cards, a 1068px breakpoint, and a type scale where each size carries its own line-height, weight and letter-spacing (24px / 1.1666666667 / 600 / .009em at the 1068px breakpoint, for example).

Two things must be true of the implementation:

1. Those values exist in exactly one place. A 28px radius repeated across nine components is nine places to miss when it changes.
2. A size and its line-height, weight and tracking cannot be applied separately. The whole point of the scale is that 24px *always* comes with 1.1667 and .009em. If a component can set the size and forget the tracking, the scale is decorative.

Darya chose Tailwind during planning. The open question was how to hold the tokens, since Tailwind's reputation is for utility classes with arbitrary values — the opposite of a token system.

## Decision

Use **Tailwind CSS v4** installed via `@tailwindcss/vite`, with all design tokens declared in a CSS-native `@theme` block in `src/styles/global.css`. Arbitrary values in components are prohibited and treated as a review failure.

## Options considered

### Option A — Tailwind v4 with `@theme` (chosen)

In v4 the theme is CSS, not a JavaScript config:

```css
@import "tailwindcss";

@theme {
  --radius-card: 28px;
  --color-section: #f5f5f7;

  --text-card-title: 1.5rem;
  --text-card-title--line-height: 1.1667;
  --text-card-title--font-weight: 600;
  --text-card-title--letter-spacing: 0.009em;
}
```

That produces `rounded-card`, `bg-section`, and a `text-card-title` utility that applies **all four** typographic properties at once. It also makes every token available as a plain custom property (`var(--radius-card)`) for the rare case a utility will not do.

| Dimension | Assessment |
|---|---|
| Complexity | Low. One CSS file; no JS config |
| Token enforcement | Strong. The correct pairing is the easy one |
| Build speed | Fast — v4's Oxide engine |
| Astro integration | One Vite plugin |
| Escape hatches | `var(--token)` in a scoped `<style>` where needed |

**Pros**

- The grouped-type-utility behaviour is the decisive feature. `class="text-card-title"` cannot apply the size without the tracking, which is exactly the guarantee the design needs.
- Tokens are real custom properties, so they are inspectable in devtools and reusable outside Tailwind.
- No `tailwind.config.js`, no `content` globs to keep in sync.
- `prettier-plugin-tailwindcss` sorts classes automatically, so class order never becomes a review topic.
- The whole token set lives in one reviewable file, which is what makes [docs/02-design-tokens.md](../02-design-tokens.md) auditable against the code.

**Cons**

- Utility classes in markup make a component's markup noisier than a semantic class name would.
- Tailwind's default theme ships a large palette and scale we do not use. Mitigated by overriding the namespaces we care about and ignoring the rest; unused utilities are not emitted.
- v4 is a substantial departure from v3, so most tutorials and Stack Overflow answers describe the old JS config. Searching for help will frequently return outdated advice.
- Nothing mechanically prevents `text-[23px]`. The prohibition is a review rule, not a compiler error.

### Option B — Vanilla CSS with custom properties

Hand-written CSS, tokens as `:root` custom properties, scoped `<style>` blocks per Astro component.

**Pros:** closest possible match to apple.com's actual CSS; no dependency; complete control; smallest possible output.

**Cons:** nothing enforces the size/line-height/tracking pairing — each is a separate declaration a developer can forget. Responsive variants mean hand-writing media queries in every component. Scoped styles per component means the same `@media (min-width: 1069px)` block repeated dozens of times. This was the original recommendation before Darya chose Tailwind, and it remains a defensible choice; the deciding factor against it is the pairing guarantee.

### Option C — Tailwind v3 with `tailwind.config.js`

**Pros:** vastly more documentation and community answers; a mature `fontSize` array syntax that also groups size with line-height.

**Cons:** tokens live in JavaScript, not CSS, so they are unavailable as custom properties without duplicating them. Requires `content` globs. Slower builds. Choosing the previous major version of a tool at the start of a greenfield project means starting with a migration already owed. v3's grouped `fontSize` handles size, line-height, weight and tracking but less cleanly than v4's modifier syntax.

### Option D — Sass/SCSS

**Pros:** mixins make responsive type scales terse; nesting suits the band-and-card structure.

**Cons:** adds a compilation step and a dependency to produce CSS that modern CSS already produces. Sass variables are compile-time, so they are not inspectable in devtools, and mixing them with custom properties for theming gets confusing. Solves a problem that nesting and custom properties in native CSS no longer have.

### Option E — `@astrojs/tailwind` integration

Rejected: Astro's own docs state that Tailwind's Vite plugin is the preferred way to use Tailwind 4 in Astro, and the integration page now simply points at the styling guide. Using the superseded integration would mean adopting a path that is already being wound down.

## Trade-off analysis

The real contest is A versus B, and it is narrower than it looks — both put the same tokens in the same custom properties.

The difference is enforcement. In vanilla CSS, a component that needs a 24px heading writes four declarations and may write three. In Tailwind v4, it writes `text-card-title` and gets four. On a project whose entire visual claim rests on a type scale being applied consistently, that is worth the markup noise.

Against Tailwind, the honest cost is that v4's documentation story is still thin relative to v3, and utility-heavy markup is harder to read at a glance. Both are tolerable. The v3 option is rejected on principle: starting a new project on the old major version is borrowing a migration.

## Consequences

**Easier**

- One file holds every token; the design-token doc can be diffed against it.
- Typography cannot be applied partially.
- Responsive variants are `lg:` prefixes rather than hand-written media queries in every component.
- Class order is automated away.

**Harder**

- Markup carries more class names. Long class lists on a card are the normal cost of this approach.
- Searching for v4 help returns v3 answers. Prefer the official docs over tutorials.
- The no-arbitrary-values rule needs active enforcement in review, since the toolchain permits them.

**To revisit**

- If class lists on the card components become genuinely unreadable, consider extracting a small number of `@utility` definitions for the most repeated combinations. Do this reactively, not pre-emptively — premature component classes recreate the problem Tailwind avoids.
- If a dark theme is added, it reassigns `--color-*` under `prefers-color-scheme: dark`. The semantic alias layer in the token doc exists precisely so that this does not touch any component.

## Action items

1. [ ] `npm install tailwindcss @tailwindcss/vite`
2. [ ] Add the Vite plugin to `astro.config.mjs`
3. [ ] Create `src/styles/global.css` with `@import "tailwindcss"` and the full `@theme` block from the token doc
4. [ ] Install and configure `prettier-plugin-tailwindcss`
5. [ ] Add "no arbitrary values" to the review checklist
6. [ ] Confirm every token in [docs/02-design-tokens.md](../02-design-tokens.md) exists in `global.css` before Phase 3 begins
