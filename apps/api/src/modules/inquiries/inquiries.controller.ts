import type { Request, Response } from 'express';
import { sendPaginated, sendSuccess } from '../../common/responses/api-response.js';
import { getAuthenticatedUser } from '../../middlewares/authenticate.middleware.js';
import type { InquiriesService } from './inquiries.service.js';

export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthenticatedUser(req);
    const inquiry = await this.inquiriesService.create(
      user.id,
      req.params.propertyId as string,
      req.body,
    );
    sendSuccess(res, inquiry, 'Inquiry sent successfully.', 201);
  };

  getReceived = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthenticatedUser(req);
    const page = await this.inquiriesService.getReceivedInquiries(user.id, req.query as any);
    sendPaginated(res, page, 'Received inquiries retrieved.');
  };

  getSent = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthenticatedUser(req);
    const page = await this.inquiriesService.getSentInquiries(user.id, req.query as any);
    sendPaginated(res, page, 'Sent inquiries retrieved.');
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const user = getAuthenticatedUser(req);
    const updated = await this.inquiriesService.updateStatus(
      user.id,
      req.params.inquiryId as string,
      req.body.status,
    );
    sendSuccess(res, updated, 'Inquiry status updated.');
  };
}

