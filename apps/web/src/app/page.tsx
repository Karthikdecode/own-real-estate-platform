import type { Metadata } from 'next';
import Link from 'next/link';
import { searchProperties } from '@/features/properties/services/property-catalog.service';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/config/site';
import { PropertyCard } from '@/components/properties/property-card';
import { HeroSection } from '@/components/home/hero-section';

export const metadata: Metadata = buildPageMetadata({
  title: `${siteConfig.name} | Buy, Rent & Explore Real Estate in India`,
  description: siteConfig.description,
  path: '/',
});

const CITIES = [
  {
    name: 'Bengaluru',
    slug: 'Bengaluru',
    count: '12,500+',
    image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400&q=80',
  },
  {
    name: 'Mumbai',
    slug: 'Mumbai',
    count: '18,200+',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80',
  },
  {
    name: 'Chennai',
    slug: 'Chennai',
    count: '8,900+',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&q=80',
  },
  {
    name: 'Pune',
    slug: 'Pune',
    count: '7,400+',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&q=80',
  },
  {
    name: 'Hyderabad',
    slug: 'Hyderabad',
    count: '10,100+',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80',
  },
  {
    name: 'Delhi',
    slug: 'Delhi',
    count: '15,800+',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80',
  },
];

const CATEGORIES = [
  { label: 'Apartments', icon: '🏢', type: 'apartment', count: 'Flats & High-Rise' },
  { label: 'Independent Houses', icon: '🏠', type: 'independent_house', count: 'Standalone Homes' },
  { label: 'Luxury Villas', icon: '🏡', type: 'villa', count: 'Gated Communities' },
  { label: 'Plots & Land', icon: '🗺️', type: 'plot', count: 'Residential Sites' },
  { label: 'Commercial Spaces', icon: '🏪', type: 'commercial', count: 'Offices & Retail' },
];

const VALUE_PROPS = [
  {
    icon: (
      <svg className="size-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Verified Information',
    desc: 'Listings verified with authentic location, area specs and real photographs.',
  },
  {
    icon: (
      <svg className="size-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
    title: 'Direct Owner Connect',
    desc: 'Communicate directly with property owners with zero intermediary brokerage.',
  },
  {
    icon: (
      <svg className="size-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'Smart Discovery',
    desc: 'Fast keyset search filtered by city, locality, budget presets and configuration.',
  },
  {
    icon: (
      <svg className="size-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Easy Site Visits',
    desc: 'Request site visits and clarify property specifics directly through the platform.',
  },
];

const CUSTOMER_STEPS = [
  { step: '01', title: 'Search & Filter', desc: 'Browse flats, houses and plots by city and budget.' },
  { step: '02', title: 'Explore Details', desc: 'Check verified photos, pricing, area sq.ft and specs.' },
  { step: '03', title: 'Contact Owner', desc: 'Send a message directly to arrange a site visit.' },
  { step: '04', title: 'Close with Confidence', desc: 'Visit the home, finalize details, and move in.' },
];

const OWNER_STEPS = [
  { step: '01', title: 'Register Free', desc: 'Create your owner account in under a minute.' },
  { step: '02', title: 'List Property', desc: 'Add pricing, BHK, locality and description.' },
  { step: '03', title: 'Receive Leads', desc: 'Get direct inquiries from verified buyers and tenants.' },
  { step: '04', title: 'Manage Inquiries', desc: 'Track and update lead status from your portal.' },
];

async function FeaturedSaleSection() {
  try {
    const data = await searchProperties({ listingType: 'sale', sort: 'newest', limit: 6 });
    if (!data.items.length) return null;
    return (
      <section className="py-14 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">Handpicked Inventory</p>
              <h2 className="mt-1 text-2xl font-extrabold text-text-primary sm:text-3xl">Featured Properties for Sale</h2>
              <p className="mt-1 text-sm text-text-muted">Verified residential homes ready for immediate site visits</p>
            </div>
            <Link
              href="/properties?listingType=sale"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-secondary shadow-2xs transition"
            >
              View all sale properties →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </section>
    );
  } catch {
    return null;
  }
}

async function FeaturedRentSection() {
  try {
    const data = await searchProperties({ listingType: 'rent', sort: 'newest', limit: 3 });
    if (!data.items.length) return null;
    return (
      <section className="py-14 bg-surface border-y border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">Rental Homes</p>
              <h2 className="mt-1 text-2xl font-extrabold text-text-primary sm:text-3xl">Popular Rentals</h2>
              <p className="mt-1 text-sm text-text-muted">Flats and houses available for monthly rent with transparent pricing</p>
            </div>
            <Link
              href="/properties?listingType=rent"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-secondary shadow-2xs transition"
            >
              View all rentals →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {data.items.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </section>
    );
  } catch {
    return null;
  }
}

export default function HomePage() {
  return (
    <>
      {/* ── CINEMATIC HERO SECTION WITH VIDEO + INTEGRATED SEARCH ──── */}
      <HeroSection cities={CITIES} />

      {/* ── VALUE PROPOSITIONS (SECTION 9) ─────────────────────────── */}
      <section className="bg-surface py-10 border-b border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((v) => (
              <div key={v.title} className="flex items-start gap-3.5 p-3 rounded-2xl transition">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary-light dark:bg-surface-secondary">
                  {v.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">{v.title}</p>
                  <p className="mt-1 text-xs text-text-secondary leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR CITIES (SECTION 9A) ────────────────────────────── */}
      <section className="bg-background py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">Explore Locations</p>
            <h2 className="mt-1 text-2xl font-extrabold text-text-primary sm:text-3xl">Popular Real Estate Markets</h2>
            <p className="mt-1 text-sm text-text-muted">Browse verified properties across India's top metropolitan centers</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/properties?city=${encodeURIComponent(city.slug)}`}
                className="group relative overflow-hidden rounded-2xl shadow-2xs border border-border-subtle"
              >
                <div className="aspect-[4/3] relative">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-3 text-white">
                    <p className="text-sm font-bold">{city.name}</p>
                    <p className="text-xs text-slate-200/90">{city.count} listings</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROPERTY CATEGORIES (SECTION 9B) ───────────────────────── */}
      <section className="bg-surface py-14 border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">Property Types</p>
            <h2 className="mt-1 text-2xl font-extrabold text-text-primary">Browse by Category</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.type}
                href={`/properties?propertyType=${cat.type}`}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border-subtle bg-surface-secondary p-6 text-center shadow-2xs transition hover:border-brand-primary hover:shadow-md hover:-translate-y-0.5"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition">
                  {cat.label}
                </span>
                <span className="text-xs text-text-muted">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED SALE INVENTORY ────────────────────────────────── */}
      <FeaturedSaleSection />

      {/* ── FEATURED RENT INVENTORY ────────────────────────────────── */}
      <FeaturedRentSection />

      {/* ── HOW IT WORKS (SECTION 9E) ──────────────────────────────── */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">Transparent Process</p>
            <h2 className="mt-2 text-2xl font-extrabold text-text-primary sm:text-3xl">How It Works</h2>
            <p className="mt-2 text-sm text-text-muted max-w-xl mx-auto">
              Whether you are searching for your dream home or listing your property, the process is clear and simple.
            </p>
          </div>

          <div className="space-y-12">
            {/* For Home Seekers */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4 flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-brand-primary text-[10px] text-white">✓</span>
                For Buyers & Tenants
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {CUSTOMER_STEPS.map((s) => (
                  <div key={s.step} className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-2xs">
                    <span className="text-xs font-extrabold text-brand-primary">{s.step}</span>
                    <h3 className="mt-2 text-sm font-bold text-text-primary">{s.title}</h3>
                    <p className="mt-1 text-xs text-text-secondary leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* For Property Owners */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4 flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-brand-primary text-[10px] text-white">✓</span>
                For Property Owners
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {OWNER_STEPS.map((s) => (
                  <div key={s.step} className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-2xs">
                    <span className="text-xs font-extrabold text-brand-primary">{s.step}</span>
                    <h3 className="mt-2 text-sm font-bold text-text-primary">{s.title}</h3>
                    <p className="mt-1 text-xs text-text-secondary leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OWNER CTA SECTION (SECTION 9F) ─────────────────────────── */}
      <section className="bg-surface py-16 border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-brand-primary via-brand-primary to-brand-primary-hover p-8 sm:p-12 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center lg:text-left">
              <span className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold backdrop-blur mb-3">
                Zero Brokerage Platform
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
                Have a Property to Sell or Rent?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/90 leading-relaxed">
                Reach genuine buyers and tenants looking for their next home. Create a verified property listing in under 5 minutes with zero listing fees.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3.5 shrink-0 w-full sm:w-auto">
              <Link
                href="/my-properties/create"
                className="rounded-xl bg-white px-7 py-3.5 text-center text-sm font-bold text-brand-primary shadow-lg hover:bg-slate-50 transition"
              >
                Post Your Property — Free
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-white/40 bg-white/10 px-7 py-3.5 text-center text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
