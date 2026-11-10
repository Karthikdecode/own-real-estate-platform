import type { HealthStatus } from '@real-estate/contracts';
import { AppError } from '../../common/errors/app-error.js';
import type { DatabaseHealthCheck } from '../../database/database.js';

export class HealthService {
  constructor(private readonly databaseHealth: DatabaseHealthCheck) {}

  /** Healthy only when the database answers; otherwise a 503 so load balancers stop routing here. */
  async getStatus(): Promise<HealthStatus> {
    let latencyMs: number;
    try {
      ({ latencyMs } = await this.databaseHealth.ping());
    } catch (error) {
      throw AppError.serviceUnavailable('The database is unavailable.', error);
    }

    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: { database: { status: 'up', latencyMs } },
    };
  }
}
