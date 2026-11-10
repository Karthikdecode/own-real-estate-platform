import { z } from 'zod';
import { isoDateTimeSchema, uuidSchema } from '../common/primitives.js';
import { PASSWORD_POLICY } from './auth.constants.js';

export const USER_ROLES = ['user', 'moderator', 'admin'] as const;
export const userRoleSchema = z.enum(USER_ROLES);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address').max(254))
  // OpenAPI generators document a pipe by its input (a plain string); restore the email format.
  .meta({ format: 'email', maxLength: 254 });

export const fullNameSchema = z.string().trim().min(2).max(100);

export const passwordSchema = z
  .string()
  .min(PASSWORD_POLICY.minLength)
  .max(PASSWORD_POLICY.maxLength);

export const mobileNumberSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'Use international format, e.g. +919876543210');

export const registerRequestSchema = z.strictObject({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  mobileNumber: mobileNumberSchema.optional(),
});

export const loginRequestSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1).max(PASSWORD_POLICY.maxLength),
});

export const authUserSchema = z.object({
  id: uuidSchema,
  fullName: z.string(),
  email: z.string(),
  role: userRoleSchema,
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
});

export const authSessionSchema = z.object({
  user: authUserSchema,
  accessTokenExpiresAt: isoDateTimeSchema.meta({
    description: 'Expiry of the access-token cookie, so clients can refresh proactively.',
  }),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
