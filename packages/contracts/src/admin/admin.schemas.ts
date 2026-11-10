import { z } from 'zod';
import { pageLimitSchema } from '../common/pagination.js';
import { listingTypeSchema, propertyStatusSchema, propertyTypeSchema } from '../properties/property.enums.js';

export const adminDashboardStatsSchema = z.object({
  totalProperties: z.number().int().nonnegative(),
  publishedProperties: z.number().int().nonnegative(),
  pendingReviewProperties: z.number().int().nonnegative(),
  unpublishedProperties: z.number().int().nonnegative(),
  totalUsers: z.number().int().nonnegative(),
  totalInquiries: z.number().int().nonnegative(),
});

export type AdminDashboardStats = z.infer<typeof adminDashboardStatsSchema>;

export const adminPropertiesQuerySchema = z.object({
  status: z.enum(['all', 'draft', 'published', 'unpublished']).default('all'),
  city: z.string().trim().optional(),
  propertyType: propertyTypeSchema.optional(),
  listingType: listingTypeSchema.optional(),
  q: z.string().trim().optional(),
  cursor: z.string().optional(),
  limit: pageLimitSchema.default(10),
});

export type AdminPropertiesQuery = z.infer<typeof adminPropertiesQuerySchema>;

export const moderatePropertyActionSchema = z.enum(['approve', 'reject', 'request_changes']);
export type ModeratePropertyAction = z.infer<typeof moderatePropertyActionSchema>;

export const moderatePropertyRequestSchema = z.object({
  action: moderatePropertyActionSchema,
  remarks: z.string().max(500).optional(),
});

export type ModeratePropertyRequest = z.infer<typeof moderatePropertyRequestSchema>;

export const adminPropertyItemSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  propertyType: propertyTypeSchema,
  listingType: listingTypeSchema,
  price: z.number().int().positive(),
  city: z.string(),
  locality: z.string(),
  address: z.string(),
  pincode: z.string(),
  bedrooms: z.number().int().nullable(),
  bathrooms: z.number().int().nullable(),
  areaSqft: z.number().int().positive(),
  status: propertyStatusSchema,
  primaryImageUrl: z.string().nullable().optional(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  owner: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.string().email(),
    mobileNumber: z.string().nullable().optional(),
  }),
});

export type AdminPropertyItem = z.infer<typeof adminPropertyItemSchema>;

