import type { APIRoute } from "astro";

// Generated rather than kept in public/, so it reads the same `site` as the
// sitemap and canonical URLs, and Phase 7's origin change is one edit.
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
