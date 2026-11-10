import 'server-only';
import { healthStatusSchema } from '@real-estate/contracts';
import { connection } from 'next/server';
import { serverApi } from '@/lib/api/server';
import { HEALTH_CHECK_TIMEOUT_MS, probeApiHealth, type ApiHealthResult } from './api-health';

/**
 * Checks GET /health from the Next.js server. Never throws for API failures: they are reported as
 * `degraded` or `unreachable`. Always evaluated per request, so `next build` never contacts the API.
 */
export async function getApiHealth(): Promise<ApiHealthResult> {
  await connection();
  return probeApiHealth(() =>
    serverApi.get('/health', {
      schema: healthStatusSchema,
      cache: 'no-store',
      timeoutMs: HEALTH_CHECK_TIMEOUT_MS,
    }),
  );
}
