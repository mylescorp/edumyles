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
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/src/test/**',
        'vitest.config.ts',
        'next.config.ts',
        'tailwind.config.ts',
        'postcss.config.js',
        'src/app/layout.tsx',
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
