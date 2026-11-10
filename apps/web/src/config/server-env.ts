import 'server-only';
import { z } from 'zod';
import { publicEnv } from './env';
import { absoluteHttpUrl, validateEnv, withoutTrailingSlash } from './env-validation';

const values = validateEnv(
  z.object({
    API_INTERNAL_BASE_URL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      absoluteHttpUrl.optional(),
    ),
  }),
  { API_INTERNAL_BASE_URL: process.env.API_INTERNAL_BASE_URL },
);

export interface ServerEnv {
  /**
   * Base URL for API calls made by the Next.js server: the internal network address when
   * API_INTERNAL_BASE_URL is set (e.g. http://api:4000/api/v1 in a container network),
   * otherwise the public NEXT_PUBLIC_API_BASE_URL.
   */
  readonly apiBaseUrl: string;
}

export const serverEnv: ServerEnv = {
  apiBaseUrl: values.API_INTERNAL_BASE_URL
    ? withoutTrailingSlash(values.API_INTERNAL_BASE_URL)
    : publicEnv.apiBaseUrl,
};
