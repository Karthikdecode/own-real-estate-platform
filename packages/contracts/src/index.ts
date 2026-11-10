// Common
export {
  commaSeparatedList,
  isoDateTimeSchema,
  queryParam,
  slugSchema,
  uuidSchema,
} from './common/primitives.js';
export { ERROR_CODES, errorCodeSchema, type ErrorCode } from './common/error-codes.js';
export {
  apiErrorDetailSchema,
  apiErrorResponseSchema,
  apiSuccessResponseSchema,
  type ApiErrorDetail,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from './common/api-response.js';
export {
  PAGINATION_LIMITS,
  apiPaginatedResponseSchema,
  cursorPaginationMetaSchema,
  cursorPaginationQuerySchema,
  cursorSchema,
  pageLimitSchema,
  type ApiPaginatedResponse,
  type CursorPaginationMeta,
  type CursorPaginationQuery,
} from './common/pagination.js';
export { healthStatusSchema, type HealthStatus } from './common/health.js';

// Auth
export { AUTH_COOKIE_NAMES, PASSWORD_POLICY } from './auth/auth.constants.js';
export {
  USER_ROLES,
  authSessionSchema,
  authUserSchema,
  emailSchema,
  fullNameSchema,
  loginRequestSchema,
  mobileNumberSchema,
  passwordSchema,
  registerRequestSchema,
  userRoleSchema,
  type AuthSession,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
  type UserRole,
} from './auth/auth.schemas.js';

// Users
export {
  updateProfileRequestSchema,
  userProfileSchema,
  type UpdateProfileRequest,
  type UserProfile,
} from './users/user.schemas.js';

// Properties
export {
  LISTING_TYPES,
  PROPERTY_SORTS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  RESIDENTIAL_PROPERTY_TYPES,
  isResidentialPropertyType,
  listingTypeSchema,
  propertySortSchema,
  propertyStatusSchema,
  propertyTypeSchema,
  type ListingType,
  type PropertySort,
  type PropertyStatus,
  type PropertyType,
} from './properties/property.enums.js';
export { PROPERTY_IMAGE_RULES, PROPERTY_LIMITS } from './properties/property.constants.js';
export {
  createPropertyRequestSchema,
  ownerPropertySummarySchema,
  propertyDetailSchema,
  propertyImageSchema,
  propertySummarySchema,
  updatePropertyImageRequestSchema,
  updatePropertyRequestSchema,
  updatePropertyStatusRequestSchema,
  type CreatePropertyRequest,
  type OwnerPropertySummary,
  type PropertyDetail,
  type PropertyImage,
  type PropertySummary,
  type UpdatePropertyImageRequest,
  type UpdatePropertyRequest,
  type UpdatePropertyStatusRequest,
} from './properties/property.schemas.js';
export {
  myListingsQuerySchema,
  propertySearchQuerySchema,
  similarPropertiesQuerySchema,
  type MyListingsQuery,
  type PropertySearchQuery,
  type SimilarPropertiesQuery,
} from './properties/property-search.schemas.js';

// Inquiries
export {
  INQUIRY_LIMITS,
  INQUIRY_STATUSES,
  createInquiryRequestSchema,
  inquirySchema,
  inquiryStatusSchema,
  receivedInquiriesQuerySchema,
  receivedInquirySchema,
  updateInquiryStatusRequestSchema,
  type CreateInquiryRequest,
  type Inquiry,
  type InquiryStatus,
  type ReceivedInquiriesQuery,
  type ReceivedInquiry,
  type UpdateInquiryStatusRequest,
} from './inquiries/inquiry.schemas.js';

// Admin
export {
  adminDashboardStatsSchema,
  adminPropertiesQuerySchema,
  adminPropertyItemSchema,
  moderatePropertyActionSchema,
  moderatePropertyRequestSchema,
  type AdminDashboardStats,
  type AdminPropertiesQuery,
  type AdminPropertyItem,
  type ModeratePropertyAction,
  type ModeratePropertyRequest,
} from './admin/admin.schemas.js';
