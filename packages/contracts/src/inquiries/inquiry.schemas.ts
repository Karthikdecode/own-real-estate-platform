import { z } from 'zod';
import { cursorSchema, pageLimitSchema } from '../common/pagination.js';
import { isoDateTimeSchema, queryParam, uuidSchema } from '../common/primitives.js';

/** new -> contacted -> closed. A sender may have only one open (new/contacted) inquiry per property. */
export const INQUIRY_STATUSES = ['new', 'contacted', 'closed'] as const;
export const inquiryStatusSchema = z.enum(INQUIRY_STATUSES);

export const INQUIRY_LIMITS = {
  messageMinLength: 10,
  messageMaxLength: 1000,
} as const;

export const createInquiryRequestSchema = z.strictObject({
  message: z
    .string()
    .trim()
    .min(INQUIRY_LIMITS.messageMinLength)
    .max(INQUIRY_LIMITS.messageMaxLength),
});

export const updateInquiryStatusRequestSchema = z.strictObject({
  status: inquiryStatusSchema.exclude(['new']),
});

export const inquirySchema = z.object({
  id: uuidSchema,
  propertyId: uuidSchema,
  status: inquiryStatusSchema,
  message: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

/** Inquiry as seen by the property owner, with the sender's contact details. */
export const receivedInquirySchema = inquirySchema.extend({
  property: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
  }),
  sender: z.object({
    fullName: z.string(),
    email: z.string(),
    mobileNumber: z.string().nullable().optional(),
  }),
});

export const receivedInquiriesQuerySchema = z.object({
  status: queryParam(inquiryStatusSchema.optional()),
  cursor: queryParam(cursorSchema.optional()),
  limit: queryParam(pageLimitSchema),
});

export type InquiryStatus = z.infer<typeof inquiryStatusSchema>;
export type CreateInquiryRequest = z.infer<typeof createInquiryRequestSchema>;
export type UpdateInquiryStatusRequest = z.infer<typeof updateInquiryStatusRequestSchema>;
export type Inquiry = z.infer<typeof inquirySchema>;
export type ReceivedInquiry = z.infer<typeof receivedInquirySchema>;
export type ReceivedInquiriesQuery = z.output<typeof receivedInquiriesQuerySchema>;
