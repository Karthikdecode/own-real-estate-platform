import { describe, expect, it } from 'vitest';
import {
  createPropertyRequestSchema,
  updatePropertyRequestSchema,
  updatePropertyStatusRequestSchema,
} from '../src/index.js';

const validApartment = {
  title: '3 BHK apartment near Whitefield metro',
  description:
    'Spacious east-facing apartment with two balconies, covered parking and power backup.',
  propertyType: 'apartment',
  listingType: 'sale',
  price: 12_500_000,
  city: 'Bengaluru',
  locality: 'Whitefield',
  address: 'Tower B, Palm Meadows, Whitefield Main Road',
  pincode: '560066',
  bedrooms: 3,
  bathrooms: 3,
  areaSqft: 1650,
};

describe('createPropertyRequestSchema', () => {
  it('accepts a valid residential listing and trims text fields', () => {
    const property = createPropertyRequestSchema.parse({ ...validApartment, city: '  Bengaluru ' });

    expect(property.city).toBe('Bengaluru');
  });

  it('rejects unknown fields such as a client-supplied ownerId', () => {
    const result = createPropertyRequestSchema.safeParse({
      ...validApartment,
      ownerId: '3f1c2e9a-8b7d-4c6e-9f0a-1b2c3d4e5f60',
    });

    expect(result.success).toBe(false);
  });

  it('requires bedrooms for residential property types', () => {
    const result = createPropertyRequestSchema.safeParse({
      ...validApartment,
      bedrooms: undefined,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toContain('bedrooms');
  });

  it('rejects bedrooms on plots', () => {
    const result = createPropertyRequestSchema.safeParse({
      ...validApartment,
      propertyType: 'plot',
      bedrooms: 2,
    });

    expect(result.success).toBe(false);
  });

  it('requires latitude and longitude together', () => {
    const result = createPropertyRequestSchema.safeParse({ ...validApartment, latitude: 12.97 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['longitude']);
  });

  it('rejects an invalid PIN code', () => {
    expect(
      createPropertyRequestSchema.safeParse({ ...validApartment, pincode: '012345' }).success,
    ).toBe(false);
  });
});

describe('updatePropertyRequestSchema', () => {
  it('accepts a partial update', () => {
    expect(updatePropertyRequestSchema.parse({ price: 11_900_000 })).toEqual({ price: 11_900_000 });
  });

  it('rejects an empty update', () => {
    expect(updatePropertyRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('updatePropertyStatusRequestSchema', () => {
  it('only allows publishing or unpublishing', () => {
    expect(updatePropertyStatusRequestSchema.safeParse({ status: 'published' }).success).toBe(true);
    expect(updatePropertyStatusRequestSchema.safeParse({ status: 'draft' }).success).toBe(false);
  });
});
