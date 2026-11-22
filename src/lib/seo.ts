/**
 * Title, description and URL helpers for each page's <head>
 * (docs/01-information-architecture.md §9, docs/06-content-model.md §5).
 * Everything is derived, never hand-written per page, so the meta cannot
 * drift from the content. Build-time only.
 *
 * These return plain text. Astro escapes attribute values when it renders
 * them, so escaping here as well would double-escape: "R&D" would reach a
 * search result as "R&amp;amp;D".
 */
import { site } from "@/site.config";

export const TITLE_SEPARATOR = " — ";
const SUFFIX = `${TITLE_SEPARATOR}${site.name}`;

/** Search engines cut descriptions at about this length. */
export const DESCRIPTION_LIMIT = 160;

/**
 * "Skills" → "Skills — Darya". Home, with no title, is "Darya — Software
 * Engineer". A title that already carries the suffix is left alone.
 */
export function pageTitle(title?: string): string {
  const clean = title?.replace(/\s+/g, " ").trim();
  if (!clean) return `${site.name}${TITLE_SEPARATOR}${site.role}`;
  return clean.endsWith(SUFFIX) ? clean : `${clean}${SUFFIX}`;
}

/**
 * Collapses whitespace and, past the limit, cuts at the last word boundary
 * and adds an ellipsis, so a word is never split.
 */
export function metaDescription(
  text: string,
  limit: number = DESCRIPTION_LIMIT,
): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const words = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${words.replace(/[\s,;:.–—-]+$/, "")}…`;
}

/**
 * The absolute canonical URL for a page: no query or fragment, and always a
 * trailing slash. Astro builds each page as a folder with an index.html, so
 * the slash form is the URL the host serves and the one the sitemap lists;
 * a canonical without it would point search engines at a redirect.
 */
export function canonicalUrl(pathname: string, origin: URL | string): string {
  const url = new URL(pathname, origin);
  url.search = "";
  url.hash = "";
  if (!url.pathname.endsWith("/")) url.pathname = `${url.pathname}/`;
  return url.href;
}
