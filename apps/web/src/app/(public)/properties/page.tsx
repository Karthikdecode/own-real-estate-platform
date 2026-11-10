import type { Metadata } from 'next';
import Link from 'next/link';
import { PropertyCard } from '@/components/properties/property-card';
import { MapView } from '@/components/properties/map-view';
import { Container } from '@/components/ui/container';
import { searchProperties } from '@/features/properties/services/property-catalog.service';
import { buildPageMetadata } from '@/lib/seo/metadata';

const TITLE = 'Properties for Sale and Rent in India';
const DESCRIPTION =
  'Browse verified flats, apartments, independent villas, builder floors and plots across India with direct owner contact and zero brokerage.';

export const metadata: Metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/properties',
});

interface PropertiesPageProps {
  searchParams: Promise<{
    listingType?: string;
    city?: string;
    q?: string;
    propertyType?: string;
    bedrooms?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    cursor?: string;
    view?: string;
  }>;
}

const CITIES = ['All', 'Bengaluru', 'Mumbai', 'Chennai', 'Pune', 'Hyderabad', 'Delhi'];

const PROPERTY_TYPES_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'apartment', label: 'Apartment / Flat' },
  { value: 'independent_house', label: 'Independent House' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot / Land' },
];

const BUDGET_PRESETS_SALE = [
  { label: 'Under ₹50 Lac', min: '', max: '5000000' },
  { label: '₹50 Lac - ₹1 Cr', min: '5000000', max: '10000000' },
  { label: '₹1 Cr - ₹2 Cr', min: '10000000', max: '20000000' },
  { label: 'Above ₹2 Cr', min: '20000000', max: '' },
];

const BUDGET_PRESETS_RENT = [
  { label: 'Under ₹20,000', min: '', max: '20000' },
  { label: '₹20K - ₹40K', min: '20000', max: '40000' },
  { label: '₹40K - ₹80K', min: '40000', max: '80000' },
  { label: 'Above ₹80,000', min: '80000', max: '' },
];

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const listingType = (params.listingType === 'rent' ? 'rent' : 'sale') as 'sale' | 'rent';
  const city = params.city && params.city !== 'All' ? params.city : undefined;
  const q = params.q?.trim() || undefined;
  const propertyType = params.propertyType ? (params.propertyType.split(',') as any) : undefined;
  const bedrooms = params.bedrooms
    ? params.bedrooms.split(',').map((n) => Number.parseInt(n, 10))
    : undefined;
  const minPrice = params.minPrice ? Number.parseInt(params.minPrice, 10) : undefined;
  const maxPrice = params.maxPrice ? Number.parseInt(params.maxPrice, 10) : undefined;
  const sort = (params.sort ?? 'newest') as any;
  const cursor = params.cursor || undefined;
  const view = params.view === 'map' ? 'map' : 'grid';

  let pageData;
  try {
    pageData = await searchProperties({
      listingType,
      city,
      q,
      propertyType,
      bedrooms,
      minPrice,
      maxPrice,
      sort,
      cursor,
      limit: 12,
    });
  } catch {
    pageData = {
      items: [],
      pagination: { nextCursor: null, hasNextPage: false, limit: 12 },
    };
  }

  const { items: properties, pagination } = pageData;
  const { hasNextPage, nextCursor } = pagination;

  // Active filter count
  const activeFilters = [
    city && `City: ${city}`,
    params.propertyType && `Type: ${params.propertyType}`,
    params.bedrooms && `${params.bedrooms} BHK`,
    (minPrice || maxPrice) && 'Custom Budget',
    q && `"${q}"`,
  ].filter(Boolean);

  const budgetPresets = listingType === 'rent' ? BUDGET_PRESETS_RENT : BUDGET_PRESETS_SALE;

  return (
    <Container className="py-6 sm:py-8">
      {/* Top Breadcrumb & Title */}
      <div className="mb-6">
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-text-muted mb-2">
          <Link href="/" className="hover:text-brand-primary">Home</Link>
          <span>/</span>
          <span className="text-text-primary capitalize font-medium">{listingType === 'rent' ? 'Rent' : 'Buy'} Properties</span>
          {city && (
            <>
              <span>/</span>
              <span className="text-text-primary font-medium">{city}</span>
            </>
          )}
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
              {city ? `Properties for ${listingType === 'rent' ? 'Rent' : 'Sale'} in ${city}` : `All Properties for ${listingType === 'rent' ? 'Rent' : 'Sale'}`}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Showing {properties.length} verified listings with direct owner contact
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Grid vs Map View */}
            <div className="flex items-center rounded-xl border border-border-subtle bg-surface p-1 shadow-2xs">
              <Link
                href={`/properties?${new URLSearchParams({ ...(params as any), view: 'grid' }).toString()}`}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  view === 'grid'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </Link>
              <Link
                href={`/properties?${new URLSearchParams({ ...(params as any), view: 'map' }).toString()}`}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  view === 'map'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Map View
              </Link>
            </div>

            {/* Post property shortcut */}
            <Link
              href="/my-properties/create"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3.5 py-2 text-xs font-semibold text-brand-primary hover:bg-surface-secondary shadow-2xs transition shrink-0"
            >
              + Post Property Free
            </Link>
          </div>
        </div>
      </div>

      {/* Main 2-column layout: Sidebar filters + Property results or Map */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* ── LEFT SIDEBAR FILTERS ──────────────────────────────────── */}
        <aside className="space-y-6">
          <div className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-2xs transition-colors">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Filters</h2>
              <Link
                href={`/properties?listingType=${listingType}`}
                className="text-xs font-semibold text-brand-primary hover:underline"
              >
                Reset All
              </Link>
            </div>

            <form method="GET" action="/properties" className="space-y-5 pt-4">
              <input type="hidden" name="view" value={view} />

              {/* Buy / Rent Toggle */}
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-2">Purpose</label>
                <div className="grid grid-cols-2 rounded-xl bg-surface-secondary p-1">
                  <button
                    type="submit"
                    name="listingType"
                    value="sale"
                    className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                      listingType === 'sale'
                        ? 'bg-surface text-text-primary shadow-2xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    type="submit"
                    name="listingType"
                    value="rent"
                    className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                      listingType === 'rent'
                        ? 'bg-surface text-text-primary shadow-2xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Rent
                  </button>
                </div>
              </div>

              {/* Keyword / Locality search */}
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Locality / Landmark</label>
                <div className="relative">
                  <input
                    type="text"
                    name="q"
                    defaultValue={params.q ?? ''}
                    placeholder="e.g. Indiranagar, Bandra..."
                    className="w-full rounded-xl border border-border-strong bg-surface py-2 pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-hidden"
                  />
                  <svg className="absolute left-2.5 top-2.5 size-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* City */}
              <div>
                <label htmlFor="filter-city" className="block text-xs font-semibold uppercase text-text-muted mb-1.5">City</label>
                <select
                  id="filter-city"
                  name="city"
                  defaultValue={params.city ?? 'All'}
                  className="w-full rounded-xl border border-border-strong bg-surface py-2 px-2.5 text-xs text-text-primary focus:border-brand-primary focus:outline-hidden"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Property Type */}
              <div>
                <label htmlFor="filter-type" className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Property Type</label>
                <select
                  id="filter-type"
                  name="propertyType"
                  defaultValue={params.propertyType ?? ''}
                  className="w-full rounded-xl border border-border-strong bg-surface py-2 px-2.5 text-xs text-text-primary focus:border-brand-primary focus:outline-hidden"
                >
                  {PROPERTY_TYPES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Bedrooms (BHK) */}
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Bedrooms</label>
                <div className="grid grid-cols-4 gap-1">
                  {['', '1', '2', '3', '4'].map((val) => (
                    <button
                      key={val}
                      type="submit"
                      name="bedrooms"
                      value={val}
                      className={`rounded-lg border py-1.5 text-xs font-semibold transition ${
                        (params.bedrooms ?? '') === val
                          ? 'border-brand-primary bg-brand-primary-light text-brand-primary dark:bg-surface-secondary dark:text-brand-accent'
                          : 'border-border-subtle text-text-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      {val === '' ? 'Any' : `${val} BHK`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Presets */}
              <div>
                <label className="block text-xs font-semibold uppercase text-text-muted mb-1.5">Budget</label>
                <div className="space-y-1.5">
                  {budgetPresets.map((preset) => {
                    const isSelected =
                      (params.minPrice ?? '') === preset.min && (params.maxPrice ?? '') === preset.max;
                    return (
                      <Link
                        key={preset.label}
                        href={`/properties?${new URLSearchParams({
                          ...(params as any),
                          minPrice: preset.min,
                          maxPrice: preset.max,
                        }).toString()}`}
                        className={`block rounded-lg px-2.5 py-1.5 text-xs transition ${
                          isSelected
                            ? 'bg-brand-primary-light font-semibold text-brand-primary dark:bg-surface-secondary dark:text-brand-accent border border-brand-primary/30'
                            : 'text-text-secondary hover:bg-surface-secondary'
                        }`}
                      >
                        {preset.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Custom Min / Max Price */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle">
                <div>
                  <label htmlFor="filter-minPrice" className="block text-[10px] font-semibold uppercase text-text-muted mb-1">Min Price (₹)</label>
                  <input
                    id="filter-minPrice"
                    type="number"
                    name="minPrice"
                    defaultValue={params.minPrice ?? ''}
                    placeholder="Min"
                    className="w-full rounded-lg border border-border-strong bg-surface p-1.5 text-xs text-text-primary focus:border-brand-primary outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="filter-maxPrice" className="block text-[10px] font-semibold uppercase text-text-muted mb-1">Max Price (₹)</label>
                  <input
                    id="filter-maxPrice"
                    type="number"
                    name="maxPrice"
                    defaultValue={params.maxPrice ?? ''}
                    placeholder="Max"
                    className="w-full rounded-lg border border-border-strong bg-surface p-1.5 text-xs text-text-primary focus:border-brand-primary outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-brand-primary py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-primary-hover transition"
              >
                Apply Filters
              </button>
            </form>
          </div>
        </aside>

        {/* ── RIGHT MAIN CONTENT ────────────────────────────────────── */}
        <main className="space-y-6">
          {/* Active filter chips & Sort row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle pb-4">
            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-muted">Active:</span>
              {activeFilters.length > 0 ? (
                activeFilters.map((chip, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-text-secondary border border-border-subtle"
                  >
                    {chip}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-muted">None</span>
              )}
            </div>

            {/* Sort Dropdown */}
            <form method="GET" action="/properties" className="flex items-center gap-2 shrink-0">
              {Object.entries(params).map(([k, v]) => {
                if (k === 'sort' || !v) return null;
                return <input key={k} type="hidden" name={k} value={v} />;
              })}
              <label htmlFor="sort-dropdown" className="text-xs font-medium text-text-muted whitespace-nowrap">Sort by:</label>
              <select
                id="sort-dropdown"
                name="sort"
                defaultValue={params.sort ?? 'newest'}
                className="rounded-xl border border-border-strong bg-surface py-1.5 px-2.5 text-xs text-text-primary focus:border-brand-primary outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <button
                type="submit"
                className="rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-secondary"
              >
                Sort
              </button>
            </form>
          </div>

          {/* Conditional View: MAP VIEW or PROPERTY CARDS */}
          {view === 'map' ? (
            <MapView properties={properties} city={city ?? 'Bengaluru'} />
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border-strong bg-surface p-12 text-center transition-colors">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-secondary text-text-muted mb-4">
                <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-primary">No properties match your search</h3>
              <p className="mt-1 text-sm text-text-muted max-w-sm mx-auto">
                Try widening your budget range, clearing filters, or searching a different city or locality.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/properties"
                  className="rounded-xl bg-brand-primary px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-primary-hover"
                >
                  Clear all filters
                </Link>
                <Link
                  href="/my-properties/create"
                  className="rounded-xl border border-border-subtle bg-surface px-5 py-2 text-xs font-semibold text-text-primary hover:bg-surface-secondary"
                >
                  List your property
                </Link>
              </div>
            </div>
          )}

          {/* Keyset Pagination */}
          {view !== 'map' && hasNextPage && nextCursor && (
            <div className="flex justify-center pt-8">
              <Link
                href={`/properties?${new URLSearchParams({
                  ...(params as any),
                  cursor: nextCursor,
                }).toString()}`}
                className="rounded-xl border border-border-subtle bg-surface px-8 py-3 text-sm font-bold text-text-primary shadow-xs hover:bg-surface-secondary transition"
              >
                Load Next Page →
              </Link>
            </div>
          )}
        </main>
      </div>
    </Container>
  );
}
