import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { StorageProvider } from './storage.interface.js';
import type { PutObjectInput, StoredObject } from './storage.types.js';

const STORAGE_KEY_PATTERN = /^[a-z0-9][a-z0-9/_.-]*$/;
const MAX_STORAGE_KEY_LENGTH = 255;
/** Dot-prefixed, so the uploads static handler (dotfiles: deny) never serves partial files. */
const TEMP_DIR_NAME = '.tmp';

export class InvalidStorageKeyError extends Error {
  override readonly name = 'InvalidStorageKeyError';

  constructor() {
    super('Invalid storage key.');
  }
}

function assertValidStorageKey(key: string): void {
  const segments = key.split('/');
  const isValid =
    key.length <= MAX_STORAGE_KEY_LENGTH &&
    STORAGE_KEY_PATTERN.test(key) &&
    segments.every((segment) => segment !== '' && !segment.startsWith('.'));
  if (!isValid) throw new InvalidStorageKeyError();
}

export interface LocalDiskStorageOptions {
  /** Directory the files are written to (env.UPLOADS_DIR). */
  readonly rootDir: string;
  /** Public base URL the uploads are served from, e.g. http://localhost:4000/uploads. */
  readonly publicBaseUrl: string;
}

export class LocalDiskStorage implements StorageProvider {
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor(options: LocalDiskStorageOptions) {
    this.rootDir = path.resolve(options.rootDir);
    this.publicBaseUrl = options.publicBaseUrl.replace(/\/+$/, '');
  }

  async putObject({ key, body, contentType }: PutObjectInput): Promise<StoredObject> {
    const filePath = this.resolveObjectPath(key);
    const tempDir = path.join(this.rootDir, TEMP_DIR_NAME);
    const tempPath = path.join(tempDir, `${randomUUID()}.part`);

    await mkdir(tempDir, { recursive: true });
    await mkdir(path.dirname(filePath), { recursive: true });
    try {
      // Write then rename: readers never observe a partially written file.
      await writeFile(tempPath, body, { flag: 'wx' });
      await rename(tempPath, filePath);
    } catch (error) {
      await rm(tempPath, { force: true });
      throw error;
    }

    return { key, url: this.getPublicUrl(key), contentType, sizeBytes: body.byteLength };
  }

  async deleteObject(key: string): Promise<void> {
    await rm(this.resolveObjectPath(key), { force: true });
  }

  getPublicUrl(key: string): string {
    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
      return key;
    }
    assertValidStorageKey(key);
    return `${this.publicBaseUrl}/${key}`;
  }

  private resolveObjectPath(key: string): string {
    assertValidStorageKey(key);
    const filePath = path.resolve(this.rootDir, ...key.split('/'));
    // Defence in depth on top of key validation: the path must stay inside the root.
    const relativePath = path.relative(this.rootDir, filePath);
    if (relativePath === '' || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new InvalidStorageKeyError();
    }
    return filePath;
  }
}
