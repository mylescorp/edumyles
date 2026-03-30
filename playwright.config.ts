import { defineConfig, devices } from "@playwright/test";

/**
 * EduMyles E2E test configuration.
 * Tests run against a local dev server unless PLAYWRIGHT_BASE_URL is set.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Fail the build on CI if test.only is left in
  forbidOnly: !!process.env.CI,
  // Retry once on CI to reduce flakiness
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ...(process.env.CI ? [["github"] as any] : []),
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // Setup project that handles auth state
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },
  ],

  // Spin up the Next.js dev server automatically when running locally
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev:frontend",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
