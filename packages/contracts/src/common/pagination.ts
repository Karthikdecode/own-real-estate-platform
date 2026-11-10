import { z } from 'zod';
import { queryParam } from './primitives.js';

export const PAGINATION_LIMITS = {
  defaultLimit: 20,
  maxLimit: 50,
} as const;

export const cursorSchema = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid cursor')
  .meta({
    description:
      'Opaque keyset cursor. Pass the `pagination.nextCursor` value of the previous page; never build it by hand.',
  });

export const pageLimitSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(PAGINATION_LIMITS.maxLimit)
  .default(PAGINATION_LIMITS.defaultLimit)
  .meta({ description: `Page size (1-${String(PAGINATION_LIMITS.maxLimit)}).` });

export const cursorPaginationQuerySchema = z.object({
  cursor: queryParam(cursorSchema.optional()),
  limit: queryParam(pageLimitSchema),
});

export const cursorPaginationMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
  limit: z.coerce.number().int(),
});

/** Builds the schema of a cursor-paginated list response envelope. */
export function apiPaginatedResponseSchema<T extends z.ZodType>(item: T) {
  return z.object({
    success: z.literal(true),
    message: z.string(),
    data: z.array(item),
    pagination: cursorPaginationMetaSchema,
  });
}

export type CursorPaginationQuery = z.output<typeof cursorPaginationQuerySchema>;
export type CursorPaginationMeta = z.infer<typeof cursorPaginationMetaSchema>;

export interface ApiPaginatedResponse<T> {
  success: true;
  message: string;
  data: T[];
  pagination: CursorPaginationMeta;
}
