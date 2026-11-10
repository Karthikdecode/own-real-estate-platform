import type { Metadata } from 'next';
import { ContentSection } from '@/components/common/content-section';
import { PageHeader } from '@/components/common/page-header';
import { Container } from '@/components/ui/container';
import { ROADMAP_PHASES } from '@/config/roadmap';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'About',
  description:
    'How Real Estate Platform connects property owners with buyers and tenants, and the roadmap it is built along.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <Container className="space-y-10 py-10 sm:py-14">
      <PageHeader
        eyebrow="About"
        title="A direct marketplace for homes and land"
        description="Owners list flats, independent houses, villas, builder floors, plots and commercial spaces for sale or rent. Buyers and tenants find them by city, budget and configuration, and talk to the owner directly."
      />

      <ContentSection title="How it works">
        <ol className="list-decimal space-y-2 pl-5">
          <li>An owner creates an account and drafts a listing with price, location and photos.</li>
          <li>Published listings appear in search, filtered by city, budget, type and bedrooms.</li>
          <li>
            Interested buyers or tenants send an inquiry, which lands in the owner’s dashboard.
          </li>
        </ol>
      </ContentSection>

      <ContentSection title="How it is built">
        <p>
          A Next.js App Router web app talks to an Express REST API backed by PostgreSQL. Both sides
          share one contracts package of Zod schemas, so a request the browser validates is
          validated by the API with exactly the same rules. Uploaded photos are stored on the API
          server’s local disk.
        </p>
      </ContentSection>

      <ContentSection title="Roadmap">
        <p>The platform is delivered in phases; this build is the foundation they all build on.</p>
        <ol className="grid gap-2 sm:grid-cols-2">
          {Object.entries(ROADMAP_PHASES).map(([phase, name]) => (
            <li key={phase} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <span className="font-semibold text-brand-700">{phase}</span>
              <span>{name}</span>
            </li>
          ))}
        </ol>
      </ContentSection>
    </Container>
  );
}
