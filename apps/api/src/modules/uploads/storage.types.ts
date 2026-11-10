export interface PutObjectInput {
  /** Relative object key such as "properties/<propertyId>/<uuid>.webp". */
  readonly key: string;
  readonly body: Buffer;
  readonly contentType: string;
}

export interface StoredObject {
  readonly key: string;
  readonly url: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}
