import type { Metadata } from 'next';
import { EmptyState } from '@/components/feedback/empty-state';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <Container className="py-16">
      <EmptyState
        titleAs="h1"
        title="Page not found"
        description="The page you are looking for does not exist or has moved."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">Go to the homepage</ButtonLink>
            <ButtonLink href="/properties" variant="secondary">
              Browse properties
            </ButtonLink>
          </div>
        }
      />
    </Container>
  );
}
