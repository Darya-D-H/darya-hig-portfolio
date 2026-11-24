/**
 * Content collections (docs/06-content-model.md). This file must stay at the
 * root of src/: Astro silently ignores src/content/config.ts.
 *
 * Every field is validated at build time, so a typo in a field name or a
 * missing image fails the build instead of rendering an empty section.
 */
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/** "2024-03": the precision a role date really has, and what <time> wants. */
const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM, for example 2024-03");

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      // --- identity ---
      title: z.string().max(60),
      summary: z.string().max(140), // one line; also the meta description
      order: z.number().int().positive(), // grid order, ascending, unique
      featured: z.boolean().default(false), // exactly three are true

      // --- optional meta strip ---
      year: z.string().optional(),
      role: z.string().optional(),
      projectType: z.string().optional(), // eyebrow on the detail page

      // --- imagery ---
      thumbnail: image(), // 16:10 card image
      thumbnailAlt: z.string(), // no image without a description
      hero: image().optional(), // falls back to the thumbnail
      heroAlt: z.string().optional(), // falls back to thumbnailAlt

      // --- case study: front matter, so none of the three can be missing ---
      challenge: z.string(),
      solution: z.string(),
      outcome: z.string(),

      // --- tech stack, grouped so it scans ---
      stack: z.object({
        language: z.array(z.string()).default([]),
        framework: z.array(z.string()).default([]),
        data: z.array(z.string()).default([]),
        tooling: z.array(z.string()).default([]),
      }),
      tags: z.array(z.string()).max(3), // the ones shown on the card

      // --- design system notes: the section is omitted when absent ---
      designSystem: z
        .object({
          notes: z.string(),
          palette: z
            .array(z.object({ name: z.string(), value: z.string() }))
            .optional(),
          typeSample: z.string().optional(),
        })
        .optional(),

      // --- gallery: one image is a hero, not a gallery ---
      gallery: z
        .array(z.object({ src: image(), alt: z.string() }))
        .min(2)
        .max(6)
        .optional(),

      // --- external links, rendered only when present ---
      links: z
        .object({
          live: z.url().optional(),
          source: z.url().optional(),
        })
        .default({}),

      draft: z.boolean().default(false), // excluded from production builds
    }),
});

const experience = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/experience" }),
  schema: z.object({
    role: z.string(),
    company: z.string(),
    companyUrl: z.url().optional(),
    startDate: yearMonth,
    endDate: yearMonth.optional(), // absent means current
    location: z.string().optional(),
    bullets: z.array(z.string()).min(2).max(4),
    order: z.number().int().positive(),
  }),
});

/** Shown on the Experience page, below the roles. */
const education = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/education" }),
  schema: z.object({
    qualification: z.string(), // "BSc Computer Science"
    institution: z.string(),
    institutionUrl: z.url().optional(),
    startDate: yearMonth,
    endDate: yearMonth.optional(), // absent means in progress
    location: z.string().optional(),
    details: z.array(z.string()).max(3).default([]),
    order: z.number().int().positive(),
  }),
});

const skills = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/skills" }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    items: z.array(z.string()).min(1),
    order: z.number().int().positive(),
    showOnHome: z.boolean().default(true),
  }),
});

export const collections = { projects, experience, education, skills };
