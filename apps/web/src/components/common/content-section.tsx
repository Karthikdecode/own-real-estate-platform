import { useId, type ReactNode } from 'react';

interface ContentSectionProps {
  title: string;
  children: ReactNode;
}

/** A titled block of static page copy with consistent typography. */
export function ContentSection({ title, children }: ContentSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="max-w-3xl space-y-3 text-slate-700">
      <h2 id={headingId} className="text-xl font-semibold text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}
