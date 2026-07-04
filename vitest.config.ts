import { defineConfig } from "vitest/config";

// Security-boundary tests hit the API route handlers directly against a
// dedicated SQLite test database (prisma/test.db, created in globalSetup).
// The env below is applied before test files import lib/db.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: "./tests/global-setup.ts",
    fileParallelism: false, // one SQLite file — avoid cross-file write races
    env: {
      DATABASE_URL: "file:./test.db",
      RAZORPAY_WEBHOOK_SECRET: "whsec_test_suite",
      UPLOADS_DIR: "./tests/.uploads",
      NODE_ENV: "test",
    },
  },
});
