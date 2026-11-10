import { z } from 'zod';
import { AppError } from '../common/errors/app-error.js';
import type { CursorPage } from '../common/types/pagination.types.js';

export const CURSOR_VERSION = 1;

/** Every cursor carries a version so the encoding can evolve without misreading old cursors. */
export interface VersionedCursorPayload {
  readonly v: number;
}

/**
 * Keyset cursor `{ v, sort, value, id }`: `value` is the sort column of the last row (an ISO
 * timestamp or a number) and `id` breaks ties. Timestamps are timestamptz(3) in the database, so a
 * millisecond ISO string round-trips through a JS Date without losing precision.
 */
export function createKeysetCursorSchema<TSort extends z.ZodType<string>>(sort: TSort) {
  return z.strictObject({
    v: z.literal(CURSOR_VERSION),
    sort,
    value: z.union([z.iso.datetime({ precision: 3 }), z.number()]),
    id: z.uuid(),
  });
}

function invalidCursorError(): AppError {
  return AppError.validation([
    {
      path: 'query.cursor',
      message: 'Invalid or tampered cursor. Request the first page again.',
      code: 'invalid_cursor',
    },
  ]);
}

export function encodeCursor(payload: VersionedCursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor<TSchema extends z.ZodType<VersionedCursorPayload>>(
  cursor: string,
  schema: TSchema,
): z.output<TSchema> {
  const bytes = Buffer.from(cursor, 'base64url');
  // Buffer.from silently drops invalid characters, so only the canonical encoding is accepted.
  if (bytes.length === 0 || bytes.toString('base64url') !== cursor) throw invalidCursorError();

  let json: unknown;
  try {
    json = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw invalidCursorError();
  }

  const result = schema.safeParse(json);
  if (!result.success) throw invalidCursorError();
  return result.data;
}

/** Keyset queries fetch one row more than the page size to learn whether a next page exists. */
export function getKeysetFetchLimit(limit: number): number {
  return limit + 1;
}

export function toCursorPage<TRow>(
  rows: readonly TRow[],
  limit: number,
  getCursorPayload: (lastRow: TRow) => VersionedCursorPayload,
): CursorPage<TRow> {
  const numericLimit = Number(limit) || 10;
  const hasNextPage = rows.length > numericLimit;
  const items = rows.slice(0, numericLimit);
  const lastItem = items.at(-1);
  const nextCursor =
    hasNextPage && lastItem !== undefined ? encodeCursor(getCursorPayload(lastItem)) : null;
  return { items, nextCursor, hasNextPage, limit: numericLimit };
}
