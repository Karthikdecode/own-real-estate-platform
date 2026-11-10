import type { PutObjectInput, StoredObject } from './storage.types.js';

/**
 * Object storage used by the uploads module. Only local disk is implemented; services depend on
 * this interface and the database stores keys (never URLs), so the backend stays swappable.
 */
export interface StorageProvider {
  putObject(input: PutObjectInput): Promise<StoredObject>;
  /** Idempotent: deleting a missing object succeeds. */
  deleteObject(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
