import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { siteConfig } from '@/config/site';
import { BrandLink } from './brand-link';

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle bg-surface transition-colors">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3.5 sm:col-span-2 lg:col-span-1">
          <BrandLink />
          <p className="max-w-sm text-sm text-text-secondary leading-relaxed">
            {siteConfig.description}
          </p>
          <p className="text-xs text-text-muted pt-2">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
        </div>
        {siteConfig.footerNav.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">{group.title}</h2>
            <ul className="mt-3.5 space-y-2.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-secondary hover:text-brand-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
    </footer>
  );
}
