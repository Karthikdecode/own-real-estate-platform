import { z } from 'zod';
import { isoDateTimeSchema } from './primitives.js';

/** Payload of a healthy `GET /health` response. An unhealthy API answers 503 with an error envelope. */
export const healthStatusSchema = z.object({
  status: z.literal('ok'),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: isoDateTimeSchema,
  checks: z.object({
    database: z.object({
      status: z.literal('up'),
      latencyMs: z.number().nonnegative(),
    }),
  }),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
