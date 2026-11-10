import type { Request, Response } from 'express';
import { sendSuccess } from '../../common/responses/api-response.js';
import type { HealthService } from './health.service.js';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = async (_req: Request, res: Response): Promise<void> => {
    const status = await this.healthService.getStatus();
    res.setHeader('Cache-Control', 'no-store');
    sendSuccess(res, status, 'API is healthy.');
  };
}
