import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentSection } from '@/components/common/content-section';
import { PageHeader } from '@/components/common/page-header';
import { Container } from '@/components/ui/container';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact',
  description:
    'How buyers, tenants and property owners get in touch on Real Estate Platform, without brokers in between.',
  path: '/contact',
});

const LINK_CLASS = 'font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800';

export default function ContactPage() {
  return (
    <Container className="space-y-10 py-10 sm:py-14">
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        description="Real Estate Platform connects people directly: questions about a property go to its owner, not to a call centre."
      />

      <ContentSection title="Questions about a property">
        <p>
          Every published listing will carry an inquiry form. Your message goes straight to the
          owner’s dashboard together with your name, email and, if your profile has one, your mobile
          number, so the owner can reply. Inquiries arrive with roadmap phase 8.
        </p>
      </ContentSection>

      <ContentSection title="Listing your property">
        <p>
          Owners can{' '}
          <Link href="/register" className={LINK_CLASS}>
            create an account
          </Link>{' '}
          and then{' '}
          <Link href="/my-properties/create" className={LINK_CLASS}>
            list a property
          </Link>
          . Listings stay private drafts until you publish them, and you can unpublish them at any
          time.
        </p>
      </ContentSection>

      <ContentSection title="Platform support">
        <p>
          This deployment does not publish a support mailbox yet. A support channel is configured as
          part of production deployment (roadmap phase 11).
        </p>
      </ContentSection>
    </Container>
  );
}
