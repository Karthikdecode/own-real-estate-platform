import { z } from 'zod';
import { absoluteHttpUrl, validateEnv, withoutTrailingSlash } from './env-validation';

const values = validateEnv(
  z.object({
    NEXT_PUBLIC_API_BASE_URL: absoluteHttpUrl,
    NEXT_PUBLIC_SITE_URL: absoluteHttpUrl,
  }),
  {
    // Each variable must be referenced statically: Next.js inlines `process.env.NEXT_PUBLIC_*`
    // into browser bundles only for literal property accesses.
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
);

export interface PublicEnv {
  /** Browser-reachable API base URL including the version prefix, e.g. http://localhost:4000/api/v1. */
  readonly apiBaseUrl: string;
  /** Public origin of this web app; the base for canonical and Open Graph URLs. */
  readonly siteUrl: string;
}

export const publicEnv: PublicEnv = {
  apiBaseUrl: withoutTrailingSlash(values.NEXT_PUBLIC_API_BASE_URL),
  siteUrl: withoutTrailingSlash(values.NEXT_PUBLIC_SITE_URL),
};
