'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { InquiryStatus, ReceivedInquiry } from '@real-estate/contracts';
import {
  getReceivedInquiries,
  updateInquiryStatus,
} from '@/features/inquiries/services/inquiries.service';

export default function MyInquiriesPage() {
  const [inquiries, setInquiries] = useState<ReceivedInquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadInquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getReceivedInquiries({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 50,
      });
      setInquiries(data.items);
    } catch (err: any) {
      setError(
        err?.message ||
          'Please sign in to view your received leads. If you are not signed in, please log in first.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, [statusFilter]);

  const handleStatusChange = async (inquiryId: string, newStatus: 'contacted' | 'closed') => {
    setUpdatingId(inquiryId);
    try {
      const updated = await updateInquiryStatus(inquiryId, { status: newStatus });
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: updated.status } : inq)),
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update inquiry status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Buyer & Tenant Inquiries</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Direct buyer inquiries submitted on your listings with contact details
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:border-brand-600 outline-none"
          >
            <option value="all">All Inquiries</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-12 text-center text-sm text-slate-500 dark:text-slate-400 shadow-2xs">
          <div className="inline-block size-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent mb-3" />
          <p>Loading inquiries...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-6 text-center shadow-2xs">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{error}</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-xl bg-brand-700 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-800"
          >
            Sign In as Owner
          </Link>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center transition-colors">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
            <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No inquiries found</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {statusFilter === 'all'
              ? 'When buyers or tenants contact you from your listing pages, their inquiries will appear here.'
              : `You have no inquiries with status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => {
            const formattedDate = new Date(inq.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const statusColors: Record<string, string> = {
              new: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
              contacted: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
              closed: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
            };

            return (
              <div
                key={inq.id}
                className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-2xs transition hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{inq.sender.fullName}</h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          statusColors[inq.status] ?? 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Inquired regarding:{' '}
                      <Link
                        href={`/properties/${inq.property.slug}`}
                        className="font-semibold text-brand-700 dark:text-teal-400 hover:underline"
                      >
                        {inq.property.title}
                      </Link>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formattedDate}</span>
                  </div>
                </div>

                {/* Message body */}
                <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 text-sm text-slate-700 dark:text-slate-300">
                  <p className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-1">Message:</p>
                  <p className="whitespace-pre-line leading-relaxed">{inq.message}</p>
                </div>

                {/* Contact information & Status management actions */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${inq.sender.email}`} className="font-medium text-brand-700 dark:text-teal-400 hover:underline">
                        {inq.sender.email}
                      </a>
                    </div>
                    {inq.sender.mobileNumber && (
                      <div className="flex items-center gap-1.5">
                        <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${inq.sender.mobileNumber}`} className="font-medium text-slate-900 dark:text-white hover:underline">
                          {inq.sender.mobileNumber}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {inq.status !== 'contacted' && inq.status !== 'closed' && (
                      <button
                        onClick={() => handleStatusChange(inq.id, 'contacted')}
                        disabled={updatingId === inq.id}
                        className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 transition"
                      >
                        Mark as Contacted
                      </button>
                    )}
                    {inq.status !== 'closed' && (
                      <button
                        onClick={() => handleStatusChange(inq.id, 'closed')}
                        disabled={updatingId === inq.id}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition"
                      >
                        Close Lead
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
