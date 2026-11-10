import type { ApiErrorDetail } from '@real-estate/contracts';
import type { z } from 'zod';

/** Converts Zod issues to contract error details with dot paths such as "query.minPrice". */
export function toValidationErrorDetails(issues: readonly z.core.$ZodIssue[]): ApiErrorDetail[] {
  return issues.map((issue) => ({
    path: issue.path.map((segment) => String(segment)).join('.'),
    message: issue.message,
    code: issue.code,
  }));
}
