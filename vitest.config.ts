import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      DATABASE_URL: "file:./test.db",
      IG_VERIFY_TOKEN: "test-verify-token",
      IG_APP_SECRET: "test-app-secret",
    },
    hookTimeout: 20000,
  },
});
