'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface HeroSectionProps {
  cities: { name: string; slug: string }[];
}

type HeroTab = 'buy' | 'rent' | 'pg' | 'commercial' | 'coworking' | 'plot' | 'projects';

export function HeroSection({ cities }: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [tab, setTab] = useState<HeroTab>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [residentialType, setResidentialType] = useState('all');

  useEffect(() => {
    // Respect user's reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (videoRef.current) {
      videoRef.current.currentTime = 2.5; // Jump past initial dark frames directly to the vibrant home
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay may wait for user interaction in some browsers
      });
    }
  }, []);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => setVideoError(true));
      setIsPlaying(true);
    }
  };

  const getPlaceholder = () => {
    switch (tab) {
      case 'rent':
        return 'Search "Indiranagar", "Bandra" or "Whitefield"...';
      case 'pg':
        return 'Search PG near tech parks, universities...';
      case 'commercial':
        return 'Search office spaces, retail shops or warehouses...';
      case 'coworking':
        return 'Search coworking desks or managed office...';
      case 'plot':
        return 'Search residential plots, gated land in Bengaluru...';
      case 'projects':
        return 'Search new luxury launch projects or builders...';
      default:
        return 'Search "Hyderabad", "Bengaluru", "Chennai" or locality...';
    }
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setSearchQuery('Bengaluru');
        },
        () => {
          setSearchQuery('Bengaluru');
        },
      );
    } else {
      setSearchQuery('Bengaluru');
    }
  };

  const handleVoiceSearch = () => {
    // Graceful voice search simulation / Web Speech API if supported
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
      };
      recognition.start();
    } else {
      setSearchQuery('Anna Nagar, Chennai');
    }
  };

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white min-h-[640px] flex items-center">
      {/* ── CINEMATIC VIDEO BACKGROUND WITH PERMANENT POSTER BACKDROP ────────── */}
      <div className="absolute inset-0 size-full overflow-hidden bg-slate-950">
        {/* Permanent luxury home poster prevents any initial dark frame or buffering black box */}
        <img
          src="/images/hero-home-poster.webp"
          alt="Cinematic luxury home architecture"
          className="absolute inset-0 size-full object-cover object-center"
        />

        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/images/hero-home-poster.webp"
            onLoadedData={() => {
              if (videoRef.current && videoRef.current.currentTime < 2.5) {
                videoRef.current.currentTime = 2.5;
              }
            }}
            onError={() => setVideoError(true)}
            className="absolute inset-0 size-full object-cover object-center scale-105 transition-opacity duration-700"
          >
            <source src="/hero-home-tour.mp4" type="video/mp4" onError={() => setVideoError(true)} />
            <source src="/videos/hero-home-tour.mp4" type="video/mp4" onError={() => setVideoError(true)} />
          </video>
        )}

        {/* ── CINEMATIC GRADIENT OVERLAY (VIBRANT & VISIBLE HOME TOUR) ─────── */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/40 to-slate-950/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />
      </div>

      {/* ── VIDEO PAUSE / PLAY TOGGLE CONTROL ───────────────────────── */}
      {!videoError && (
        <button
          onClick={togglePlayback}
          type="button"
          aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
          className="absolute bottom-5 right-5 z-20 flex size-9 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur border border-white/20 hover:bg-slate-900 transition shadow-lg"
          title={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? (
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}

      {/* ── HERO CONTENT & SEARCH PANEL ────────────────────────────── */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 z-10 w-full">
        <div className="max-w-3xl">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur border border-white/15 mb-4">
            <span className="size-2 rounded-full bg-brand-accent animate-pulse" />
            Verified Listings • Direct Owner Contact • Zero Brokerage
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-tight">
            Find a Place That <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-200 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              Feels Like Home.
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-200/90 max-w-2xl leading-relaxed">
            Discover verified properties across India, explore neighborhood details, and connect directly with property owners without intermediaries.
          </p>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/properties"
              className="rounded-xl bg-brand-primary px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg hover:bg-brand-primary-hover transition"
            >
              Explore Properties
            </Link>
            <Link
              href="/my-properties/create"
              className="rounded-xl bg-white/15 px-6 py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur border border-white/20 hover:bg-white/25 transition"
            >
              Post Your Property — Free
            </Link>
          </div>
        </div>

        {/* ── 99ACRES-STYLE SEARCH WIDGET (MATCHES USER IMAGE 3) ──────── */}
        <div className="mt-10 max-w-4xl rounded-2xl sm:rounded-3xl bg-surface p-3 sm:p-5 shadow-2xl border border-border-subtle transition-colors text-text-primary">
          {/* Top Horizontal Tabs: Buy | Rent | PG | Commercial | Coworking | Plots/Land NEW | Projects */}
          <div className="flex items-center gap-2 sm:gap-6 border-b border-border-subtle px-2 pb-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'buy', label: 'Buy' },
              { id: 'rent', label: 'Rent' },
              { id: 'pg', label: 'PG / Co-living' },
              { id: 'commercial', label: 'Commercial' },
              { id: 'coworking', label: 'Coworking' },
              { id: 'plot', label: 'Plots/Land', badge: 'NEW' },
              { id: 'projects', label: 'Projects' },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id as HeroTab)}
                  className={`relative shrink-0 pb-2 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                    active
                      ? 'text-brand-primary dark:text-brand-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>{t.label}</span>
                  {t.badge && (
                    <span className="rounded bg-brand-primary/10 dark:bg-brand-accent/20 px-1 py-0.5 text-[9px] font-extrabold uppercase text-brand-primary dark:text-brand-accent">
                      {t.badge}
                    </span>
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary dark:bg-brand-accent rounded-full transition-all" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Inputs Row with All Residential Dropdown, Input + GPS + Mic, and Search Button */}
          <form action="/properties" method="GET" className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Listing Type Hidden Binding */}
            <input
              type="hidden"
              name="listingType"
              value={tab === 'rent' || tab === 'pg' || tab === 'coworking' ? 'rent' : 'sale'}
            />

            {/* Left Filter Dropdown: "All Residential ⌵" / "All Commercial" */}
            <div className="sm:w-44 shrink-0">
              <select
                name="propertyType"
                value={residentialType}
                onChange={(e) => setResidentialType(e.target.value)}
                aria-label="Property Category"
                className="w-full rounded-xl border border-border-subtle bg-surface-secondary px-3 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-text-primary focus:border-brand-primary outline-none transition cursor-pointer"
              >
                {tab === 'commercial' || tab === 'coworking' ? (
                  <>
                    <option value="commercial">All Commercial ⌵</option>
                    <option value="commercial">Office Spaces</option>
                    <option value="commercial">Retail Shops</option>
                  </>
                ) : tab === 'plot' ? (
                  <>
                    <option value="plot">All Plots / Land ⌵</option>
                    <option value="plot">Residential Plots</option>
                    <option value="plot">Gated Communities</option>
                  </>
                ) : (
                  <>
                    <option value="all">All Residential ⌵</option>
                    <option value="apartment">Apartments / Flats</option>
                    <option value="independent_house">Independent House</option>
                    <option value="villa">Villas</option>
                  </>
                )}
              </select>
            </div>

            {/* Main Location Search Input with GPS Target & Voice Mic icons (Image 3) */}
            <div className="relative flex-1 flex items-center">
              <svg
                className="absolute left-3.5 size-4 text-text-muted shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              <input
                type="text"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full rounded-xl border border-border-subtle bg-surface py-2.5 sm:py-3 pl-10 pr-20 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition"
              />

              {/* GPS Location Target Icon & Voice Mic inside Input (matching Image 3) */}
              <div className="absolute right-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  title="Detect current location"
                  aria-label="Detect current location"
                  className="flex size-7 items-center justify-center rounded-full text-brand-primary dark:text-brand-accent hover:bg-surface-secondary transition"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    <circle cx="12" cy="12" r="8" strokeWidth="2" strokeDasharray="4 2" />
                    <line x1="12" y1="2" x2="12" y2="4" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="20" x2="12" y2="22" strokeWidth="2" strokeLinecap="round" />
                    <line x1="2" y1="12" x2="4" y2="12" strokeWidth="2" strokeLinecap="round" />
                    <line x1="20" y1="12" x2="22" y2="12" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  title="Search by voice"
                  aria-label="Search by voice"
                  className="flex size-7 items-center justify-center rounded-full text-brand-primary dark:text-brand-accent hover:bg-surface-secondary transition"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* City Selector */}
            <div className="sm:w-36 shrink-0">
              <select
                name="city"
                aria-label="Filter by city"
                className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-text-primary focus:border-brand-primary outline-none transition"
              >
                <option value="">All Cities</option>
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Blue / Teal Search Button */}
            <button
              type="submit"
              className="rounded-xl bg-brand-primary px-7 py-2.5 sm:py-3 text-sm font-bold text-white shadow-md hover:bg-brand-primary-hover transition whitespace-nowrap"
            >
              Search
            </button>
          </form>

          {/* Popular Search Shortcuts */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-border-subtle">
            <span className="text-xs text-text-muted font-medium">Popular:</span>
            {[
              { label: '2 BHK in Bengaluru', query: 'Bengaluru' },
              { label: 'Flats in Mumbai under ₹1 Cr', query: 'Mumbai' },
              { label: 'Villas in Chennai', query: 'Chennai' },
              { label: 'Plots in Hyderabad', query: 'Hyderabad' },
            ].map((item) => (
              <Link
                key={item.label}
                href={`/properties?q=${encodeURIComponent(item.query)}`}
                className="rounded-full border border-border-subtle bg-surface-secondary px-3 py-1 text-xs text-text-secondary hover:border-brand-primary hover:text-brand-primary transition"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Platform Metrics */}
        <div className="mt-8 flex flex-wrap gap-8 text-white">
          {[
            { value: '50,000+', label: 'Active Listings' },
            { value: '25+', label: 'Major Cities' },
            { value: '1 Lakh+', label: 'Happy Customers' },
            { value: '0%', label: 'Brokerage' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-teal-300">{stat.value}</p>
              <p className="text-xs text-slate-300 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
