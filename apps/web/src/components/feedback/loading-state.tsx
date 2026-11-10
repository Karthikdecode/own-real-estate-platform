import { cn } from '@/lib/utils/cn';

const SKELETON_WIDTHS = ['w-3/4', 'w-full', 'w-5/6', 'w-2/3'];

interface LoadingStateProps {
  label?: string;
  /** Number of placeholder text lines shown under the spinner. */
  skeletonLines?: number;
}

/** Spinner plus skeleton lines, announced politely to assistive technology. */
export function LoadingState({ label = 'Loading…', skeletonLines = 3 }: LoadingStateProps) {
  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <div className="flex items-center gap-3 text-slate-600">
        <Spinner />
        <span>{label}</span>
      </div>
      {skeletonLines > 0 ? (
        <div className="space-y-2">
          {Array.from({ length: skeletonLines }, (_, line) => (
            <Skeleton key={line} className={SKELETON_WIDTHS[line % SKELETON_WIDTHS.length]} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('h-4 animate-pulse rounded bg-slate-200 motion-reduce:animate-none', className)}
    />
  );
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-5 animate-spin text-brand-700 motion-reduce:animate-none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
