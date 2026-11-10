'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/feedback/error-state';
import { Container } from '@/components/ui/container';

interface RouteErrorProps {
  error: unknown;
  /** Re-fetches the segment from the server and re-renders it (Next.js 16.3+). */
  retry: () => void;
}

/** Server errors reach the browser without their message, only with a digest matching the server log. */
function errorDigest(error: unknown): string | undefined {
  return error instanceof Error && 'digest' in error && typeof error.digest === 'string'
    ? error.digest
    : undefined;
}

export default function RouteError({ error, retry }: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = errorDigest(error);

  return (
    <Container className="py-12">
      <ErrorState
        title="This page could not be loaded"
        message="Something went wrong while preparing this page. Please try again in a moment."
        onRetry={retry}
      >
        {digest ? (
          <p className="mt-2 text-sm text-rose-700">
            Reference: <code>{digest}</code>
          </p>
        ) : null}
      </ErrorState>
    </Container>
  );
}
