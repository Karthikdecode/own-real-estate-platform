import type { ValueTransformer } from 'typeorm';

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  throw new TypeError(`Unexpected numeric column value of type ${typeof value}.`);
}

/**
 * pg returns bigint and numeric columns as strings to avoid precision loss. Prices (whole INR, at
 * most 10^10) and numeric(9,6) coordinates both round-trip through a JS number without loss.
 */
export const numericColumnTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: toNullableNumber,
};
