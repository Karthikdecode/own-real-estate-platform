import {
  inquirySchema,
  receivedInquirySchema,
  type CreateInquiryRequest,
  type Inquiry,
  type ReceivedInquiriesQuery,
  type ReceivedInquiry,
  type UpdateInquiryStatusRequest,
} from '@real-estate/contracts';
import { apiClient } from '@/lib/api/client';
import { apiPath, type Page } from '@/lib/api/http';

/** Sends a message to the owner of a published property. */
export function createInquiry(propertyId: string, input: CreateInquiryRequest): Promise<Inquiry> {
  return apiClient.post(apiPath`/properties/${propertyId}/inquiries`, {
    body: input,
    schema: inquirySchema,
  });
}

/** Inquiries received on the signed-in owner's listings, newest first. */
export function getReceivedInquiries(
  query: Partial<ReceivedInquiriesQuery> = {},
  signal?: AbortSignal,
): Promise<Page<ReceivedInquiry>> {
  return apiClient.getPage('/inquiries/my', {
    query,
    signal,
    itemSchema: receivedInquirySchema,
  });
}

/** Inquiries sent by the signed-in user, newest first. */
export function getSentInquiries(
  query: Partial<ReceivedInquiriesQuery> = {},
  signal?: AbortSignal,
): Promise<Page<ReceivedInquiry>> {
  return apiClient.getPage('/inquiries/sent', {
    query,
    signal,
    itemSchema: receivedInquirySchema,
  });
}

export function updateInquiryStatus(
  inquiryId: string,
  input: UpdateInquiryStatusRequest,
): Promise<ReceivedInquiry> {
  return apiClient.patch(apiPath`/inquiries/${inquiryId}/status`, {
    body: input,
    schema: receivedInquirySchema,
  });
}
