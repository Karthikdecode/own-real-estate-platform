import { z } from 'zod';

export const PROPERTY_TYPES = [
  'apartment',
  'independent_house',
  'villa',
  'builder_floor',
  'plot',
  'commercial',
] as const;

export const RESIDENTIAL_PROPERTY_TYPES = [
  'apartment',
  'independent_house',
  'villa',
  'builder_floor',
] as const;

export const LISTING_TYPES = ['sale', 'rent'] as const;

/** draft: never published; published: publicly searchable; unpublished: hidden by the owner. */
export const PROPERTY_STATUSES = ['draft', 'published', 'unpublished'] as const;

export const PROPERTY_SORTS = ['newest', 'oldest', 'price_asc', 'price_desc'] as const;

export const propertyTypeSchema = z.enum(PROPERTY_TYPES);
export const listingTypeSchema = z.enum(LISTING_TYPES);
export const propertyStatusSchema = z.enum(PROPERTY_STATUSES);
export const propertySortSchema = z.enum(PROPERTY_SORTS);

export type PropertyType = z.infer<typeof propertyTypeSchema>;
export type ListingType = z.infer<typeof listingTypeSchema>;
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;
export type PropertySort = z.infer<typeof propertySortSchema>;

const residentialPropertyTypes: ReadonlySet<PropertyType> = new Set(RESIDENTIAL_PROPERTY_TYPES);

export function isResidentialPropertyType(type: PropertyType): boolean {
  return residentialPropertyTypes.has(type);
}
