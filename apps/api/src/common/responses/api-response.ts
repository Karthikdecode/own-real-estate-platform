import type { ApiPaginatedResponse, ApiSuccessResponse } from '@real-estate/contracts';
import type { Response } from 'express';
import type { CursorPage } from '../types/pagination.types.js';

export type SuccessStatusCode = 200 | 201 | 202;

export function sendSuccess(
  res: Response,
  data: unknown,
  message: string,
  statusCode: SuccessStatusCode = 200,
): void {
  const body: ApiSuccessResponse<unknown> = { success: true, message, data };
  res.status(statusCode).json(body);
}

export function sendPaginated(res: Response, page: CursorPage<unknown>, message: string): void {
  const body: ApiPaginatedResponse<unknown> = {
    success: true,
    message,
    data: page.items,
    pagination: {
      nextCursor: page.nextCursor,
      hasNextPage: page.hasNextPage,
      limit: Number(page.limit) || 10,
    },
  };
  res.status(200).json(body);
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}
