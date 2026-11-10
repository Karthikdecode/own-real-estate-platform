import Link from 'next/link';
import { siteConfig } from '@/config/site';

/** Logo and site name, linking to the homepage. */
export function BrandLink() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg font-bold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"
    >
      <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary text-white shadow-xs">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="currentColor">
          <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
        </svg>
      </div>
      <span className="text-base tracking-tight font-extrabold">{siteConfig.name}</span>
    </Link>
  );
}
