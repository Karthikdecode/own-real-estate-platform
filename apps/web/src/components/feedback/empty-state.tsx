import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  /** Heading level, so the component can also carry a page's main heading. */
  titleAs?: 'h1' | 'h2' | 'h3';
  action?: ReactNode;
}

export function EmptyState({ title, description, titleAs: Title = 'h2', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Title className="text-xl font-semibold text-slate-900">{title}</Title>
      <p className="mt-2 max-w-md text-slate-600">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
