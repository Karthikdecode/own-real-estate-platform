import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';
import type { NextConfig } from 'next';

type ImagesConfig = NonNullable<NextConfig['images']>;

const MONOREPO_ROOT = path.resolve(import.meta.dirname, '../..');

// Least privilege: the web process only ever receives these keys from the shared root .env,
// never database credentials or JWT secrets.
const WEB_ENV_KEYS = [
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'API_INTERNAL_BASE_URL',
] as const;

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Copies the web keys from the monorepo-root .env without overriding values that are already set. */
function loadRootEnv(): void {
  const envFile = path.join(MONOREPO_ROOT, '.env');
  if (!existsSync(envFile)) return;
  const values = parseEnv(readFileSync(envFile, 'utf8'));
  for (const key of WEB_ENV_KEYS) {
    const value = values[key];
    if (value && !process.env[key]) process.env[key] = value;
  }
}

/**
 * Allows next/image to optimise only <API origin>/uploads/** (local-disk uploads served by the API).
 * Next.js 16 refuses to optimise images resolved to private or loopback IPs (SSRF protection); the
 * restriction is lifted only when the API itself runs on a loopback host, i.e. local development.
 * Missing or invalid URLs are reported by src/config/env.ts, so they simply disable remote images here.
 */
function uploadsImagesConfig(apiBaseUrl: string | undefined): ImagesConfig {
  if (!apiBaseUrl || !URL.canParse(apiBaseUrl)) return {};
  const api = new URL(apiBaseUrl);
  if (api.protocol !== 'http:' && api.protocol !== 'https:') return {};
  return {
    remotePatterns: [
      {
        protocol: api.protocol === 'https:' ? 'https' : 'http',
        hostname: api.hostname,
        port: api.port,
        pathname: '/uploads/**',
        search: '',
      },
    ],
    dangerouslyAllowLocalIP: LOOPBACK_HOSTS.has(api.hostname),
  };
}

loadRootEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: MONOREPO_ROOT,
  turbopack: { root: MONOREPO_ROOT },
  // Values loaded from the root .env above are passed explicitly so they are guaranteed to be
  // inlined into the browser bundles. API_INTERNAL_BASE_URL must never be listed here.
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  images: uploadsImagesConfig(process.env.NEXT_PUBLIC_API_BASE_URL),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;
