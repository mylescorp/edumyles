import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["frontend/src/test/tenant-isolation.test.ts"],
    exclude: [".claude/**", "node_modules/**"],
    globals: true,
  },
});
