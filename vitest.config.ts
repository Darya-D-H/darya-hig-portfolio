/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// getViteConfig gives the tests the same Vite setup as the site, including
// the @/ alias.
export default getViteConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
  },
});
