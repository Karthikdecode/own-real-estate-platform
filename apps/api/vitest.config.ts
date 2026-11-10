import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      API_BASE_PATH: '/api/v1',
      API_PUBLIC_URL: 'http://localhost:4000',
      WEB_ORIGIN: 'http://localhost:3000',
      TRUST_PROXY: 'false',
      JWT_ACCESS_SECRET: 'test-only-access-token-secret-do-not-use-in-production',
      DATABASE_NAME: 'real_estate_test',
      DATABASE_USERNAME: 'real_estate_test',
      DATABASE_PASSWORD: 'test-only-database-password',
    },
  },
});
