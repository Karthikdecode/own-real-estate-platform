import type { Request, RequestHandler } from 'express';
import type { z } from 'zod';
import { AppError } from '../common/errors/app-error.js';
import { toValidationErrorDetails } from '../common/errors/validation-details.js';

/** Request parts a validator may describe; each is optional. */
export type RequestPart = 'params' | 'query' | 'body';

/** Compile-time guard: a request schema may only have params/query/body keys. */
type OnlyRequestParts<TSchema extends z.ZodObject> = [
  Exclude<keyof TSchema['shape'], RequestPart>,
] extends [never]
  ? unknown
  : { readonly unsupportedRequestParts: Exclude<keyof TSchema['shape'], RequestPart> };

export interface RequestValidator<TInput> {
  /** Validates params/query/body and stores the parsed result; failures become 400s. */
  readonly middleware: RequestHandler;
  /** Typed parsed input of a request that passed `middleware`. */
  getInput(req: Request): TInput;
}

/**
 * Parsed values are kept in a WeakMap keyed by the request instead of being written back:
 * Express 5 exposes `req.query` as a read-only getter, and a side table keeps typing exact.
 */
export function createRequestValidator<TSchema extends z.ZodObject>(
  schema: TSchema & OnlyRequestParts<TSchema>,
): RequestValidator<z.output<TSchema>> {
  const requestSchema: TSchema = schema;
  const parsedInputs = new WeakMap<Request, z.output<TSchema>>();

  return {
    middleware: async (req, _res, next) => {
      const body: unknown = req.body;
      const result = await requestSchema.safeParseAsync({
        params: req.params,
        query: req.query,
        body,
      });
      if (!result.success) {
        next(AppError.validation(toValidationErrorDetails(result.error.issues)));
        return;
      }
      parsedInputs.set(req, result.data);
      next();
    },
    getInput(req) {
      const input = parsedInputs.get(req);
      if (input === undefined) {
        throw new Error('Request input requested before its validation middleware ran.');
      }
      return input;
    },
  };
}
