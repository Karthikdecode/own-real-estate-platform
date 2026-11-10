'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { PropertySummary } from '@real-estate/contracts';
import { formatPrice } from '@/lib/utils/format';

interface MapViewProps {
  properties: PropertySummary[];
  city?: string;
}

export function MapView({ properties, city = 'All Cities' }: MapViewProps) {
  const [selectedProperty, setSelectedProperty] = useState<PropertySummary | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);

  // Distribute pins evenly inside the radius circle for visual demo
  const pins = properties.map((property, idx) => {
    // Semi-random angle and radius within circle
    const angle = (idx * 137.5 * Math.PI) / 180; // golden ratio angle
    const distancePercent = 10 + ((idx * 23) % 35); // 10% to 45% radius
    const left = 50 + distancePercent * Math.cos(angle);
    const top = 50 + distancePercent * Math.sin(angle);
    return { property, left, top };
  });

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
      {/* Map Background Grid / Street Roads Texture (Inspired by Reference Image 2) */}
      <div
        className="absolute inset-0 opacity-80 dark:opacity-40 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:40px_40px]"
        style={{
          backgroundPosition: 'center center',
        }}
      />

      {/* Decorative road lines on map */}
      <svg className="absolute inset-0 size-full pointer-events-none opacity-40 dark:opacity-20">
        <path d="M-100 200 L900 450" stroke="#f97316" strokeWidth="6" fill="none" />
        <path d="M200 -50 L400 700" stroke="#3b82f6" strokeWidth="4" fill="none" />
        <path d="M0 350 Q 300 250, 800 380" stroke="#94a3b8" strokeWidth="3" fill="none" />
        <path d="M500 0 Q 600 300, 450 700" stroke="#94a3b8" strokeWidth="3" fill="none" />
      </svg>

      {/* ── Circular Radius Search Boundary (Exact match to Reference Image 2) ── */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500/80 bg-blue-500/10 dark:bg-blue-500/15 pointer-events-none transition-all duration-300"
        style={{
          width: `${radiusKm * 80}px`,
          height: `${radiusKm * 80}px`,
          maxWidth: '92%',
          maxHeight: '92%',
        }}
      >
        {/* Radius drag handle indicators (top, bottom, left, right, center) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-white bg-blue-600 shadow" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 size-4 rounded-full border-2 border-white bg-blue-600 shadow" />
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-white bg-blue-600 shadow" />
        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 size-4 rounded-full border-2 border-white bg-blue-600 shadow" />
      </div>

      {/* Center Anchor Point */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
        <div className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="mt-1 rounded-md bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:text-slate-100 shadow backdrop-blur">
          {city} Center
        </span>
      </div>

      {/* Top Map Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-20 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-xl bg-white/95 dark:bg-slate-900/95 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white shadow-md backdrop-blur border border-slate-200 dark:border-slate-800">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          Radius Search: {radiusKm} km ({properties.length} properties in zone)
        </div>

        {/* Radius adjustment slider */}
        <div className="flex items-center gap-2 rounded-xl bg-white/95 dark:bg-slate-900/95 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 shadow-md backdrop-blur border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold">Radius:</span>
          <input
            type="range"
            min="2"
            max="7"
            step="0.5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-24 accent-brand-700 cursor-pointer"
          />
          <span className="font-bold text-brand-700 dark:text-teal-400">{radiusKm} km</span>
        </div>
      </div>

      {/* Property Pin Markers (Matching Image 2 cluster dots) */}
      {pins.map(({ property, left, top }) => {
        const isSelected = selectedProperty?.id === property.id;
        return (
          <div
            key={property.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
            style={{ left: `${left}%`, top: `${top}%` }}
            onClick={() => setSelectedProperty(property)}
          >
            {/* Dot pin marker like 99acres reference */}
            <div
              className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                isSelected
                  ? 'size-7 bg-brand-700 ring-4 ring-brand-300 dark:ring-teal-700 text-white font-bold text-[11px]'
                  : 'size-4.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-125 hover:bg-brand-700 dark:hover:bg-brand-600 shadow-md'
              }`}
            >
              <div className="size-2 rounded-full bg-white dark:bg-slate-900" />
            </div>

            {/* Hover tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xl">
              {formatPrice(property.price, property.listingType)} • {property.title.slice(0, 24)}...
            </div>
          </div>
        );
      })}

      {/* Selected Property Popup Card */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl z-30 transition-all">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white ${
                selectedProperty.listingType === 'sale' ? 'bg-brand-700' : 'bg-emerald-600'
              }`}
            >
              For {selectedProperty.listingType === 'sale' ? 'Sale' : 'Rent'}
            </span>
            <button
              onClick={() => setSelectedProperty(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mt-2 flex gap-3">
            {selectedProperty.primaryImageUrl && (
              <img
                src={selectedProperty.primaryImageUrl}
                alt={selectedProperty.title}
                className="size-16 rounded-xl object-cover shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {formatPrice(selectedProperty.price, selectedProperty.listingType)}
              </p>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {selectedProperty.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {selectedProperty.locality}, {selectedProperty.city}
              </p>
            </div>
          </div>

          <Link
            href={`/properties/${selectedProperty.slug}`}
            className="mt-3 block w-full rounded-xl bg-brand-700 py-2 text-center text-xs font-bold text-white shadow-xs hover:bg-brand-800 transition"
          >
            View Full Listing Details →
          </Link>
        </div>
      )}
    </div>
  );
}

