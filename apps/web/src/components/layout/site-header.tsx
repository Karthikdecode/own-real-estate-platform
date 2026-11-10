import { Container } from '@/components/ui/container';
import { BrandLink } from './brand-link';
import { SiteNavigation } from './site-navigation';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/95 backdrop-blur transition-colors">
      <Container className="flex h-16 items-center justify-between gap-4">
        <BrandLink />
        <SiteNavigation />
      </Container>
    </header>
  );
}
