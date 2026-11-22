---
# Shape under test: the design-system section at full size, with a palette
# and a type sample.
title: "Component Library"
summary: "A small, accessible component library shared by three internal PHP apps, with its own tokens and docs."
order: 2
featured: true
year: "2024—2025"
role: "Frontend lead"
projectType: "Design system"
thumbnail: "../../assets/projects/component-library/card.png"
thumbnailAlt: "Grid of buttons, inputs and badges from the library in their default states"
hero: "../../assets/projects/component-library/hero.png"
tags: ["TypeScript", "CSS", "Storybook"]
stack:
  language: ["TypeScript", "CSS"]
  framework: ["Web Components", "Storybook"]
  tooling: ["Vite", "Vitest", "Playwright", "Changesets"]
challenge: >
  TODO: Three internal apps had each grown their own buttons, forms and
  colours. The same control behaved three different ways, and accessibility
  fixes had to be made three times.
solution: >
  TODO: One set of design tokens and a dozen components, each with documented
  states and keyboard behaviour, published as a package the apps could adopt
  one screen at a time.
outcome: >
  TODO: Describe adoption honestly: how many screens moved over, which
  accessibility issues disappeared, and what the teams said about it.
designSystem:
  notes: >
    TODO: How the token layers were split between palette and semantic names,
    why spacing was a 4px scale, and the one component that took longest to
    get right.
  palette:
    - { name: "Ink", value: "#1d1d1f" }
    - { name: "Accent", value: "#0b57d0" }
    - { name: "Success", value: "#1a7f37" }
    - { name: "Warning", value: "#9a6700" }
    - { name: "Surface", value: "#f6f8fa" }
  typeSample: "TODO: The quick brown fox jumps over the lazy dog"
gallery:
  - src: "../../assets/projects/component-library/buttons.png"
    alt: "Button component in filled, tinted and plain variants, each with hover and focus states"
  - src: "../../assets/projects/component-library/forms.png"
    alt: "Form field showing its label, hint text and an inline error message"
  - src: "../../assets/projects/component-library/tokens.png"
    alt: "Token reference page listing colour and spacing values"
links:
  live: "https://example.com"
  source: "https://github.com/example/component-library"
---
