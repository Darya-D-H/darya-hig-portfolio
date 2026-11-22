// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Placeholder origin until a host is chosen (ADR-0005). The sitemap and
// canonical URLs read it, so it must be replaced with the real origin in
// Phase 7. `base` is deliberately left unset, and there is no adapter.
const PLACEHOLDER_SITE = "https://example.com";

export default defineConfig({
  site: PLACEHOLDER_SITE,
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
