export const PROPERTY_LIMITS = {
  titleMinLength: 10,
  titleMaxLength: 150,
  descriptionMinLength: 30,
  descriptionMaxLength: 5000,
  /** Prices are whole INR; for rent listings the price is the monthly rent. */
  maxPriceInr: 10_000_000_000,
  maxAreaSqft: 1_000_000,
  maxRooms: 20,
  maxSearchBedrooms: 10,
  maxSimilarResults: 12,
  defaultSimilarResults: 6,
} as const;

export const PROPERTY_IMAGE_RULES = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxFilesPerUpload: 10,
  maxImagesPerProperty: 20,
} as const;
