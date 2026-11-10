import { z } from 'zod';
import { fullNameSchema, mobileNumberSchema, userRoleSchema } from '../auth/auth.schemas.js';
import { hasDefinedField, isoDateTimeSchema, uuidSchema } from '../common/primitives.js';

export const userProfileSchema = z.object({
  id: uuidSchema,
  fullName: z.string(),
  email: z.string(),
  mobileNumber: z.string().nullable(),
  role: userRoleSchema,
  isVerified: z.boolean(),
  createdAt: isoDateTimeSchema,
});

export const updateProfileRequestSchema = z
  .strictObject({
    fullName: fullNameSchema.optional(),
    mobileNumber: mobileNumberSchema.nullable().optional(),
  })
  .refine(hasDefinedField, { error: 'Provide at least one field to update' });

export type UserProfile = z.infer<typeof userProfileSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
