'use client';

import Link from 'next/link';
import type { PropertySummary } from '@real-estate/contracts';
import { formatPrice, formatPropertyType } from '@/lib/utils/format';

interface PropertyCardProps {
  property: PropertySummary;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const fallbackImage =
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-2xs transition hover:shadow-lg hover:border-brand-primary/40">
      {/* Property Image & Status Badges */}
      <Link
        href={`/properties/${property.slug}`}
        className="relative aspect-16/10 w-full overflow-hidden bg-surface-secondary"
      >
        <img
          src={property.primaryImageUrl ?? '/images/hero-home-poster.webp'}
          alt={property.title}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/hero-home-poster.webp';
          }}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide uppercase shadow-sm ${
              property.listingType === 'sale'
                ? 'bg-brand-primary text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
          </span>
          <span className="rounded-lg bg-surface/90 px-2.5 py-1 text-xs font-semibold text-text-primary shadow-sm backdrop-blur">
            {formatPropertyType(property.propertyType)}
          </span>
        </div>
      </Link>

      {/* Property Information */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xl font-bold text-text-primary">
            {formatPrice(property.price, property.listingType)}
          </p>
        </div>

        <h3 className="mt-2 line-clamp-1 text-base font-semibold text-text-primary group-hover:text-brand-primary transition-colors">
          <Link href={`/properties/${property.slug}`}>{property.title}</Link>
        </h3>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
          <svg
            className="size-4 shrink-0 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="truncate">
            {property.locality}, {property.city}
          </span>
        </p>

        {/* Specs Highlights */}
        <div className="mt-4 flex items-center gap-4 border-t border-border-subtle pt-3 text-xs font-medium text-text-secondary">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1.5">
              <svg className="size-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {property.bedrooms} BHK
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1.5">
              <svg className="size-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {property.bathrooms} Baths
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <svg className="size-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            {property.areaSqft.toLocaleString('en-IN')} sq.ft
          </span>
        </div>
      </div>
    </div>
  );
}
