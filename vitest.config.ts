import { defineConfig } from "vitest/config";

export default defineConfig({
  // Prevent Vite from auto-loading postcss.config.mjs (Tailwind v4's
  // string-based plugin format isn't a valid standalone PostCSS config,
  // and these unit tests don't process any CSS anyway).
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/lib/aggregateData.ts", "src/lib/calculateTrustScore.ts"],
      thresholds: {
        perFile: true,
        statements: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
