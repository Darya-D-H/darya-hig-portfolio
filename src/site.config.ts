/**
 * The one place the site's identity and contact details are written
 * (docs/01-information-architecture.md §7). Nav, footer and contact page all
 * read from here, so a changed URL is changed once.
 */
export const site = {
  name: "Darya",
  /** The Home page title and the eyebrow on the hero and preview image. */
  role: "Software Developer",
  email: "darya.dler.contact@gmail.com",
  github: "https://github.com/Darya-D-H",
  linkedin: "https://www.linkedin.com/in/darya-dler-hussein",
} as const;

/** The four global nav links, in order. Home is the wordmark. */
export const navLinks = [
  { href: "/projects", label: "Projects" },
  { href: "/skills", label: "Skills" },
  { href: "/experience", label: "Experience" },
  { href: "/contact", label: "Contact" },
] as const;
