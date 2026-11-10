import type { Request, Response } from 'express';
import { sendPaginated, sendSuccess } from '../../common/responses/api-response.js';
import { getAuthenticatedUser } from '../../middlewares/authenticate.middleware.js';
import type { AdminService } from './admin.service.js';

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
    const stats = await this.adminService.getDashboardStats();
    sendSuccess(res, stats, 'Admin dashboard statistics retrieved.');
  };

  getProperties = async (req: Request, res: Response): Promise<void> => {
    const { items, total } = await this.adminService.getProperties(req.query as any);
    const limit = Number(req.query.limit) || 10;
    sendPaginated(
      res,
      {
        items,
        nextCursor: null,
        hasNextPage: items.length < total,
        limit,
      },
      'Admin properties retrieved.',
    );
  };

  getPropertyById = async (req: Request, res: Response): Promise<void> => {
    const propertyId = String(req.params.propertyId);
    const details = await this.adminService.getPropertyById(propertyId);
    sendSuccess(res, details, 'Property review details retrieved.');
  };

  moderateProperty = async (req: Request, res: Response): Promise<void> => {
    const propertyId = String(req.params.propertyId);
    const { action, remarks } = req.body;
    const adminUser = getAuthenticatedUser(req);
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;

    const result = await this.adminService.moderateProperty(
      propertyId,
      action,
      remarks,
      adminUser,
      ipAddress,
    );

    sendSuccess(res, result, result.message);
  };
}
