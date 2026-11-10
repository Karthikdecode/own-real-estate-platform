import type { Metadata } from 'next';
import { Container } from '@/components/ui/container';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <Container className="flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-md space-y-8">{children}</div>
    </Container>
  );
}
