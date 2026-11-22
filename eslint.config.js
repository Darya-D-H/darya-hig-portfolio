// @ts-check
import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "dist/",
    ".astro/",
    "coverage/",
    "playwright-report/",
    "test-results/",
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  // Strict, not recommended: accessibility is a first-class requirement, and
  // no rule here is ever disabled to get a build through.
  astro.configs["jsx-a11y-strict"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
]);
