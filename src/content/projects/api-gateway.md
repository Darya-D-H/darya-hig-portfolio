---
# Shape under test: no gallery and no live link, only a source link. The
# gallery and link sections must vanish without leaving gaps.
title: "API Gateway"
summary: "A lightweight PHP gateway that puts rate limiting and auth in front of four legacy services."
order: 3
featured: true
year: "2024"
role: "Backend developer"
projectType: "Backend service"
thumbnail: "../../assets/projects/api-gateway/card.png"
thumbnailAlt: "Request log showing allowed and rate-limited calls to four services"
hero: "../../assets/projects/api-gateway/hero.png"
tags: ["PHP", "Redis", "REST"]
stack:
  language: ["PHP 8.2"]
  framework: ["Slim"]
  data: ["Redis", "PostgreSQL"]
  tooling: ["Docker", "PHPUnit"]
challenge: >
  TODO: Four older services each handled authentication differently, and one
  of them fell over whenever a client retried in a tight loop.
solution: >
  TODO: A thin gateway that checks tokens once, applies per-client rate limits
  backed by Redis, and forwards requests unchanged, so none of the services
  had to be rewritten.
outcome: >
  TODO: What changed after it shipped. Fewer incidents, a single place to
  rotate credentials, or response times you measured before and after.
links:
  source: "https://github.com/example/api-gateway"
---
