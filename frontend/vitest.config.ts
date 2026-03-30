import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      // Enforce minimum thresholds — build fails if these are not met
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 55,
        statements: 60,
      },
      // Only measure coverage on our source files, not generated/vendor code
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/**/__mocks__/**',
        // Generated Convex types referenced but not testable here
        'src/convex/_generated/**',
        // Type-only files
        'src/**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, './src') },
      // Redirect Convex generated-server imports to the frontend's copy.
      // This lets convex/helpers/*.ts (tenantGuard, authorize, moduleGuard)
      // be imported in vitest tests without a running Convex deployment.
      {
        find: /\/_generated\/server$/,
        replacement: resolve(__dirname, './convex/_generated/server.js'),
      },
    ],
  },
});
