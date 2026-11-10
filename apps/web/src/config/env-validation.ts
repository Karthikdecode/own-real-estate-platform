import { z } from 'zod';

/** An absolute http(s) URL, with messages that name the problem instead of Zod internals. */
export const absoluteHttpUrl = z.url({
  protocol: /^https?$/,
  error: (issue) =>
    issue.input === undefined || issue.input === ''
      ? 'is not set'
      : 'must be an absolute http(s) URL',
});

/** Validates raw environment values and fails fast with one message naming every invalid variable. */
export function validateEnv<S extends z.ZodType>(
  schema: S,
  values: Readonly<Record<string, string | undefined>>,
): z.output<S> {
  const result = schema.safeParse(values);
  if (result.success) return result.data;

  const problems = result.error.issues.map(
    (issue) => `  - ${issue.path.map(String).join('.')} ${issue.message}`,
  );
  throw new Error(
    [
      'Invalid environment configuration for apps/web:',
      ...problems,
      'Define the variables in the repository root .env (create it with "pnpm setup:env") or in the process environment.',
      'NEXT_PUBLIC_* values are inlined at build time, so they must be set when running "next build".',
    ].join('\n'),
  );
}

export function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}
