'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { OwnerPropertySummary } from '@real-estate/contracts';
import { deleteProperty, getMyListings } from '@/features/properties/services/property-management.service';
import { formatPrice, formatPropertyType } from '@/lib/utils/format';

export function OwnerDashboard() {
  const [properties, setProperties] = useState<OwnerPropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const loadProperties = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyListings({ limit: 50 });
      setProperties(data.items);
    } catch (err: any) {
      setError(
        err?.message ||
          'Please sign in to view your listings. If you just registered or signed in, try refreshing.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteProperty(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete listing.');
    }
  };

  const filtered = properties.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const publishedCount = properties.filter((p) => p.status === 'published').length;
  const draftCount = properties.filter((p) => p.status === 'draft').length;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-12 text-center text-sm text-slate-500 dark:text-slate-400 shadow-2xs">
        <div className="inline-block size-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent mb-3" />
        <p>Loading your property dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-8 text-center shadow-2xs">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{error}</p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-xl bg-brand-700 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-800"
        >
          Sign In to Your Account
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Owner Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your properties, monitor performance and view buyer inquiries
          </p>
        </div>
        <Link
          href="/my-properties/create"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-800 transition shrink-0"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Post New Property
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Listings</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{properties.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Live (Published)</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{publishedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Drafts</p>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{draftCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Leads & Inquiries</p>
          <Link
            href="/my-properties/inquiries"
            className="text-sm font-bold text-brand-700 dark:text-teal-400 hover:underline flex items-center gap-1 mt-2"
          >
            View Leads →
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            filter === 'all'
              ? 'bg-slate-900 text-white dark:bg-brand-700'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All ({properties.length})
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            filter === 'published'
              ? 'bg-slate-900 text-white dark:bg-brand-700'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Published ({publishedCount})
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            filter === 'draft'
              ? 'bg-slate-900 text-white dark:bg-brand-700'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Drafts ({draftCount})
        </button>
      </div>

      {/* Listings Table or Empty State */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center transition-colors">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
            <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No properties found</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {filter === 'all'
              ? 'Publish your first property listing to start receiving direct inquiries from verified buyers.'
              : `You have no listings under the "${filter}" filter.`}
          </p>
          <Link
            href="/my-properties/create"
            className="mt-4 inline-block rounded-xl bg-brand-700 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-800"
          >
            Post Property for Free
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Property</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.primaryImageUrl ? (
                          <img
                            src={p.primaryImageUrl}
                            alt={p.title}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/images/hero-home-poster.webp';
                            }}
                            className="size-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex size-14 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-400 font-medium">
                            No photo
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/properties/${p.slug}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-brand-700 dark:hover:text-teal-400 line-clamp-1 text-sm"
                          >
                            {p.title}
                          </Link>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {p.locality}, {p.city}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize font-medium text-slate-800 dark:text-slate-200">{formatPropertyType(p.propertyType)}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 block uppercase mt-0.5">
                        For {p.listingType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {formatPrice(p.price, p.listingType)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          p.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : p.status === 'draft'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/properties/${p.slug}`}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          View
                        </Link>
                        <Link
                          href={`/my-properties/${p.id}/edit`}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          className="rounded-lg border border-red-200 dark:border-red-900/40 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
