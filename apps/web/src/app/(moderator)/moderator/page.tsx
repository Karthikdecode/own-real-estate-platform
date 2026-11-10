'use client';

import { useEffect, useState } from 'react';
import type { AdminPropertyItem } from '@real-estate/contracts';
import {
  getAdminProperties,
  getAdminPropertyById,
  moderateProperty,
  type AdminPropertyDetail,
} from '@/features/admin/services/admin.service';
import { formatDate, formatPrice } from '@/lib/utils/format';

export default function ModeratorDashboardPage() {
  const [properties, setProperties] = useState<AdminPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedProperty, setSelectedProperty] = useState<AdminPropertyDetail | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadProperties = async () => {
    setLoading(true);
    try {
      const res = await getAdminProperties({
        status: filter === 'all' ? undefined : (filter as any),
        limit: 50,
      });
      setProperties(res.items);
    } catch (err) {
      console.error('Failed to load properties for moderation', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [filter]);

  const handleInspect = async (id: string) => {
    try {
      const details = await getAdminPropertyById(id);
      setSelectedProperty(details);
      setRemarks('');
      setActionSuccess('');
    } catch (err: any) {
      alert(err?.message || 'Failed to fetch property details.');
    }
  };

  const handleModerate = async (action: 'approve' | 'reject') => {
    if (!selectedProperty) return;
    setActionLoading(true);
    setActionSuccess('');
    try {
      await moderateProperty(selectedProperty.id, {
        action,
        remarks: remarks || `Moderator marked listing as ${action === 'approve' ? 'published' : 'rejected'}.`,
      });
      setActionSuccess(`Listing successfully marked as ${action === 'approve' ? 'approved & published' : 'rejected'}.`);
      await loadProperties();
      // refresh details
      const refreshed = await getAdminPropertyById(selectedProperty.id);
      setSelectedProperty(refreshed);
    } catch (err: any) {
      alert(err?.message || 'Moderation action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── QUEUE HEADER & STATS ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Listing Quality Review Queue</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Audit property details, photos, and compliance before publication
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 shadow-2xs">
          {(['all', 'published', 'draft'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                filter === tab
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN SPLIT VIEW (TABLE & INSPECTION PANEL) ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table of Listings */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              {properties.length} Properties in Queue
            </span>
            <button
              onClick={loadProperties}
              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              <div className="inline-block size-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-2" />
              <p>Loading queue...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No properties found in this filter view.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {properties.map((p) => {
                const isSelected = selectedProperty?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleInspect(p.id)}
                    className={`p-4 flex items-center justify-between gap-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-l-4 border-amber-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`rounded px-2 py-0.5 text-[9px] font-black uppercase ${
                            p.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {p.propertyType} • For {p.listingType}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {p.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.locality}, {p.city} • <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPrice(p.price, p.listingType)}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-amber-500 transition">
                        Review →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Review Inspection & Actions Drawer */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-2xs sticky top-20 space-y-5">
          {selectedProperty ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                    Audit Inspection
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                      selectedProperty.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {selectedProperty.status}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {selectedProperty.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ID: <span className="font-mono">{selectedProperty.id}</span>
                </p>
              </div>

              {/* Photo Strip */}
              {selectedProperty.images && selectedProperty.images.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                    Listing Photos ({selectedProperty.images.length})
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedProperty.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt="Property preview"
                        className="size-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Specs */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Price</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatPrice(selectedProperty.price, selectedProperty.listingType)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Super Built-up Area</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedProperty.areaSqft} sq.ft
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Bedrooms / Baths</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedProperty.bedrooms ? `${selectedProperty.bedrooms} BHK` : '—'} / {selectedProperty.bathrooms ?? '—'} Baths
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Location</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {selectedProperty.locality}, {selectedProperty.city}
                  </span>
                </div>
              </div>

              {/* Moderation Form */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Moderator Remarks / Feedback
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Verified ownership proof, images match standards..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />

                {actionSuccess && (
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                    {actionSuccess}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleModerate('approve')}
                    className="rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    ✓ Approve & Publish
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleModerate('reject')}
                    className="rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    ✕ Reject Listing
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              <span className="text-3xl block mb-2">👈</span>
              Select any listing from the left queue to inspect photos, details, and execute moderation actions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

