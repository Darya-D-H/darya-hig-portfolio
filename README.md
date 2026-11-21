# darya-hig-portfolio

A static personal portfolio built with Astro, styled with Tailwind CSS v4, and designed against Apple's Human Interface Guidelines and the visual language of apple.com.

**Status:** documentation phase. No application code has been written yet. Everything in `/docs` is reviewed and approved before the build starts.

## Documentation

Read in this order:

| Doc | What it covers |
|---|---|
| [docs/00-spec.md](docs/00-spec.md) | The master spec: objective, stack, commands, structure, code style, boundaries, success criteria |
| [docs/01-information-architecture.md](docs/01-information-architecture.md) | Sitemap and section-by-section content for every page |
| [docs/02-design-tokens.md](docs/02-design-tokens.md) | Colour, type, spacing, radius, shadow, breakpoints — the full token set |
| [docs/03-components.md](docs/03-components.md) | Component inventory with variants, states and accessibility contracts |
| [docs/04-motion.md](docs/04-motion.md) | Motion tokens, scroll reveals, page transitions, reduced-motion behaviour |
| [docs/05-accessibility-and-hig.md](docs/05-accessibility-and-hig.md) | WCAG 2.2 AA requirements and how HIG principles are adapted for the web |
| [docs/06-content-model.md](docs/06-content-model.md) | Content collection schemas and the placeholder content plan |
| [docs/07-test-plan.md](docs/07-test-plan.md) | How each thing gets verified, including browser and device testing |
| [docs/08-git-workflow.md](docs/08-git-workflow.md) | Branching, commit conventions, PR flow |
| [docs/09-build-roadmap.md](docs/09-build-roadmap.md) | Phased task breakdown with acceptance criteria |
| [docs/adr/](docs/adr/) | Architecture decision records |

## Stack

Astro 7 · Tailwind CSS v4 · TypeScript (strict) · ESLint · Prettier · no runtime framework, no backend.

## Licence

- **Code** — everything under `src/` except `src/content/` and `src/assets/`, plus config, scripts and tests — is released under the [MIT licence](LICENSE).
- **Content** — the written copy in `src/content/`, and the images in `src/assets/` and `public/` — is © Darya, all rights reserved. It is not covered by the MIT licence and may not be reused without permission.
- **Inter** is © The Inter Project Authors, used under the SIL Open Font License 1.1.

## Font licensing note

Apple's SF Pro font files are **not** redistributable on a public website. This project uses the system font stack, which resolves to real SF Pro on Apple devices, and self-hosts Inter (OFL) for everyone else. See [ADR-0003](docs/adr/ADR-0003-typography-and-sf-pro-licensing.md). No Apple logos, product imagery, marketing copy, or SF Symbols artwork is used.
