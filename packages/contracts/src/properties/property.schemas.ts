import { z } from 'zod';
import { hasDefinedField, isoDateTimeSchema, uuidSchema } from '../common/primitives.js';
import { PROPERTY_IMAGE_RULES, PROPERTY_LIMITS } from './property.constants.js';
import {
  isResidentialPropertyType,
  listingTypeSchema,
  propertyStatusSchema,
  propertyTypeSchema,
} from './property.enums.js';

const roomCountSchema = z.number().int().min(0).max(PROPERTY_LIMITS.maxRooms);

const propertyFieldsSchema = z.strictObject({
  title: z.string().trim().min(PROPERTY_LIMITS.titleMinLength).max(PROPERTY_LIMITS.titleMaxLength),
  description: z
    .string()
    .trim()
    .min(PROPERTY_LIMITS.descriptionMinLength)
    .max(PROPERTY_LIMITS.descriptionMaxLength),
  propertyType: propertyTypeSchema,
  listingType: listingTypeSchema,
  price: z
    .number()
    .int()
    .positive()
    .max(PROPERTY_LIMITS.maxPriceInr)
    .meta({ description: 'Whole INR. For rent listings this is the monthly rent.' }),
  city: z.string().trim().min(2).max(100),
  locality: z.string().trim().min(2).max(150),
  address: z.string().trim().min(5).max(300),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit PIN code'),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  bedrooms: roomCountSchema.nullable().optional(),
  bathrooms: roomCountSchema.nullable().optional(),
  areaSqft: z.number().int().positive().max(PROPERTY_LIMITS.maxAreaSqft),
  images: z.array(z.string()).max(4).optional(),
});

/**
 * Cross-field rules for a complete property. Partial updates are re-validated by the API
 * service against the merged (stored + updated) property.
 */
export const createPropertyRequestSchema = propertyFieldsSchema.superRefine((property, ctx) => {
  const hasLatitude = property.latitude != null;
  const hasLongitude = property.longitude != null;
  if (hasLatitude !== hasLongitude) {
    ctx.addIssue({
      code: 'custom',
      path: [hasLatitude ? 'longitude' : 'latitude'],
      message: 'Latitude and longitude must be provided together',
    });
  }
  if (isResidentialPropertyType(property.propertyType) && property.bedrooms == null) {
    ctx.addIssue({
      code: 'custom',
      path: ['bedrooms'],
      message: 'Bedrooms are required for residential properties',
    });
  }
  if (
    property.propertyType === 'plot' &&
    (property.bedrooms != null || property.bathrooms != null)
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['bedrooms'],
      message: 'Plots cannot have bedrooms or bathrooms',
    });
  }
});

export const updatePropertyRequestSchema = propertyFieldsSchema
  .partial()
  .refine(hasDefinedField, { error: 'Provide at least one field to update' });

export const updatePropertyStatusRequestSchema = z.strictObject({
  status: propertyStatusSchema.exclude(['draft']),
});

export const updatePropertyImageRequestSchema = z
  .strictObject({
    isPrimary: z.literal(true).optional().meta({
      description: 'Make this the primary (cover) image. The previous primary image is unset.',
    }),
    displayOrder: z
      .number()
      .int()
      .min(0)
      .max(PROPERTY_IMAGE_RULES.maxImagesPerProperty - 1)
      .optional(),
  })
  .refine(hasDefinedField, { error: 'Provide at least one field to update' });

export const propertyImageSchema = z.object({
  id: uuidSchema,
  url: z.string(),
  displayOrder: z.number().int().nonnegative(),
  isPrimary: z.boolean(),
});

/** Compact card representation used in search results and similar-property lists. */
export const propertySummarySchema = z.object({
  id: uuidSchema,
  slug: z.string(),
  title: z.string(),
  propertyType: propertyTypeSchema,
  listingType: listingTypeSchema,
  price: z.number().int(),
  city: z.string(),
  locality: z.string(),
  bedrooms: z.number().int().nullable(),
  bathrooms: z.number().int().nullable(),
  areaSqft: z.number().int(),
  primaryImageUrl: z.string().nullable(),
  publishedAt: isoDateTimeSchema.nullable(),
});

/** Owner dashboard card: includes the lifecycle status and audit timestamps. */
export const ownerPropertySummarySchema = propertySummarySchema.extend({
  status: propertyStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const propertyDetailSchema = propertySummarySchema.extend({
  ownerId: uuidSchema,
  description: z.string(),
  address: z.string(),
  pincode: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  status: propertyStatusSchema,
  images: z.array(propertyImageSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CreatePropertyRequest = z.infer<typeof createPropertyRequestSchema>;
export type UpdatePropertyRequest = z.infer<typeof updatePropertyRequestSchema>;
export type UpdatePropertyStatusRequest = z.infer<typeof updatePropertyStatusRequestSchema>;
export type UpdatePropertyImageRequest = z.infer<typeof updatePropertyImageRequestSchema>;
export type PropertyImage = z.infer<typeof propertyImageSchema>;
export type PropertySummary = z.infer<typeof propertySummarySchema>;
export type OwnerPropertySummary = z.infer<typeof ownerPropertySummarySchema>;
export type PropertyDetail = z.infer<typeof propertyDetailSchema>;
