'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getAdminProperties,
  getAdminPropertyById,
  moderateProperty,
  type AdminPropertyDetail,
} from '@/features/admin/services/admin.service';
import type {
  AdminPropertiesQuery,
  AdminPropertyItem,
  ModeratePropertyAction,
} from '@real-estate/contracts';

const CITIES = ['All Cities', 'Bengaluru', 'Mumbai', 'Chennai', 'Pune', 'Hyderabad', 'Delhi'];

export default function AdminPropertiesPage() {
  const searchParams = useSearchParams();
  const initialReviewId = searchParams.get('reviewId');

  const [properties, setProperties] = useState<AdminPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'published' | 'unpublished'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [searchQuery, setSearchQuery] = useState('');

  // Moderation Dialog State
  const [activePropertyId, setActivePropertyId] = useState<string | null>(initialReviewId);
  const [propertyDetail, setPropertyDetail] = useState<AdminPropertyDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [moderateAction, setModerateAction] = useState<ModeratePropertyAction>('approve');
  const [remarks, setRemarks] = useState('');
  const [submittingModeration, setSubmittingModeration] = useState(false);
  const [moderationMessage, setModerationMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const query: Partial<AdminPropertiesQuery> = {
        status: selectedStatus,
        limit: 50,
      };
      if (selectedCity !== 'All Cities') {
        query.city = selectedCity;
      }
      if (searchQuery.trim()) {
        query.q = searchQuery.trim();
      }

      const res = await getAdminProperties(query);
      setProperties(res.items);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [selectedStatus, selectedCity]);

  // Handle direct review modal opening from URL or table click
  useEffect(() => {
    if (!activePropertyId) {
      setPropertyDetail(null);
      return;
    }

    let isMounted = true;
    setLoadingDetail(true);
    setModerationMessage(null);
    setRemarks('');

    getAdminPropertyById(activePropertyId)
      .then((detail) => {
        if (!isMounted) return;
        setPropertyDetail(detail);
        // Default action based on current status
        if (detail.status === 'draft') {
          setModerateAction('approve');
        } else if (detail.status === 'published') {
          setModerateAction('reject');
        } else {
          setModerateAction('approve');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setModerationMessage({ text: err?.message || 'Failed to fetch details.', type: 'error' });
      })
      .finally(() => {
        if (isMounted) setLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activePropertyId]);

  const handleModerationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePropertyId) return;

    setSubmittingModeration(true);
    setModerationMessage(null);

    try {
      const res = await moderateProperty(activePropertyId, {
        action: moderateAction,
        remarks: remarks.trim() || undefined,
      });

      setModerationMessage({ text: res.message, type: 'success' });

      // Refresh both the modal detail and the properties table
      const updatedDetail = await getAdminPropertyById(activePropertyId);
      setPropertyDetail(updatedDetail);
      fetchProperties();
    } catch (err: any) {
      setModerationMessage({ text: err?.message || 'Moderation action failed.', type: 'error' });
    } finally {
      setSubmittingModeration(false);
    }
  };

  const formatPrice = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case 'unpublished':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
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
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            Property Moderation Queue
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Inspect listing quality, review submitted photos, approve or request revisions with audit logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProperties}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface px-3.5 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition"
          >
            Refresh List
          </button>
        </div>
      </div>

      {/* ── FILTER CONTROLS ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All Listings' },
              { id: 'draft', label: 'Pending Review' },
              { id: 'published', label: 'Published' },
              { id: 'unpublished', label: 'Unpublished' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                selectedStatus === tab.id
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80 hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & City Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary outline-none focus:border-brand-primary"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchProperties();
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              placeholder="Search title or owner…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary w-40 sm:w-52"
            />
            <button
              type="submit"
              className="rounded-xl bg-surface-secondary border border-border-subtle px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-secondary/80"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600">
          {error}
        </div>
      )}

      {/* ── PROPERTIES TABLE ── */}
      <div className="rounded-2xl border border-border-subtle bg-surface shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-text-muted">Loading properties queue…</div>
        ) : properties.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-bold text-text-primary">No properties found</p>
            <p className="text-xs text-text-muted mt-1">No listings match the selected status and city filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary text-text-muted border-b border-border-subtle uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Property Details</th>
                  <th className="px-4 py-3.5 font-bold">Location</th>
                  <th className="px-4 py-3.5 font-bold">Price</th>
                  <th className="px-4 py-3.5 font-bold">Listing Type</th>
                  <th className="px-4 py-3.5 font-bold">Owner Contact</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 text-right font-bold">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-surface-secondary border border-border-subtle">
                          {p.primaryImageUrl ? (
                            <img
                              src={p.primaryImageUrl}
                              alt={p.title}
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-text-muted text-base">
                              🏠
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="truncate font-bold text-text-primary text-sm">{p.title}</p>
                          <p className="text-[11px] text-text-muted">
                            {p.bedrooms ? `${p.bedrooms} BHK • ` : ''}
                            {p.areaSqft} sq.ft • {p.propertyType.replace('_', ' ')}
                          </p>
                          <p className="text-[10px] text-text-muted truncate mt-0.5">{p.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-semibold text-text-primary">{p.locality}</p>
                      <p className="text-[10px] text-text-muted">{p.city} - {p.pincode}</p>
                    </td>
                    <td className="px-4 py-4 font-extrabold text-text-primary text-sm whitespace-nowrap">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                        For {p.listingType}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-semibold text-text-primary">{p.owner.fullName}</p>
                      <p className="text-[10px] text-text-muted">{p.owner.email}</p>
                      {p.owner.mobileNumber && (
                        <p className="text-[10px] text-brand-primary dark:text-brand-accent">{p.owner.mobileNumber}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(p.status)}</td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setActivePropertyId(p.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-primary-hover transition"
                      >
                        Review Listing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PROPERTY REVIEW & MODERATION MODAL ── */}
      {activePropertyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setActivePropertyId(null)}
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border-subtle pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                  Property Review & Audit
                </span>
                <h2 className="text-xl font-black text-text-primary">
                  {propertyDetail?.title || 'Loading Property…'}
                </h2>
              </div>
              <button
                onClick={() => setActivePropertyId(null)}
                className="size-8 rounded-full bg-surface-secondary text-text-muted hover:bg-border-subtle hover:text-text-primary flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-16 text-center">
                <div className="size-8 mx-auto animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
                <p className="text-xs text-text-muted mt-3">Loading property review details and audit logs…</p>
              </div>
            ) : propertyDetail ? (
              <div className="mt-6 space-y-6">
                {/* Image Gallery */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Submitted Photos ({propertyDetail.images.length})
                  </h3>
                  {propertyDetail.images.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-xs text-text-muted">
                      No photographs uploaded for this listing.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {propertyDetail.images.map((img) => (
                        <div
                          key={img.id}
                          className="relative aspect-video overflow-hidden rounded-xl border border-border-subtle bg-surface-secondary"
                        >
                          <img
                            src={img.url}
                            alt="Property photo"
                            className="size-full object-cover"
                            loading="lazy"
                          />
                          {img.isPrimary && (
                            <span className="absolute top-2 left-2 rounded-md bg-brand-primary px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                              Cover Photo
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Key Listing Attributes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-border-subtle bg-surface-secondary/50 p-4 text-xs">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">Price</span>
                    <span className="font-extrabold text-text-primary text-sm">
                      {formatPrice(propertyDetail.price)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">Configuration</span>
                    <span className="font-bold text-text-primary">
                      {propertyDetail.bedrooms ? `${propertyDetail.bedrooms} BHK` : 'N/A'} • {propertyDetail.areaSqft} sq.ft
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">Location</span>
                    <span className="font-bold text-text-primary">
                      {propertyDetail.locality}, {propertyDetail.city}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase">Current Status</span>
                    {getStatusBadge(propertyDetail.status)}
                  </div>
                </div>

                {/* Description & Address */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-text-muted block text-[10px] uppercase">Full Address</span>
                    <p className="text-text-primary">{propertyDetail.address}, {propertyDetail.pincode}</p>
                  </div>
                  <div>
                    <span className="font-bold text-text-muted block text-[10px] uppercase">Listing Description</span>
                    <p className="text-text-secondary leading-relaxed bg-surface-secondary/40 p-3 rounded-xl">
                      {propertyDetail.description}
                    </p>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="rounded-2xl border border-border-subtle bg-surface p-4 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-2">
                    Property Owner Credentials
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-text-primary">{propertyDetail.owner.fullName}</p>
                      <p className="text-text-muted">{propertyDetail.owner.email}</p>
                    </div>
                    {propertyDetail.owner.mobileNumber && (
                      <span className="font-semibold text-brand-primary dark:text-brand-accent">
                        📞 {propertyDetail.owner.mobileNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Audit Timeline */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                    Moderation History ({propertyDetail.history.length})
                  </h3>
                  {propertyDetail.history.length === 0 ? (
                    <p className="text-xs text-text-muted italic">No prior moderation actions recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {propertyDetail.history.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-start justify-between rounded-xl border border-border-subtle bg-surface-secondary/30 p-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-text-primary">{h.changedBy}</span>
                              <span className="text-[10px] text-text-muted">
                                changed status from <strong className="text-text-secondary">{h.oldStatus || 'none'}</strong> → <strong className="text-brand-primary">{h.newStatus}</strong>
                              </span>
                            </div>
                            {h.remarks && (
                              <p className="text-[11px] text-text-secondary mt-1">
                                &ldquo;{h.remarks}&rdquo;
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-text-muted whitespace-nowrap">
                            {new Date(h.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Moderation Form */}
                <form
                  onSubmit={handleModerationSubmit}
                  className="rounded-2xl border-2 border-brand-primary/30 bg-surface-secondary/30 p-5 space-y-4"
                >
                  <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                    <span>⚖️</span>
                    <span>Moderation Decision</span>
                  </h3>

                  {moderationMessage && (
                    <div
                      className={`rounded-xl p-3 text-xs font-semibold ${
                        moderationMessage.type === 'success'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {moderationMessage.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                        moderateAction === 'approve'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'border-border-subtle bg-surface text-text-secondary'
                      }`}
                    >
                      <input
                        type="radio"
                        name="moderateAction"
                        value="approve"
                        checked={moderateAction === 'approve'}
                        onChange={() => setModerateAction('approve')}
                        className="text-emerald-600"
                      />
                      <span className="text-xs">Approve & Publish</span>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                        moderateAction === 'reject'
                          ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold'
                          : 'border-border-subtle bg-surface text-text-secondary'
                      }`}
                    >
                      <input
                        type="radio"
                        name="moderateAction"
                        value="reject"
                        checked={moderateAction === 'reject'}
                        onChange={() => setModerateAction('reject')}
                        className="text-rose-600"
                      />
                      <span className="text-xs">Reject & Unpublish</span>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                        moderateAction === 'request_changes'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                          : 'border-border-subtle bg-surface text-text-secondary'
                      }`}
                    >
                      <input
                        type="radio"
                        name="moderateAction"
                        value="request_changes"
                        checked={moderateAction === 'request_changes'}
                        onChange={() => setModerateAction('request_changes')}
                        className="text-amber-600"
                      />
                      <span className="text-xs">Request Changes</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-text-muted mb-1">
                      Review Remarks / Justification (Logged to Audit Trail)
                    </label>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Approved after verifying property documents and high-resolution photographs."
                      className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs text-text-primary outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActivePropertyId(null)}
                      className="rounded-xl border border-border-subtle px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-secondary"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={submittingModeration}
                      className="rounded-xl bg-brand-primary px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-primary-hover disabled:opacity-50 transition"
                    >
                      {submittingModeration ? 'Submitting…' : 'Confirm Decision'}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

