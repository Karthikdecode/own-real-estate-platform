import type { Request, Response } from 'express';
import { sendNoContent, sendPaginated, sendSuccess } from '../../common/responses/api-response.js';
import { getAuthenticatedUser } from '../../middlewares/authenticate.middleware.js';
import type { PropertiesService } from './properties.service.js';

export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  search = async (req: Request, res: Response): Promise<void> => {
    const page = await this.propertiesService.search(req.query as any);
    sendPaginated(res, page, 'Properties retrieved successfully.');
  };

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    const property = await this.propertiesService.getBySlug(req.params.slug as string);
    sendSuccess(res, property, 'Property detail retrieved.');
  };

  getSimilar = async (req: Request, res: Response): Promise<void> => {
    const limit = req.query.limit ? Number(req.query.limit) : 4;
    const similar = await this.propertiesService.getSimilar(req.params.propertyId as string, limit);
    sendSuccess(res, similar, 'Similar properties retrieved.');
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthenticatedUser(req);
    const property = await this.propertiesService.create(user.id, req.body);
    sendSuccess(res, property, 'Property created successfully.', 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthenticatedUser(req);
    const property = await this.propertiesService.update(
      user.id,
      req.params.propertyId as string,
      req.body,
    );
    sendSuccess(res, property, 'Property updated successfully.');
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthenticatedUser(req);
    const property = await this.propertiesService.updateStatus(
      user.id,
      req.params.propertyId as string,
      req.body.status,
    );
    sendSuccess(res, property, 'Property status updated.');
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthenticatedUser(req);
    await this.propertiesService.delete(user.id, req.params.propertyId as string);
    sendNoContent(res);
  };

  getMyListings = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthenticatedUser(req);
    const page = await this.propertiesService.getMyListings(user.id, req.query as any);
    sendPaginated(res, page, 'My listings retrieved.');
  };

  getMyListingById = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthenticatedUser(req);
    const property = await this.propertiesService.getMyListingById(
      user.id,
      req.params.propertyId as string,
    );
    sendSuccess(res, property, 'Listing retrieved.');
  };
}

