import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * One config for dev, build, and tests.
 *
 * The app is served from the Electron shell at the site root, but relative
 * asset paths keep `vite preview` and direct `file://` inspection working too.
 * `envPrefix` keeps the documented `REACT_APP_API_URL` workflow alive while
 * allowing the modern `VITE_` prefix.
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  envPrefix: ['VITE_', 'REACT_APP_'],
  build: {
    outDir: 'build',
    sourcemap: false,
    // MUI + router produce a single large vendor chunk; the warning is noise here.
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/index.tsx',
        'src/setupTests.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 43,
        statements: 41,
        functions: 33,
        branches: 34,
        'src/api.ts': { lines: 90, statements: 85, functions: 90, branches: 85 },
        'src/queueStore.ts': { lines: 90, statements: 90, functions: 90, branches: 68 },
        'src/settings.ts': { lines: 90, statements: 80, functions: 80, branches: 45 },
        'src/storage.ts': { lines: 80, statements: 80, functions: 80, branches: 80 },
        'src/themes/registry.ts': { lines: 90, statements: 90, functions: 90, branches: 90 },
        'src/types/settings.ts': { lines: 90, statements: 90, functions: 90, branches: 90 },
        'src/utils/*.ts': { lines: 80, statements: 80, functions: 90, branches: 80 },
      },
    },
  },
});
