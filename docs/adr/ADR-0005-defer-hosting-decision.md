# ADR-0005: Defer the hosting decision, keep the build host-agnostic

**Status:** Accepted
**Date:** 2026-11-20
**Deciders:** Darya

---

## Context

Darya chose "decide later" for hosting. The site must still be buildable, testable and reviewable in the meantime, and the eventual choice must not require reworking anything.

The realistic candidates are GitHub Pages, Netlify and Cloudflare Pages. All three serve static files from a free tier, all three deploy from a GitHub repository, and all three support a custom domain with automatic TLS. For a site with no server-side anything, the functional difference between them is close to nil.

The risk of deciding later is only a problem if the build acquires a dependency on a particular host — an adapter, a `_redirects` file, a platform-specific function, a base-path assumption. Avoiding that is cheap if it is deliberate from the start and expensive to unpick afterwards.

## Decision

Build to a plain static `dist/` directory with no adapter and no platform-specific configuration. Write the CI workflow so it runs `npm run verify` on every push and pull request, but **do not** add a deploy step. Choose a host before Phase 7 and add the deploy step then, as a single commit.

Specifically:

- No `@astrojs/*` adapter. `output: "static"` (the default) with no `adapter` key.
- No `_redirects`, `_headers`, `netlify.toml`, `wrangler.toml`, or `vercel.json`.
- `site` is set in `astro.config.mjs` because the sitemap and canonical URLs need an absolute origin. Until a host is chosen it points at a placeholder constant in one place, so changing it later is a one-line edit.
- **`base` is left unset.** This is the one real trap, discussed below.
- Internal links are written as root-relative (`/projects`), never host-relative or absolute.

## The `base` path trap

This is the only decision that genuinely cannot be deferred for free, and it is worth being explicit about.

GitHub Pages serves a project repository at `https://<user>.github.io/<repo>/`, i.e. under a subpath. Netlify and Cloudflare Pages serve at the root of a subdomain. An Astro site deployed to a subpath needs `base: "/darya-hig-portfolio"` set, and every internal link and asset reference must respect it.

A site built with `base` unset and then deployed to GitHub Pages without a custom domain breaks: every link points one level too high, and every image 404s. A site built with `base` set and deployed to a root domain breaks the same way in reverse.

Three mitigations, all applied:

1. **Internal links never hardcode a path prefix.** They use root-relative hrefs, and Astro's `import.meta.env.BASE_URL` is used wherever a prefix must be composed. Setting `base` later then works without touching the links.
2. **Asset URLs come from `astro:assets` and from imports**, not from hand-written strings, so they are rewritten by the build.
3. **A note in the Phase 7 checklist**: if the host is GitHub Pages *without* a custom domain, `base` must be set and the whole site re-verified, because this is a class of bug that does not appear in local `npm run dev`.

The cleanest way to avoid the trap entirely is a custom domain on any of the three hosts, or a `<user>.github.io` user-site repository, both of which serve from the root. That is a recommendation, not a decision.

## Options considered

### Option A — Defer, stay host-agnostic (chosen)

**Pros:** no rework whatever is chosen; nothing committed before it needs to be; CI still enforces quality on every push; the decision is made with the finished site in hand rather than guessed at the start.

**Cons:** nothing is deployed, so there is no shareable preview URL during the build, and no PR preview deploys. The `base` trap stays open until resolved. It is also easy for "decide later" to become "never decided", so Phase 7 names it as a gate rather than a nice-to-have.

### Option B — Pick GitHub Pages now

**Pros:** lives beside the repo; free; no third-party account; the repo is already going to be on GitHub.

**Cons:** forces the `base`-path question immediately, or forces buying a domain. No PR preview deploys, which are genuinely useful for reviewing visual changes. Slower cache invalidation than the other two.

### Option C — Pick Netlify or Cloudflare Pages now

**Pros:** root-path serving avoids the `base` trap; PR preview deploys per branch, which is the single most useful CI feature for a visual project; fast global CDN.

**Cons:** a third-party account and build minutes on someone else's free tier; marginally more configuration; a platform that may change its free tier.

## Trade-off analysis

The honest position is that this decision does not matter much, which is exactly why deferring it is reasonable — there is no large downside being risked.

The one thing being given up is PR preview deploys. On a project whose output is visual, being able to open a branch's rendered site is worth real money, and it is the strongest argument for choosing Netlify or Cloudflare Pages early. Against that, local `npm run preview` plus the Playwright screenshot suite covers most of the same ground for a solo developer.

So: defer, but treat the choice as a Phase 7 gate with a recommendation attached. If a shareable preview URL becomes wanted mid-build, revisit immediately — nothing in the build will resist it.

## Consequences

**Easier**

- No rework when the host is chosen; the deploy step is additive.
- Nothing depends on a platform that might change.
- `dist/` can be served by anything, including a local static server for testing.

**Harder**

- No preview URL to share while building.
- No PR preview deploys, so visual review happens locally.
- The `base` question remains open and must be answered deliberately, not discovered.
- `site` holds a placeholder, so the sitemap and canonical URLs are wrong until it is set. Phase 7 must verify both.

**To revisit**

- Before Phase 7: choose the host, set `site`, decide `base`, add the deploy step.
- If a preview URL is wanted sooner, choose Netlify or Cloudflare Pages then rather than waiting.

## Action items

1. [ ] `astro.config.mjs`: `output: "static"`, no adapter, `site` set to a clearly-marked placeholder constant
2. [ ] CI workflow runs `npm run verify` on push and PR, with no deploy step
3. [ ] All internal links root-relative; no hardcoded origin anywhere
4. [ ] Add to the Phase 7 checklist: choose host → set `site` → decide `base` → re-run the full verification against the deployed URL
5. [ ] Recommend a custom domain or a user-site repo to sidestep `base` entirely
