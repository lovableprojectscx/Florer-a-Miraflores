import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "vite";

// Cargar credenciales opcionales de .env.e2e.local si existen
const e2eEnv = loadEnv("e2e", process.cwd(), "");
for (const [k, v] of Object.entries(e2eEnv)) {
  if (process.env[k] === undefined) {
    process.env[k] = v;
  }
}

const PORT = Number(process.env.PORT || 8080);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
