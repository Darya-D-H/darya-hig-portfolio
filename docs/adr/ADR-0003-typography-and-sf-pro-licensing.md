# ADR-0003: Typography — the system font stack, not self-hosted SF Pro

**Status:** Accepted — amended 2026-11-21 (Option D adopted: Inter self-hosted as the non-Apple fallback)
**Date:** 2026-11-20
**Deciders:** Darya

---

## Context

The design goal is for the site to read as an Apple product page, and typography carries most of that impression. apple.com is set in SF Pro, and the brief's reference CSS names `SF Pro Display` and `SF Pro Icons` directly in its font stack.

The obvious move is to download SF Pro from Apple's developer site and serve it as a webfont, guaranteeing identical rendering for every visitor on every platform. There are two reasons not to, one legal and one technical, and they point the same way.

### The legal constraint

Apple distributes SF Pro under the *License Agreement for the Apple San Francisco Font*, headed "For iOS, OS X and tvOS application uses only." Two provisions are decisive:

- The grant is limited to creating mock-ups of user interfaces for software running on Apple's own operating systems.
- The licence states that you <cite index="51-1">may not embed the Apple Font in any software programs or other products</cite>, and separately forbids using it to create, develop, display or distribute website content.

Serving SF Pro as a webfont from this portfolio is squarely outside that grant. It is not a grey area and it is not a technicality — a portfolio is a public website, and the restriction on website content is explicit.

Apple's own guidance for the web case is to use the system-font keywords, which render San Francisco on devices where San Francisco is the system font and fall back elsewhere. That is the sanctioned path.

Note also that the reference CSS names `SF Pro Icons`. That font supplies Apple glyphs, and SF Symbols are under the same kind of restriction: licensed for native Apple-platform software built with Xcode, not for extraction into web fonts or inline SVG. It is dropped from our stack entirely.

### The technical constraint

Even setting the licence aside, self-hosting would be the wrong call:

- SF Pro's full family is large. A variable-font subset would still add 40–120 KB of blocking resource to a site whose entire JS budget is 15 KB.
- Any webfont introduces a FOIT/FOUT decision, and either choice costs something measurable in Largest Contentful Paint.
- On an Apple device — which is where a meaningful share of this audience will be, and where the design is aimed — the system already has SF Pro. Downloading it again is paying to ship a font the device owns.

## Decision

Use one font stack for all text: the Apple system font first, then a self-hosted Inter for everyone else. Serve no Apple font file.

```css
--font-sans: -apple-system, BlinkMacSystemFont, var(--font-inter), system-ui,
             "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", Menlo, Consolas,
             "Liberation Mono", monospace;
```

On Apple hardware this resolves to genuine SF Pro, selected by the OS, and Inter is never downloaded. On Windows, Android and Linux it resolves to Inter. Why the order is exactly this is set out in [docs/02-design-tokens.md](../02-design-tokens.md) §2.

Inter is loaded through Astro's Fonts API (stable since Astro 6) from a pinned npm package, so builds are reproducible and need no network access to a font CDN:

```js
// astro.config.mjs — confirm option names against the Astro 7 docs in Phase 2
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.npm(),     // resolves @fontsource-variable/inter from package.json
      name: "Inter",
      cssVariable: "--font-inter",
      weights: ["100 900"],              // one variable file, not one file per weight
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],         // Astro generates a metric-matched fallback from this
    },
  ],
});
```

```astro
<!-- BaseLayout.astro <head> — note: no `preload` prop -->
<Font cssVariable="--font-inter" />
```

Inter is licensed under the SIL Open Font License 1.1, which permits self-hosting; the licence text ships with the package and is kept in the build output.

Design fidelity on non-Apple platforms is recovered not by shipping the typeface but by matching its *metrics*: the type scale, line heights and letter-spacing in [docs/02-design-tokens.md](../02-design-tokens.md) replicate apple.com's typographic rhythm regardless of which family renders it. Spacing and proportion carry more of the "Apple feel" than glyph shapes do.

### Why `"SF Pro Display"` is not in the stack

SF has an optical-size threshold at 20pt: below it the system uses SF Pro Text, with looser tracking tuned for body copy; at or above it, SF Pro Display, which is tighter and tuned for headings. `system-ui` and `-apple-system` pick the right variant automatically for the rendered size.

Naming `"SF Pro Display"` explicitly in a single shared stack would force display metrics onto 14px captions and 17px body text, producing text that is subtly too tight to read comfortably — the exact problem the optical threshold exists to prevent. It would also only match on machines that happen to have the font installed locally, giving inconsistent rendering between two Macs. So it is left out, and the system is allowed to choose.

### `SF Mono` in the mono stack

`"SF Mono"` *is* named in the monospace stack. This is not a contradiction: naming a font family in CSS asks the user's device for a font it may already have installed, which is ordinary CSS and involves no distribution by us. What the licence forbids is embedding and serving the file. We never do that for any Apple font.

## Options considered

### Option A — System font stack only (original decision, superseded by D)

**Pros:** licence-compliant; zero font bytes; zero FOUT; instant first paint; real SF Pro on Apple devices where it matters most; no font-loading code at all.

**Cons:** non-Apple visitors see a different typeface, so the design is not pixel-identical across platforms. Letter-spacing values tuned for SF are approximations on Segoe UI or Roboto — a tracking value that looks right on SF can look slightly loose on Roboto.

### Option B — Self-host SF Pro

**Pros:** identical rendering everywhere; exact match to the reference CSS.

**Cons:** outside the licence grant, which by itself ends the discussion for a public portfolio. Additionally: 40–120 KB of blocking download, a FOUT/FOIT trade-off, and a slower LCP. A portfolio that demonstrates competence should not open with a licence violation.

### Option C — Inter, self-hosted, for everyone

Inter is SIL Open Font License, free to self-host, and designed for UI with metrics close to SF.

**Pros:** fully consistent cross-platform rendering; legally unambiguous; genuinely good typeface.

**Cons:** overrides real SF Pro on Apple devices with a lookalike, which is a worse result for the primary audience. Still a webfont download with its loading cost. Ignores a font the device already has.

### Option D — Hybrid: system stack, with Inter as a self-hosted fallback (chosen, 2026-11-21)

System font first, with Inter served only where the system stack would reach a weaker fallback.

**Pros:** best of both — real SF on Apple, consistent Inter elsewhere.

**Cons:** a font download and a brief swap on first visit — paid only by non-Apple visitors. Letter-spacing tuned for SF is an approximation on Inter.

**Correction to the first draft of this ADR.** It claimed CSS cannot load a font "only if the earlier families are unavailable" without JavaScript. That was wrong. Browsers download a web font only when it is needed to render a character, so a family placed *after* `-apple-system` is never fetched on Apple devices. The condition is expressed by the stack order itself. Two things can break it, and both are rules now: putting `system-ui` before Inter (which makes Inter unreachable on Windows and Android), and preloading Inter (which forces the download everywhere).

## Trade-off analysis

The licence removes Option B, which is the only option that delivers true cross-platform fidelity. Among the rest, the question is whether consistency across platforms matters more than authenticity on Apple platforms.

For this site, authenticity on Apple platforms is non-negotiable: the audience skews toward Apple hardware and the design is explicitly an Apple homage. That rules out Option C. Option D keeps that authenticity intact — Apple visitors get real SF Pro and zero font bytes — and adds a consistent, SF-adjacent face everywhere else, at a cost that only non-Apple visitors pay. Once the claim that D needed JavaScript turned out to be false, D dominates A.

## Consequences

**Easier**

- Apple visitors: no font bytes, no preload hints, no font-loading flash.
- Non-Apple visitors see one consistent typeface instead of whatever their platform's sans happens to be.
- Astro's Fonts API generates the fallback metrics, so there is no hand-tuned `size-adjust` to maintain.
- Nothing to review legally.

**Harder**

- The design must be checked on a non-Apple platform, because letter-spacing tuned for SF is approximate on Inter. This goes in the test plan.
- The stack order and the no-preload rule must survive future edits. A test asserts both ([docs/07-test-plan.md](../07-test-plan.md) §4, `fonts.spec.ts`).
- One more dependency, and its OFL licence notice, to keep.
- "Looks exactly like apple.com" is only true on Apple devices. That expectation is set here rather than discovered later.
- Font-size tokens must be in `rem` so the stack respects the reader's browser preference — see [docs/02-design-tokens.md](../02-design-tokens.md) §2.

**To revisit**

- If a heading-only display face is ever wanted for personality, that is a separate decision and a new ADR — and it must be an openly-licensed typeface.

## Action items

1. [ ] Declare `--font-sans` and `--font-mono` in the `@theme` block exactly as above
2. [ ] Confirm no Apple font file exists anywhere in the repo, and the only `@font-face` rules are the ones Astro generates for Inter
3. [ ] Remove `SF Pro Icons` from any stack copied from the reference CSS
4. [ ] Record the no-Apple-fonts rule in the spec's "Never" list — done
5. [ ] Add a non-Apple-platform typography check to the test plan — done
6. [x] Resolve open question 4 (self-hosted Inter) — Option D adopted 2026-11-21
7. [ ] Configure Inter through the Fonts API with no `preload` (roadmap task 2.12)
8. [ ] On a real Mac and iPhone, confirm the Network panel shows no Inter request
