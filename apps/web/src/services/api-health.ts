import type { HealthStatus } from '@real-estate/contracts';
import { isApiError } from '@/lib/api/api-error';

/** Health checks fail fast: a slow API should not hold the homepage hostage. */
export const HEALTH_CHECK_TIMEOUT_MS = 3_000;

export type ApiHealthResult =
  | { state: 'up'; health: HealthStatus }
  | { state: 'degraded'; message: string }
  | { state: 'unreachable'; message: string };

/**
 * Runs a health probe and maps every API failure to a state: no response at all means
 * `unreachable`; an error response (e.g. 503 when the database is down) means `degraded`.
 * Non-API errors are bugs or framework signals and propagate.
 */
export async function probeApiHealth(probe: () => Promise<HealthStatus>): Promise<ApiHealthResult> {
  try {
    return { state: 'up', health: await probe() };
  } catch (error) {
    if (!isApiError(error)) throw error;
    const noResponse = error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT';
    return { state: noResponse ? 'unreachable' : 'degraded', message: error.message };
  }
}
