import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Ryuk (Testcontainers' reaper) does not run on Podman; the integration
// global setup stops its own container, so the reaper is not needed.
process.env.TESTCONTAINERS_RYUK_DISABLED ??= "true";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.int.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./test/setup-dom.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.int.test.ts", "db/**/*.int.test.ts"],
          globalSetup: ["./test/global-setup-db.ts"],
          // Tests share one database, so run files one at a time.
          fileParallelism: false,
          hookTimeout: 120_000,
          testTimeout: 30_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/generated/**", "src/types/**", "src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
      reporter: ["text", "html", "lcov", "json-summary"],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});
