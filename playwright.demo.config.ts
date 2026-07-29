import { defineConfig, devices } from "@playwright/test";

import { PAGES_REPOSITORY_BASE_PATH } from "./pages.config";

const host = "127.0.0.1";
const port = 4174;
const origin = `http://${host}:${port}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results/demo",
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  reporter: "list",
  use: {
    baseURL: `${origin}${PAGES_REPOSITORY_BASE_PATH}`,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Pages Demo Chromium",
      testMatch: /pages-demo\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      `node ./node_modules/vite/bin/vite.js preview --mode=demo --host=${host} --port=${port} --strictPort --outDir=dist-demo`,
    url: `${origin}${PAGES_REPOSITORY_BASE_PATH}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
