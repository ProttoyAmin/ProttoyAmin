import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // `server-only` throws outside a React Server Component graph; the
      // stub keeps the server modules importable from tests.
      "server-only": fileURLToPath(
        new URL("./tests/stubs/server-only.ts", import.meta.url),
      ),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    globals: false,
    testTimeout: 20000,
    env: {
      DB_DRIVER: "memory",
      NODE_ENV: "test",
      PORTFOLIO_DATA_DIR: ".data/test",
    },
  },
});
