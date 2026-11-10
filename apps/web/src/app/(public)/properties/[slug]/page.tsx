import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InquiryForm } from '@/components/properties/inquiry-form';
import { PropertyCard } from '@/components/properties/property-card';
import { EmiCalculator } from '@/components/properties/emi-calculator';
import { Container } from '@/components/ui/container';
import {
  getPropertyBySlug,
  getSimilarProperties,
} from '@/features/properties/services/property-catalog.service';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { formatPrice, formatPropertyType } from '@/lib/utils/format';

interface PropertyDetailsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PropertyDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    return buildPageMetadata({
      title: 'Property Not Found',
      description: 'The requested property listing does not exist.',
      path: `/properties/${slug}`,
    });
  }

  const title = `${property.title} in ${property.locality}, ${property.city}`;
  const description = `${property.bedrooms ? `${property.bedrooms} BHK ` : ''}${formatPropertyType(
    property.propertyType,
  )} for ${property.listingType} at ${formatPrice(property.price, property.listingType)} in ${property.locality}, ${property.city}. ${property.description.slice(0, 150)}...`;

  return buildPageMetadata({
    title,
    description,
    path: `/properties/${slug}`,
  });
}

export default async function PropertyDetailsPage({ params }: PropertyDetailsPageProps) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const similarProperties = await getSimilarProperties(property.id, 3).catch(() => []);

  // JSON-LD Schema for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `http://localhost:3000/properties/${property.slug}`,
    datePosted: property.publishedAt,
    price: property.price,
    priceCurrency: 'INR',
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.locality,
      addressRegion: property.city,
      postalCode: property.pincode,
      addressCountry: 'IN',
    },
    geo:
      property.latitude && property.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: property.latitude,
            longitude: property.longitude,
          }
        : undefined,
  };

  const mainImage =
    property.images[0]?.url ??
    property.primaryImageUrl ??
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&auto=format&fit=crop&q=80';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-background min-h-screen transition-colors">
        <Container className="py-8 sm:py-12">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-text-muted">
            <Link href="/" className="hover:text-text-primary transition">
              Home
            </Link>
            <span>/</span>
            <Link href="/properties" className="hover:text-text-primary transition">
              Properties
            </Link>
            <span>/</span>
            <Link
              href={`/properties?city=${property.city}`}
              className="hover:text-text-primary transition"
            >
              {property.city}
            </Link>
            <span>/</span>
            <span className="truncate font-semibold text-text-primary">{property.title}</span>
          </nav>

          {/* Header Section */}
          <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-bold tracking-wider uppercase text-white ${
                    property.listingType === 'sale' ? 'bg-brand-primary' : 'bg-emerald-600'
                  }`}
                >
                  For {property.listingType === 'sale' ? 'Sale' : 'Rent'}
                </span>
                <span className="rounded-lg bg-surface-secondary border border-border-subtle px-3 py-1 text-xs font-semibold text-text-secondary">
                  {formatPropertyType(property.propertyType)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <svg className="size-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified Owner Listing
                </span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
                {property.title}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text-secondary">
                <svg className="size-4 shrink-0 text-brand-primary dark:text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{property.address}, {property.locality}, {property.city} - {property.pincode}</span>
              </p>
            </div>

            <div className="md:text-right bg-surface-secondary/70 p-4 rounded-2xl border border-border-subtle shrink-0">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Price</p>
              <p className="text-3xl font-extrabold text-brand-primary dark:text-brand-accent mt-0.5">
                {formatPrice(property.price, property.listingType)}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                ₹{Math.round(property.price / property.areaSqft).toLocaleString('en-IN')} / sq.ft
              </p>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 overflow-hidden rounded-2xl bg-surface-secondary border border-border-subtle aspect-16/10 shadow-sm">
              <img
                src={mainImage || '/images/hero-home-poster.webp'}
                alt={property.title}
                className="size-full object-cover hover:scale-102 transition duration-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              {property.images.slice(1, 3).map((img, idx) => (
                <div key={img.id || idx} className="overflow-hidden rounded-2xl bg-surface-secondary border border-border-subtle aspect-16/10 shadow-sm">
                  <img
                    src={img.url || '/images/hero-home-poster.webp'}
                    alt={`${property.title} photo ${idx + 2}`}
                    className="size-full object-cover hover:scale-102 transition duration-500"
                  />
                </div>
              ))}
              {property.images.length <= 1 && (
                <div className="flex size-full items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-secondary/40 p-6 text-center text-xs text-text-muted">
                  More high-resolution photographs available upon site visit request.
                </div>
              )}
            </div>
          </div>

          {/* Content & Lead Inquiry Form Grid */}
          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Main Specs & Overview */}
            <div className="space-y-8 lg:col-span-2">
              {/* Overview Stats Bar */}
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border-subtle bg-surface p-5 sm:grid-cols-4 shadow-sm transition-colors">
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Bedrooms</p>
                  <p className="mt-1 text-lg font-extrabold text-text-primary">
                    {property.bedrooms != null ? `${property.bedrooms} BHK` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Bathrooms</p>
                  <p className="mt-1 text-lg font-extrabold text-text-primary">
                    {property.bathrooms != null ? `${property.bathrooms} Baths` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Carpet Area</p>
                  <p className="mt-1 text-lg font-extrabold text-text-primary">
                    {property.areaSqft.toLocaleString('en-IN')} sq.ft
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Status</p>
                  <p className="mt-1 text-lg font-extrabold text-emerald-600 dark:text-emerald-400 capitalize">
                    Ready to Move
                  </p>
                </div>
              </div>

              {/* Description Card */}
              <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm transition-colors">
                <h2 className="text-lg font-bold text-text-primary">About this Property</h2>
                <div className="mt-4 text-sm leading-relaxed text-text-secondary whitespace-pre-line">
                  {property.description}
                </div>
              </div>

              {/* Amenities Grid */}
              <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm transition-colors">
                <h2 className="text-lg font-bold text-text-primary">Key Amenities & Features</h2>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    '24x7 Security & CCTV',
                    'Reserved Covered Parking',
                    'High Speed Elevators',
                    '100% Power Backup',
                    'Clubhouse & Gym',
                    '24x7 Water Supply',
                    'Paved Walking Tracks',
                    'Children Play Area',
                    'Rainwater Harvesting',
                  ].map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 rounded-xl bg-surface-secondary p-3 text-xs font-semibold text-text-primary border border-border-subtle">
                      <span className="size-2 rounded-full bg-brand-primary dark:bg-brand-accent shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Highlights */}
              <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm transition-colors">
                <h2 className="text-lg font-bold text-text-primary">Location Highlights</h2>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-xs font-bold text-text-muted uppercase tracking-wider">Locality</dt>
                    <dd className="mt-1 font-semibold text-text-primary">{property.locality}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-text-muted uppercase tracking-wider">City</dt>
                    <dd className="mt-1 font-semibold text-text-primary">{property.city}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-text-muted uppercase tracking-wider">PIN Code</dt>
                    <dd className="mt-1 font-semibold text-text-primary">{property.pincode}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold text-text-muted uppercase tracking-wider">Ownership Type</dt>
                    <dd className="mt-1 font-semibold text-text-primary">Freehold • Direct Owner</dd>
                  </div>
                </dl>
              </div>

              {/* Home Loan EMI Calculator (Only for Sale listings) */}
              {property.listingType === 'sale' && (
                <EmiCalculator propertyPrice={property.price} />
              )}
            </div>

            {/* Sticky Sidebar Inquiry Form */}
            <div className="space-y-6">
              <div className="sticky top-20">
                <InquiryForm propertyId={property.id} propertyTitle={property.title} />
              </div>
            </div>
          </div>

          {/* Similar Properties Section */}
          {similarProperties.length > 0 && (
            <div className="mt-16 border-t border-border-subtle pt-10">
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-text-primary">Similar Properties You May Like</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Recommended based on {property.city}, budget range and {formatPropertyType(property.propertyType)}.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similarProperties.map((simProp) => (
                  <PropertyCard key={simProp.id} property={simProp} />
                ))}
              </div>
            </div>
          )}
        </Container>
      </div>
    </>
  );
}
