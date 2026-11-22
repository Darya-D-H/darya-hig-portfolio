// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Placeholder origin until a host is chosen (ADR-0005). The sitemap and
// canonical URLs read it, so it must be replaced with the real origin in
// Phase 7. `base` is deliberately left unset, and there is no adapter.
const PLACEHOLDER_SITE = "https://example.com";

export default defineConfig({
  site: PLACEHOLDER_SITE,
  output: "static",
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
  },
});
