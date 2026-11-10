import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Short label above the title, e.g. the section name. */
  eyebrow?: string;
  children?: ReactNode;
}

/** The page's h1 with an optional lead paragraph. */
export function PageHeader({ title, description, eyebrow, children }: PageHeaderProps) {
  return (
    <header className="space-y-3">
      {eyebrow ? (
        <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase">{eyebrow}</p>
      ) : null}
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      {description ? <p className="max-w-3xl text-lg text-slate-600">{description}</p> : null}
      {children}
    </header>
  );
}
