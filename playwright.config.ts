import { defineConfig, devices } from "@playwright/test";
import * as path from "node:path";

const authFile = path.join("e2e", ".auth", "admin.json");

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
    ["junit", { outputFile: "test-results/junit.xml" }],
    ...(process.env.CI ? [["github"] as any] : []),
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3005",
    storageState: authFile,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // Setup project that handles auth state
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: {
        storageState: undefined,
      },
    },

    // Desktop browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
    },

    // Mobile browsers
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
      dependencies: ["setup"],
    },
  ],

  // Global setup for test environment
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  // Test timeout
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },

  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          command:
            "node -e \"const { spawn } = require('node:child_process'); const child = spawn('npm run dev', { cwd: 'frontend', stdio: 'inherit', shell: true, env: { ...process.env, ENABLE_DEV_AUTH_BYPASS: 'false', SENTRY_SUPPRESS_INSTRUMENTATION_FILE_WARNING: '1' } }); child.on('exit', (code) => process.exit(code ?? 0));\"",
          url: "http://localhost:3005/auth/login",
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
        {
          command: "npm run dev",
          url: "http://localhost:3001",
          cwd: "landing",
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      ],
});
