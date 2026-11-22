// Every public page, for specs that sweep the whole site. The 404 is not in
// this list; specs that cover it add it explicitly.
export const PAGES = [
  "/",
  "/projects",
  "/projects/invoice-tracker",
  "/projects/component-library",
  "/projects/api-gateway",
  "/projects/booking-widget",
  "/projects/cli-toolkit",
  "/projects/portfolio-site",
  "/skills",
  "/experience",
  "/contact",
] as const;

/** The four global nav links, as their pages' h1 reads. */
export const NAV = [
  { href: "/projects", label: "Projects", h1: "Projects" },
  { href: "/skills", label: "Skills", h1: "Skills" },
  { href: "/experience", label: "Experience", h1: "Experience" },
  { href: "/contact", label: "Contact", h1: "Let's talk." },
] as const;
