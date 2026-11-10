import { describe, expect, it } from 'vitest';
import { PAGINATION_LIMITS, propertySearchQuerySchema } from '../src/index.js';

describe('propertySearchQuerySchema', () => {
  it('applies defaults when no parameters are given', () => {
    const query = propertySearchQuerySchema.parse({});

    expect(query.listingType).toBe('sale');
    expect(query.sort).toBe('newest');
    expect(query.limit).toBe(PAGINATION_LIMITS.defaultLimit);
    expect(query.city).toBeUndefined();
  });

  it('treats empty query-string values as absent (HTML GET forms send blank fields)', () => {
    const query = propertySearchQuerySchema.parse({
      listingType: '',
      city: '',
      q: '',
      propertyType: '',
      bedrooms: '',
      minPrice: '',
      limit: '',
    });

    expect(query.listingType).toBe('sale');
    expect(query.city).toBeUndefined();
    expect(query.q).toBeUndefined();
    expect(query.propertyType).toBeUndefined();
    expect(query.bedrooms).toBeUndefined();
    expect(query.minPrice).toBeUndefined();
    expect(query.limit).toBe(PAGINATION_LIMITS.defaultLimit);
  });

  it('parses comma-separated and repeated multi-value parameters', () => {
    const fromCsv = propertySearchQuerySchema.parse({
      propertyType: 'apartment, villa,apartment',
      bedrooms: '2,3',
    });
    const fromRepeatedKeys = propertySearchQuerySchema.parse({ bedrooms: ['3', '4'] });

    expect(fromCsv.propertyType).toEqual(['apartment', 'villa']);
    expect(fromCsv.bedrooms).toEqual([2, 3]);
    expect(fromRepeatedKeys.bedrooms).toEqual([3, 4]);
  });

  it('coerces numeric query-string values', () => {
    const query = propertySearchQuerySchema.parse({
      minPrice: '1500000',
      maxPrice: '9000000',
      limit: '10',
    });

    expect(query).toMatchObject({ minPrice: 1_500_000, maxPrice: 9_000_000, limit: 10 });
  });

  it('rejects an inverted budget range on the minPrice field', () => {
    const result = propertySearchQuerySchema.safeParse({ minPrice: '500', maxPrice: '100' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['minPrice']);
  });

  it.each([
    ['unknown property type', { propertyType: 'castle' }],
    ['unknown sort', { sort: 'random' }],
    ['limit above the maximum', { limit: String(PAGINATION_LIMITS.maxLimit + 1) }],
    ['non-numeric price', { minPrice: 'cheap' }],
    ['location text shorter than 3 characters', { q: 'ab' }],
    ['malformed cursor', { cursor: 'not a cursor!' }],
  ])('rejects %s', (_label, input) => {
    expect(propertySearchQuerySchema.safeParse(input).success).toBe(false);
  });
});
