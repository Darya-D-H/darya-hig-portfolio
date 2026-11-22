---
# Shape under test: this site, self-referentially. Its live link points at
# the site itself (the placeholder origin until Phase 7 sets the real one).
title: "This Portfolio"
summary: "The site you are reading: a static Astro build designed against Apple's Human Interface Guidelines, at WCAG 2.2 AA."
order: 6
year: "2026"
role: "Designer and developer"
projectType: "Static website"
thumbnail: "../../assets/projects/portfolio-site/card.png"
thumbnailAlt: "This portfolio's home page with the hero headline and three featured project cards"
hero: "../../assets/projects/portfolio-site/hero.png"
tags: ["Astro", "TypeScript", "Tailwind CSS"]
stack:
  language: ["TypeScript", "CSS"]
  framework: ["Astro 7", "Tailwind CSS v4"]
  tooling: ["Vitest", "Playwright", "axe-core", "GitHub Actions"]
challenge: >
  TODO: Show engineering work to recruiters in under three minutes, on a phone
  or a laptop, without the site itself getting in the way.
solution: >
  TODO: A static site with a documented token system, no client framework and
  three small scripts. Every page is checked for accessibility in CI.
outcome: >
  TODO: Lighthouse scores, page weight, and anything a recruiter said about it.
designSystem:
  notes: >
    TODO: A summary of the token system: semantic colour names, a type scale
    that changes at two breakpoints, and why sizes are in rem.
gallery:
  - src: "../../assets/projects/portfolio-site/home.png"
    alt: "Home page at desktop width with the about section below the hero"
  - src: "../../assets/projects/portfolio-site/project.png"
    alt: "A project detail page showing the challenge, solution and outcome sections"
  - src: "../../assets/projects/portfolio-site/menu.png"
    alt: "Mobile menu open over the home page on a phone-sized screen"
links:
  live: "https://example.com"
  source: "https://github.com/Darya-D-H/darya-hig-portfolio"
---
