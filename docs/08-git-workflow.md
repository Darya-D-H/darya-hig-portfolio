# Git Workflow and Versioning

**Status:** Draft, awaiting approval

Repository: `darya-hig-portfolio`

---

## 1. Branching model

Trunk-based. `main` is always deployable. Work happens on short-lived branches that merge back within a day or two.

```
main ──●──●──●──●──●──●──●──●──
        ╲      ╱  ╲    ╱
         ●──●─╱    ●──╱     feature branches, 1–3 days
```

A branch that lives longer than three days has stopped being a branch and started being a divergence. If a piece of work is genuinely larger than that, it is split into smaller landable pieces — which the phased roadmap in [docs/09-build-roadmap.md](09-build-roadmap.md) is designed to produce.

### Branch naming

```
feature/<short-description>     feature/mobile-menu
fix/<short-description>         fix/focus-ring-clipped-by-nav
refactor/<short-description>    refactor/extract-section-component
docs/<short-description>        docs/update-token-table
chore/<short-description>       chore/bump-astro
test/<short-description>        test/lightbox-keyboard
```

Branches are deleted after merge.

### On a solo project

Branches and pull requests on a one-person project are not bureaucracy. The PR is where the diff gets read as a whole rather than as a sequence of edits, and it is where CI runs before anything reaches `main`. For a portfolio that is itself evidence of how you work, the commit history is part of the artefact.

---

## 2. Commit conventions

```
<type>: <short imperative description>

<optional body: why, not what>
```

### Types

| Type       | For                                                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `feat`     | A new feature or component                                                                                                                                                      |
| `fix`      | A bug fix                                                                                                                                                                       |
| `refactor` | Behaviour unchanged, structure improved                                                                                                                                         |
| `style`    | Formatting only, no logic                                                                                                                                                       |
| `docs`     | Documentation                                                                                                                                                                   |
| `test`     | Tests                                                                                                                                                                           |
| `chore`    | Tooling, dependencies, config                                                                                                                                                   |
| `perf`     | A performance improvement                                                                                                                                                       |
| `a11y`     | An accessibility fix — not a standard Conventional Commits type, added deliberately because accessibility work is a first-class concern here and should be greppable in the log |

### Good and bad

```
# Good — explains why
a11y: add scroll-margin-top to focusable elements

The 44px sticky nav covered elements the browser scrolled to via
fragment links and during keyboard navigation, violating WCAG 2.4.11
(Focus Not Obscured). scroll-margin-top of nav height plus 16px
keeps the focused element clear of the bar.

# Good — scoped and specific
feat: add Reveal component with IntersectionObserver

# Bad — what, not why; the diff already says this
update Nav.astro

# Bad — four unrelated changes
fix stuff and add projects page and update deps
```

### Rules

- **One logical change per commit.** A commit that needs "and" in its subject line is two commits.
- **Never mix formatting with behaviour.** A Prettier sweep is its own `style:` commit, otherwise the real change is buried in whitespace noise.
- **Never mix refactoring with features.** Extract the component in one commit, use it in the next.
- **Tests pass before committing.** `npm run verify` is the gate.
- **The subject line is imperative and under 72 characters.** "add", not "added" or "adds".
- **Documentation changes land with the code they describe.** Changing a token's value and updating the token doc is one commit, because a doc that lags the code is worse than no doc.

---

## 3. Commit size

| Size        | Assessment                            |
| ----------- | ------------------------------------- |
| ~100 lines  | Ideal. Easy to review, easy to revert |
| ~300 lines  | Acceptable for one coherent change    |
| 1000+ lines | Split it                              |

The exception is a genuinely atomic addition — the initial `@theme` token block is one commit even though it is long, because half a token system is not a reviewable state.

---

## 4. Pre-commit hygiene

Automated with Husky and lint-staged:

```jsonc
{
  "lint-staged": {
    "*.{ts,astro,js,mjs}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"],
  },
}
```

Manually, before anything unusual:

```bash
git diff --staged                     # read what you are about to commit
git diff --staged | grep -iE "password|secret|api_key|token"   # no secrets
npm run verify                        # the gate
```

The hook runs lint and format. It does **not** run the full build or the E2E suite, because a pre-commit hook that takes two minutes gets bypassed with `--no-verify` and then it protects nothing. The build runs in CI.

---

## 5. Pull requests

### Template — `.github/pull_request_template.md`

```markdown
## What

One or two sentences.

## Why

Which spec section or roadmap task this implements. Link it.

## Changes

- `path/to/file`: what changed and why

## Deliberately not touched

- Things in scope-adjacent territory left alone, and why

## Verification

- [ ] `npm run verify` passes
- [ ] `npm run test:e2e` passes (if UI changed)
- [ ] `npm run test:a11y` passes (if markup changed)
- [ ] Keyboard pass done (if interactive)
- [ ] Reduced-motion checked (if animated)
- [ ] Visual baselines reviewed (if layout changed)
- [ ] Docs updated (if behaviour changed)

## Concerns

Anything uncertain, or a trade-off a reviewer should weigh.
```

The **"deliberately not touched"** section is the one that earns its place. It shows scope discipline, and it is where you record "the Experience page has the same focus-ring problem but that is a separate fix" instead of silently expanding the PR or silently ignoring the issue.

### Branch protection on `main`

- No direct pushes.
- CI (`npm run verify`) must pass.
- Branch must be up to date with `main` before merging.
- **Never force-push to `main`.**

### Merge strategy

**Squash merge** for a feature branch whose intermediate commits were work-in-progress. **Merge commit** for a branch whose commits are individually meaningful and worth keeping — a sequence like "add token block", "apply tokens to Nav", "apply tokens to Footer" tells a story that squashing destroys.

Rebase to resolve conflicts on a branch; never rebase a branch someone else has pulled.

---

## 6. The save-point pattern

```
Implement a slice → run verify → commit → next slice
```

Not:

```
Implement everything → hope → one enormous commit
```

Each commit is a known-good state. If the next change breaks something, `git reset --hard HEAD` costs one increment of work rather than a day's.

This matters most when a lot of code arrives in a short time. Frequent commits are what keep that reversible.

---

## 7. Change summaries

When a change is non-trivial, the PR body (or the commit body) states:

```
CHANGES
- src/components/layout/Nav.astro: added aria-current, raised hit area to 44px
- src/styles/global.css: added --size-nav-height token

NOT TOUCHED (intentionally)
- Footer nav has the same hit-area issue — separate fix, see issue #12
- MobileMenu untouched; its focus trap is Phase 3

CONCERNS
- The 44px hit area makes the nav visually taller on mobile than the
  mockup. Worth a look before this lands.
```

Stating what was _not_ changed is as useful as stating what was. It prevents the review question "did you forget the footer?" and it records a decision instead of leaving a silence.

---

## 8. Tagging and versions

A portfolio has no consumers, so semantic versioning would be ceremony. Instead:

- Tag each deployed state as `v1.0`, `v1.1`, and so on, with a one-paragraph annotation describing what changed.
- Tag `docs-approved` at the commit where this documentation set is signed off, so the boundary between planning and building is findable in the history.

```bash
git tag -a docs-approved -m "Documentation set reviewed and approved; build begins"
git tag -a v1.0 -m "Initial public portfolio: 5 pages, 6 projects, WCAG 2.2 AA verified"
```

---

## 9. What is never committed

- `node_modules/`, `dist/`, `.astro/`
- `.env` or any secret
- Build output or caches
- `.DS_Store`, editor config beyond shared `extensions.json`
- Large unoptimised source images — originals belong outside the repo; only the versions the site uses are committed

Covered by `.gitignore`. The `grep` for secrets in section 4 is the backstop for the case `.gitignore` misses.

---

## 10. Setting up the remote

The remote does not exist yet. Once a GitHub account is authenticated:

```bash
gh repo create darya-hig-portfolio --public --source=. --remote=origin
git push -u origin main
```

Or, without the CLI: create the repository on github.com, then

```bash
git remote add origin git@github.com:<username>/darya-hig-portfolio.git
git push -u origin main
```

Then enable branch protection on `main` per section 5.

**Public or private:** public, if the repository is meant to be part of the portfolio — a hiring manager reading the commit history and the ADRs is the point. Private if the placeholder content would be embarrassing before the real content lands; it can be made public later.
