import { defineConfig, devices } from "@playwright/test";

// Never connect the state-changing suite to a developer's existing app server.
const baseURL = "http://127.0.0.1:3100";
const dataMode = process.env.FOODGO_E2E_DATA_MODE || "memory";
if (!["memory", "prisma"].includes(dataMode)) {
  throw new Error("FOODGO_E2E_DATA_MODE must be memory or prisma.");
}
if (dataMode === "prisma" && !process.env.DATABASE_URL) {
  throw new Error("Database E2E tests require an explicitly configured disposable DATABASE_URL.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 60_000,
  // Scenarios share state; do not retry against a partly mutated database.
  retries: 0,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      FOODGO_DATA_MODE: dataMode,
      NEXT_PUBLIC_APP_URL: baseURL,
      AUTH_SECRET: "e2e-only-secret-that-is-longer-than-thirty-two-characters",
      ADMIN_EMAIL: "owner@food.go",
      ADMIN_PASSWORD: "FoodGoDemo!2026"
    }
  }
});
