---
# Shape under test: the title is exactly 60 characters and the summary
# exactly 140, the schema's limits, to test card clamping and heading wrap.
title: "Booking Widget for Small Clinics with Live Availability Sync"
summary: "An embeddable booking widget that lets patients pick a slot from live availability and confirm in two taps, without leaving the clinic site."
order: 4
year: "2023"
role: "Full-stack developer"
projectType: "Embeddable widget"
thumbnail: "../../assets/projects/booking-widget/card.png"
thumbnailAlt: "Booking widget showing a week of appointment slots with three already taken"
hero: "../../assets/projects/booking-widget/hero.png"
tags: ["JavaScript", "PHP", "MySQL"]
stack:
  language: ["JavaScript", "PHP 8.1"]
  framework: ["Lit", "Laravel"]
  data: ["MySQL"]
  tooling: ["Vite", "Cypress"]
challenge: >
  TODO: Patients booked by phone, and the clinic double-booked slots whenever
  two receptionists took calls at the same time.
solution: >
  TODO: A widget the clinic embeds with one script tag. It reads live
  availability, holds a slot for two minutes while the patient confirms, and
  writes the booking straight into the clinic's calendar.
outcome: >
  TODO: Share of bookings made online after launch, and whether double
  bookings stopped.
gallery:
  - src: "../../assets/projects/booking-widget/calendar.png"
    alt: "Slot picker on a phone screen with Thursday morning selected"
  - src: "../../assets/projects/booking-widget/confirmation.png"
    alt: "Confirmation step summarising the appointment time and clinic address"
links:
  live: "https://example.com"
  source: "https://github.com/example/booking-widget"
---
