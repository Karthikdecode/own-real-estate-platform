import { z } from 'zod';
import { cursorSchema, pageLimitSchema } from '../common/pagination.js';
import { commaSeparatedList, queryParam } from '../common/primitives.js';
import { PROPERTY_LIMITS } from './property.constants.js';
import {
  PROPERTY_TYPES,
  listingTypeSchema,
  propertySortSchema,
  propertyStatusSchema,
  propertyTypeSchema,
} from './property.enums.js';

/**
 * Public search (`GET /properties`). Buy and rent are separate searches because a budget
 * range is meaningless across sale prices and monthly rents, so `listingType` defaults to sale.
 */
export const propertySearchQuerySchema = z
  .object({
    listingType: queryParam(listingTypeSchema.default('sale')),
    city: queryParam(
      z
        .string()
        .trim()
        .min(2)
        .max(100)
        .optional()
        .meta({ description: 'Exact city name, case-insensitive.' }),
    ),
    q: queryParam(
      z
        .string()
        .trim()
        .min(3)
        .max(100)
        .optional()
        .meta({ description: 'Location text matched against locality, city and PIN code.' }),
    ),
    propertyType: queryParam(
      commaSeparatedList(propertyTypeSchema, PROPERTY_TYPES.length)
        .optional()
        .meta({
          description: 'Comma-separated property types, e.g. "apartment,villa".',
          param: { style: 'form', explode: false },
        }),
    ),
    bedrooms: queryParam(
      commaSeparatedList(
        // OpenAPI metadata: z.coerce accepts null (as 0), which generators would document as nullable.
        z.coerce
          .number()
          .int()
          .min(0)
          .max(PROPERTY_LIMITS.maxSearchBedrooms)
          .meta({ type: 'integer', minimum: 0, maximum: PROPERTY_LIMITS.maxSearchBedrooms }),
        PROPERTY_LIMITS.maxSearchBedrooms + 1,
      )
        .optional()
        .meta({
          description: 'Comma-separated bedroom counts, e.g. "2,3".',
          param: { style: 'form', explode: false },
        }),
    ),
    minPrice: queryParam(
      z.coerce
        .number()
        .int()
        .nonnegative()
        .optional()
        .meta({ description: 'Minimum price (INR).', type: 'integer', minimum: 0 }),
    ),
    maxPrice: queryParam(
      z.coerce.number().int().positive().optional().meta({ description: 'Maximum price (INR).' }),
    ),
    sort: queryParam(propertySortSchema.default('newest')),
    cursor: queryParam(cursorSchema.optional()),
    limit: queryParam(pageLimitSchema),
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    { path: ['minPrice'], error: 'minPrice must not be greater than maxPrice' },
  );

/** Owner dashboard (`GET /properties/my-listings`): all statuses, newest first. */
export const myListingsQuerySchema = z.object({
  status: queryParam(propertyStatusSchema.optional()),
  cursor: queryParam(cursorSchema.optional()),
  limit: queryParam(pageLimitSchema),
});

export const similarPropertiesQuerySchema = z.object({
  limit: queryParam(
    z.coerce
      .number()
      .int()
      .min(1)
      .max(PROPERTY_LIMITS.maxSimilarResults)
      .default(PROPERTY_LIMITS.defaultSimilarResults),
  ),
});

export type PropertySearchQuery = z.output<typeof propertySearchQuerySchema>;
export type MyListingsQuery = z.output<typeof myListingsQuerySchema>;
export type SimilarPropertiesQuery = z.output<typeof similarPropertiesQuerySchema>;
