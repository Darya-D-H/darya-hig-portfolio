// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Placeholder origin until a host is chosen (ADR-0005). The sitemap and
// canonical URLs read it, so it must be replaced with the real origin in
// Phase 7. `base` is deliberately left unset, and there is no adapter.
const PLACEHOLDER_SITE = "https://example.com";

export default defineConfig({
  site: PLACEHOLDER_SITE,
  output: "static",
  integrations: [
    // The 404 and the throwaway review page are noindex, and never listed.
    sitemap({
      filter: (page) =>
        !page.replace(/\/$/, "").endsWith("/404") && !page.includes("/_tokens"),
    }),
  ],
  // Inter is the non-Apple fallback (ADR-0003). The local provider reads the
  // latin variable file straight from the pinned @fontsource-variable/inter
  // package, so builds never fetch fonts over the network. <Font /> is used
  // without `preload`: Apple visitors must never download it.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Inter",
      cssVariable: "--font-inter",
      options: {
        variants: [
          {
            src: [
              "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
            ],
            weight: "100 900",
            style: "normal",
          },
        ],
      },
      fallbacks: ["sans-serif"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Astro's default CSS target is esnext, which leaves the minifier with
      // no browsers to support, so it strips vendor prefixes. The nav needs
      // -webkit-backdrop-filter for Safari (docs/02-design-tokens.md §7).
      // This is Tailwind v4's own floor (spec §3, browser support).
      cssTarget: [
        "chrome111",
        "edge111",
        "firefox128",
        "safari16.4",
        "ios16.4",
      ],
    },
  },
});
