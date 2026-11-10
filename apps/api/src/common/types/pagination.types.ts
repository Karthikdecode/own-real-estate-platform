/** One keyset page. `nextCursor` is null on the last page. */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
}
