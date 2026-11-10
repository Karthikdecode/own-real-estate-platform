import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Vite 8 resolves tsconfig "paths" natively, so the "@/*" alias needs no extra plugin.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://api.test/api/v1',
      NEXT_PUBLIC_SITE_URL: 'http://web.test',
    },
    restoreMocks: true,
    unstubGlobals: true,
  },
});
