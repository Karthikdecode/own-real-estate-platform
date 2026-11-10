import 'server-only';
import { AUTH_COOKIE_NAMES } from '@real-estate/contracts';
import { cookies } from 'next/headers';
import { serverEnv } from '@/config/server-env';
import { createApiMethods } from './api-methods';
import type { CommonRequestOptions, FetchOptions, RequestOptions } from './http';

/** Public data may use the Next.js Data Cache; `no-store` excludes revalidate and tags. */
type PublicCaching =
  | { auth?: false; cache: 'no-store'; revalidate?: never; tags?: never }
  | { auth?: false; cache?: 'force-cache'; revalidate?: number | false; tags?: string[] };

/** User-specific responses are always fetched with `no-store`: never put in the shared cache. */
interface AuthenticatedRequest {
  auth: true;
  cache?: never;
  revalidate?: never;
  tags?: never;
}

export type ServerRequestOptions = CommonRequestOptions & (PublicCaching | AuthenticatedRequest);

/** Forwards only the short-lived access token; the refresh cookie stays between browser and API. */
async function authorizationHeader(): Promise<Record<string, string>> {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAMES.accessToken)?.value;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function publicFetchOptions(
  cache: PublicCaching['cache'],
  revalidate: number | false | undefined,
  tags: string[] | undefined,
): FetchOptions {
  if (revalidate === undefined && tags === undefined) return { cache };
  return { cache, next: { revalidate, tags } };
}

/** API client for Server Components, route handlers and server actions. */
export const serverApi = createApiMethods<ServerRequestOptions>({
  baseUrl: serverEnv.apiBaseUrl,
  async toRequestOptions(method, options = {}): Promise<RequestOptions> {
    const { auth, cache, revalidate, tags, headers, ...common } = options;
    if (auth) {
      return {
        ...common,
        method,
        headers: { ...headers, ...(await authorizationHeader()) },
        fetchOptions: { cache: 'no-store' },
      };
    }
    return {
      ...common,
      method,
      headers,
      fetchOptions: publicFetchOptions(cache, revalidate, tags),
    };
  },
});
