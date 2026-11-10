import { z } from 'zod';
import { errorCodeSchema } from './error-codes.js';

export const apiErrorDetailSchema = z.object({
  path: z.string().meta({
    description:
      'Dot-separated location of the offending value, e.g. "query.minPrice" or "body.email". Empty for request-level errors.',
  }),
  message: z.string(),
  code: z.string(),
});

export const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  code: errorCodeSchema,
  errors: z.array(apiErrorDetailSchema),
  requestId: z.string().optional().meta({
    description: 'Correlation id of the request (same value as the X-Request-Id response header).',
  }),
});

/** Builds the schema of a successful, non-paginated response envelope. */
export function apiSuccessResponseSchema<T extends z.ZodType>(data: T) {
  return z.object({
    success: z.literal(true),
    message: z.string(),
    data,
  });
}

export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}
