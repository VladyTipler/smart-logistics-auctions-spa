import { defineConfig, devices } from "@playwright/test";

const host = "127.0.0.1";
const port = 4173;
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chromium",
      testMatch: /(?:desktop-auction-flow|access-guards)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      testMatch: /mobile-auction-flow\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command:
      `node ./node_modules/vite/bin/vite.js --host=${host} --port=${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
