'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ApiHealthResult } from '@/services/api-health';
import { checkApiHealthFromBrowser } from '@/services/browser-health.service';
import { ApiStatusCard } from './api-status-card';

/** Calls the API from the browser after hydration, proving CORS with credentials works end to end. */
export function BrowserApiCheck() {
  const [result, setResult] = useState<ApiHealthResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<{ error: unknown } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    checkApiHealthFromBrowser(controller.signal).then(
      (next) => {
        if (!controller.signal.aborted) setResult(next);
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setFailure({ error });
      },
    );
    return () => {
      controller.abort();
    };
  }, [attempt]);

  // API failures are already mapped to states; anything else is a bug for the error boundary.
  if (failure) throw failure.error;

  const checkAgain = () => {
    setResult(null);
    setAttempt((count) => count + 1);
  };

  return (
    <ApiStatusCard
      title="Browser → API"
      description="Requested from your browser after the page loads, across origins with credentials (CORS)."
      result={result}
      action={
        <Button variant="secondary" size="sm" onClick={checkAgain} disabled={result === null}>
          Check again
        </Button>
      }
    />
  );
}
