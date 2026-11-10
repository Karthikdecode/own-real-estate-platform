import { useId, type ReactNode } from 'react';
import type { ApiHealthResult } from '@/services/api-health';
import { cn } from '@/lib/utils/cn';

const STATE_PRESENTATION = {
  checking: { label: 'Checking…', dotClass: 'bg-slate-400 motion-safe:animate-pulse' },
  up: { label: 'API is up', dotClass: 'bg-emerald-500' },
  degraded: { label: 'API degraded', dotClass: 'bg-amber-500' },
  unreachable: { label: 'API unreachable', dotClass: 'bg-rose-500' },
};

interface ApiStatusCardProps {
  title: string;
  description: string;
  /** null while the check is still running. */
  result: ApiHealthResult | null;
  action?: ReactNode;
}

function formatUptime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Presents one API health result. Rendered as a Server Component for the server-side check and
 * reused by BrowserApiCheck for the browser-side one.
 */
export function ApiStatusCard({ title, description, result, action }: ApiStatusCardProps) {
  const headingId = useId();
  const presentation = STATE_PRESENTATION[result?.state ?? 'checking'];

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h3 id={headingId} className="text-base font-semibold text-slate-900">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      <p role="status" className="mt-4 flex items-center gap-2 font-medium text-slate-900">
        <span aria-hidden="true" className={cn('size-2.5 rounded-full', presentation.dotClass)} />
        {presentation.label}
      </p>

      {result?.state === 'up' ? (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-500">Database</dt>
          <dd className="text-slate-900">
            {result.health.checks.database.status} ({result.health.checks.database.latencyMs} ms)
          </dd>
          <dt className="text-slate-500">Uptime</dt>
          <dd className="text-slate-900">{formatUptime(result.health.uptimeSeconds)}</dd>
          <dt className="text-slate-500">Reported at</dt>
          <dd className="text-slate-900">
            <time dateTime={result.health.timestamp}>{result.health.timestamp}</time>
          </dd>
        </dl>
      ) : null}

      {result && result.state !== 'up' ? (
        <div className="mt-3 space-y-1 text-sm text-slate-600">
          <p>{result.message}</p>
          {result.state === 'unreachable' ? (
            <p>
              Start the API from the repository root with <code>pnpm dev:api</code>.
            </p>
          ) : null}
        </div>
      ) : null}

      {action ? <div className="mt-auto pt-5">{action}</div> : null}
    </section>
  );
}
