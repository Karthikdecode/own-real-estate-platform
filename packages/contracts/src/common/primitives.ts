import { z } from 'zod';

export const uuidSchema = z.uuid();

export const slugSchema = z
  .string()
  .min(3)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a lowercase, hyphen-separated slug');

export const isoDateTimeSchema = z.iso.datetime({ offset: true });

/** True when at least one field is present; used to reject empty PATCH bodies. */
export function hasDefinedField(body: Record<string, unknown>): boolean {
  return Object.values(body).some((value) => value !== undefined);
}

/**
 * Wraps a query-string parameter schema so that an empty value (`?city=`), which HTML GET
 * forms send for blank fields, is treated as "not provided".
 */
export function queryParam<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => (value === '' ? undefined : value), schema);
}

/**
 * Parses a multi-value query parameter given either as `a,b` or as repeated keys
 * (`?x=a&x=b`). Items are trimmed, blanks dropped and duplicates removed.
 */
export function commaSeparatedList<T extends z.ZodType>(item: T, maxItems: number) {
  return z.preprocess((value) => {
    const items: unknown = typeof value === 'string' ? value.split(',') : value;
    if (!Array.isArray(items)) return items;
    const list: unknown[] = items;
    const cleaned = list
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter((entry) => entry !== '');
    return [...new Set(cleaned)];
  }, z.array(item).min(1).max(maxItems));
}
