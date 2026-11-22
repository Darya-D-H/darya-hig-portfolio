---
# Shape under test: the complete record. Every optional field is populated.
title: "Invoice Tracker"
summary: "A small Laravel app for issuing and chasing invoices, built for a two-person studio."
order: 1
featured: true
year: "2025"
role: "Solo developer"
projectType: "Web application"
thumbnail: "../../assets/projects/invoice-tracker/card.png"
thumbnailAlt: "Invoice list showing five invoices, two of them marked overdue in red"
hero: "../../assets/projects/invoice-tracker/hero.png"
heroAlt: "Invoice Tracker dashboard with totals for paid, due and overdue invoices"
tags: ["PHP", "Laravel", "MySQL"]
stack:
  language: ["PHP 8.3", "JavaScript"]
  framework: ["Laravel 11", "Blade", "Tailwind CSS"]
  data: ["MySQL", "Eloquent"]
  tooling: ["Vite", "Pest", "GitHub Actions"]
challenge: >
  TODO: The studio tracked invoices in a shared spreadsheet. Nobody could tell
  which invoices were overdue without reading every row, and two people editing
  at once regularly overwrote each other.
solution: >
  TODO: A single-purpose app with one list view, a status derived from the due
  date rather than typed by hand, and a weekly digest email. Describe one real
  decision and the reason behind it.
outcome: >
  TODO: Overdue invoices became visible at a glance. Quantify if you can, such
  as time saved per week, errors avoided, or invoices chased on time.
designSystem:
  notes: >
    TODO: Notes on the type scale, spacing system and component set used, and
    anything you would do differently.
  palette:
    - { name: "Primary", value: "#1f6feb" }
    - { name: "Overdue", value: "#cf222e" }
    - { name: "Surface", value: "#ffffff" }
  typeSample: "TODO: Invoice INV-0042 is 12 days overdue"
gallery:
  - src: "../../assets/projects/invoice-tracker/list.png"
    alt: "Invoice list filtered to overdue invoices, sorted by days late"
  - src: "../../assets/projects/invoice-tracker/detail.png"
    alt: "Single invoice with line items and a payment history timeline"
  - src: "../../assets/projects/invoice-tracker/digest.png"
    alt: "Weekly digest email listing three invoices that fall due next week"
  - src: "../../assets/projects/invoice-tracker/settings.png"
    alt: "Settings page with default payment terms set to 30 days"
links:
  live: "https://example.com"
  source: "https://github.com/example/invoice-tracker"
---

TODO: Optional extra prose for this project. Anything that does not fit the
challenge, solution and outcome structure goes here and renders after it.
