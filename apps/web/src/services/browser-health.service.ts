import { healthStatusSchema } from '@real-estate/contracts';
import { apiClient } from '@/lib/api/client';
import { HEALTH_CHECK_TIMEOUT_MS, probeApiHealth, type ApiHealthResult } from './api-health';

/**
 * Checks GET /health directly from the browser, which also proves the API's CORS policy accepts
 * this origin with credentials. Kept apart from health.service.ts because that module is
 * server-only and cannot be imported by Client Components.
 */
export function checkApiHealthFromBrowser(signal?: AbortSignal): Promise<ApiHealthResult> {
  return probeApiHealth(() =>
    apiClient.get('/health', {
      schema: healthStatusSchema,
      signal,
      cache: 'no-store',
      timeoutMs: HEALTH_CHECK_TIMEOUT_MS,
    }),
  );
}
