import type { z } from 'zod';
import {
  request,
  requestPage,
  type CommonRequestOptions,
  type HttpMethod,
  type Page,
  type RequestOptions,
} from './http';

/** One HTTP verb: validated, typed data with a schema; `unknown` (undefined for 204) without. */
export interface ApiCall<O> {
  <S extends z.ZodType>(path: string, options: O & { schema: S }): Promise<z.output<S>>;
  (path: string, options?: O): Promise<unknown>;
}

export interface ApiMethods<O> {
  get: ApiCall<O>;
  post: ApiCall<O>;
  patch: ApiCall<O>;
  delete: ApiCall<O>;
  getPage<S extends z.ZodType>(
    path: string,
    options: O & { itemSchema: S },
  ): Promise<Page<z.output<S>>>;
}

/** What distinguishes an entry point (server or browser); everything else is shared. */
export interface ApiEntryPoint<O extends CommonRequestOptions> {
  baseUrl: string;
  /** Maps entry-point options to core options: auth headers, credentials, caching. */
  toRequestOptions(
    method: HttpMethod,
    options: O | undefined,
  ): RequestOptions | Promise<RequestOptions>;
  /** Wraps every call, e.g. to renew an expired session and retry once. */
  around?<T>(send: () => Promise<T>): Promise<T>;
}

/** Builds the typed get/post/patch/delete/getPage surface on top of the shared HTTP core. */
export function createApiMethods<O extends CommonRequestOptions>(
  entry: ApiEntryPoint<O>,
): ApiMethods<O> {
  const run = <T>(send: () => Promise<T>): Promise<T> =>
    entry.around ? entry.around(send) : send();

  const bind = (method: HttpMethod): ApiCall<O> => {
    function call<S extends z.ZodType>(
      path: string,
      options: O & { schema: S },
    ): Promise<z.output<S>>;
    function call(path: string, options?: O): Promise<unknown>;
    function call(path: string, options?: O & { schema?: z.ZodType }): Promise<unknown> {
      return run(async () =>
        request(entry.baseUrl, path, {
          ...(await entry.toRequestOptions(method, options)),
          schema: options?.schema,
        }),
      );
    }
    return call;
  };

  return {
    get: bind('GET'),
    post: bind('POST'),
    patch: bind('PATCH'),
    delete: bind('DELETE'),
    getPage: <S extends z.ZodType>(path: string, options: O & { itemSchema: S }) =>
      run(async () =>
        requestPage(entry.baseUrl, path, {
          ...(await entry.toRequestOptions('GET', options)),
          itemSchema: options.itemSchema,
        }),
      ),
  };
}
