'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getAdminDashboardStats,
  getAdminProperties,
  type AdminPropertyDetail,
} from '@/features/admin/services/admin.service';
import type { AdminDashboardStats, AdminPropertyItem } from '@real-estate/contracts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentProperties, setRecentProperties] = useState<AdminPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, propsPage] = await Promise.all([
        getAdminDashboardStats(),
        getAdminProperties({ limit: 6 }),
      ]);
      setStats(s);
      setRecentProperties(propsPage.items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatPrice = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case 'unpublished':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <span className="size-1.5 rounded-full bg-rose-500" />
            Unpublished
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            Moderation & System Overview
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Live database telemetry, property moderation queue, and user activity metrics.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3.5 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition"
          >
            <svg
              className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Metrics
          </button>
          <Link
            href="/admin/properties"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-primary-hover transition"
          >
            Go to Moderation Queue →
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* ── KPI METRICS GRID ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: 'Total Properties',
            value: stats ? stats.totalProperties : '—',
            accent: 'text-brand-primary dark:text-brand-accent',
            bg: 'bg-brand-primary/10',
            sub: 'Database total',
          },
          {
            label: 'Published',
            value: stats ? stats.publishedProperties : '—',
            accent: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/10',
            sub: 'Live on search',
          },
          {
            label: 'Pending Review',
            value: stats ? stats.pendingReviewProperties : '—',
            accent: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/10',
            sub: 'Draft submissions',
          },
          {
            label: 'Unpublished',
            value: stats ? stats.unpublishedProperties : '—',
            accent: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-500/10',
            sub: 'Rejected / hidden',
          },
          {
            label: 'Registered Users',
            value: stats ? stats.totalUsers : '—',
            accent: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500/10',
            sub: 'Owners & buyers',
          },
          {
            label: 'Total Inquiries',
            value: stats ? stats.totalInquiries : '—',
            accent: 'text-cyan-600 dark:text-cyan-400',
            bg: 'bg-cyan-500/10',
            sub: 'Buyer connections',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface p-4 shadow-2xs transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{card.label}</span>
              <span className={`size-2 rounded-full ${card.bg}`} />
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-black tracking-tight ${card.accent}`}>
                {loading ? <span className="inline-block size-6 animate-pulse rounded bg-surface-secondary" /> : card.value}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── RECENT PROPERTIES MODERATION TABLE ── */}
      <div className="rounded-2xl border border-border-subtle bg-surface shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-border-subtle p-5">
          <div>
            <h2 className="text-base font-extrabold text-text-primary">Recent Properties Submissions</h2>
            <p className="text-xs text-text-muted">Review, approve, or reject property listings across all locations</p>
          </div>
          <Link
            href="/admin/properties"
            className="text-xs font-bold text-brand-primary dark:text-brand-accent hover:underline"
          >
            View All Properties →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-text-muted">Loading properties queue…</div>
        ) : recentProperties.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted">No properties found in database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-text-muted border-b border-border-subtle uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Property</th>
                  <th className="px-4 py-3.5 font-bold">Location</th>
                  <th className="px-4 py-3.5 font-bold">Type</th>
                  <th className="px-4 py-3.5 font-bold">Price</th>
                  <th className="px-4 py-3.5 font-bold">Owner</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {recentProperties.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-11 shrink-0 overflow-hidden rounded-xl bg-surface-secondary border border-border-subtle">
                          {p.primaryImageUrl ? (
                            <img
                              src={p.primaryImageUrl}
                              alt={p.title}
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-text-muted text-xs">
                              🏠
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="truncate font-bold text-text-primary">{p.title}</p>
                          <p className="text-[10px] text-text-muted">{p.bedrooms ? `${p.bedrooms} BHK • ` : ''}{p.areaSqft} sq.ft</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-text-secondary whitespace-nowrap">
                      <p className="font-medium text-text-primary">{p.locality}</p>
                      <p className="text-[10px] text-text-muted">{p.city}</p>
                    </td>
                    <td className="px-4 py-4 capitalize text-text-secondary whitespace-nowrap">
                      <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-semibold">
                        {p.listingType} • {p.propertyType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-text-primary whitespace-nowrap">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-semibold text-text-primary">{p.owner.fullName}</p>
                      <p className="text-[10px] text-text-muted">{p.owner.email}</p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(p.status)}</td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/properties?reviewId=${p.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-1 text-xs font-bold text-brand-primary dark:text-brand-accent hover:bg-brand-primary/20 transition"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SYSTEM INFORMATION & GOVERNANCE BANNER ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-border-subtle bg-surface p-5">
          <div className="flex items-center gap-2 text-brand-primary dark:text-brand-accent font-bold text-sm">
            <span>🛡️</span>
            <span>Enterprise RBAC</span>
          </div>
          <p className="mt-2 text-xs text-text-muted leading-relaxed">
            Strict server-side role-based access control enforces administrative capabilities across all routes. Unprivileged users are rejected with HTTP 403 Forbidden.
          </p>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface p-5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <span>📜</span>
            <span>Audit Trail Logging</span>
          </div>
          <p className="mt-2 text-xs text-text-muted leading-relaxed">
            Every moderation action (Approve, Reject, Request Changes) records an immutable entry into <code className="text-text-primary">property_status_history</code> and <code className="text-text-primary">admin_audit_logs</code>.
          </p>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface p-5">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
            <span>⚡</span>
            <span>Sub-Millisecond Query Engine</span>
          </div>
          <p className="mt-2 text-xs text-text-muted leading-relaxed">
            Indexed with composite keys <code className="text-text-primary">idx_properties_public_city_price</code> and PostgreSQL <code className="text-text-primary">pg_trgm</code> trigrams for fast property retrieval at 50,000+ scale.
          </p>
        </div>
      </div>
    </div>
  );
}

