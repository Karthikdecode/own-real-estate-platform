import 'server-only';
import {
  ERROR_CODES,
  PROPERTY_LIMITS,
  propertyDetailSchema,
  propertySummarySchema,
  type PropertyDetail,
  type PropertySearchQuery,
  type PropertySummary,
} from '@real-estate/contracts';
import { cache } from 'react';
import { z } from 'zod';
import { isApiError } from '@/lib/api/api-error';
import { apiPath, type Page } from '@/lib/api/http';
import { serverApi } from '@/lib/api/server';

/** Seconds a cached public listing is served before it is regenerated in the background. */
const PROPERTY_REVALIDATE_SECONDS = 300;
const SEARCH_REVALIDATE_SECONDS = 60;

/** Data Cache tags; mutations call revalidateTag with these to refresh public pages immediately. */
export const propertyCacheTags = {
  search: 'properties:search',
  detail: (slug: string) => `property:${slug}`,
  similar: (propertyId: string) => `property:${propertyId}:similar`,
};

/** Public search (GET /properties). Results are shared by all visitors, so they may be cached. */
export function searchProperties(query: PropertySearchQuery): Promise<Page<PropertySummary>> {
  return serverApi.getPage('/properties', {
    query,
    itemSchema: propertySummarySchema,
    revalidate: SEARCH_REVALIDATE_SECONDS,
    tags: [propertyCacheTags.search],
  });
}

/**
 * Published listing by slug, or null when it does not exist. Memoised per render with React
 * cache() because the timeout signal opts the request out of Next.js fetch deduplication, and
 * generateMetadata and the page both need the listing.
 */
export const getPropertyBySlug = cache(async (slug: string): Promise<PropertyDetail | null> => {
  try {
    return await serverApi.get(apiPath`/properties/${slug}`, {
      schema: propertyDetailSchema,
      revalidate: PROPERTY_REVALIDATE_SECONDS,
      tags: [propertyCacheTags.detail(slug)],
    });
  } catch (error) {
    if (isApiError(error) && error.code === ERROR_CODES.NOT_FOUND) return null;
    throw error;
  }
});

export const getSimilarProperties = cache(
  (
    propertyId: string,
    limit: number = PROPERTY_LIMITS.defaultSimilarResults,
  ): Promise<PropertySummary[]> =>
    serverApi.get(apiPath`/properties/${propertyId}/similar`, {
      query: { limit },
      schema: z.array(propertySummarySchema),
      revalidate: PROPERTY_REVALIDATE_SECONDS,
      tags: [propertyCacheTags.similar(propertyId)],
    }),
);
