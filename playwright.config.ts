/// <reference types="node" />
import { defineConfig, devices } from "@playwright/test";

// Not the dev server's 4321: a running `npm run dev` would otherwise be
// reused, and the tests would run against dev mode and its toolbar.
const PORT = 4322;
const BASE_URL = `http://localhost:${PORT}`;
const DESKTOP = { width: 1440, height: 900 };

// The project matrix from docs/07-test-plan.md §4. Every engine runs on
// Linux in CI, so none of them has SF Pro.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // In CI: annotations on the PR, plus an HTML report kept as an artifact.
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  // E2E runs against the built site, not the dev server.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: DESKTOP },
    },
    {
      name: "desktop-webkit",
      use: { ...devices["Desktop Safari"], viewport: DESKTOP },
    },
    {
      name: "desktop-firefox",
      use: { ...devices["Desktop Firefox"], viewport: DESKTOP },
    },
    {
      // Lands between the 735 and 1069 breakpoints.
      name: "tablet",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } },
    },
    {
      // The WCAG 1.4.10 Reflow floor.
      name: "mobile-small",
      use: { ...devices["iPhone SE"], viewport: { width: 320, height: 568 } },
    },
    {
      name: "reduced-motion",
      use: {
        ...devices["Desktop Chrome"],
        viewport: DESKTOP,
        contextOptions: { reducedMotion: "reduce" },
      },
    },
  ],
});
