import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Adds `.openapi()` to Zod schemas (OpenAPIRegistry.register relies on it).
extendZodWithOpenApi(z);

// In Zod 4, individual Zod schema classes (ZodObject, ZodString, etc.) do not inherit from ZodType.prototype.
const openapiMethod = z.ZodType.prototype.openapi;
for (const key of Object.keys(z)) {
  if (key.startsWith('Zod') && (z as Record<string, any>)[key]?.prototype && !(z as Record<string, any>)[key].prototype.openapi) {
    (z as Record<string, any>)[key].prototype.openapi = openapiMethod;
  }
}

export { z };
