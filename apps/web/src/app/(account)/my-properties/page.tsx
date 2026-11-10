import type { Metadata } from 'next';
import { OwnerDashboard } from '@/components/properties/owner-dashboard';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'My Properties',
  description: 'Manage your listings, photos, and inquiries.',
  path: '/my-properties',
});

export default function MyPropertiesPage() {
  return <OwnerDashboard />;
}
