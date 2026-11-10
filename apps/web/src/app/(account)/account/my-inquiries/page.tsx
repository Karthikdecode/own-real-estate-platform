'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ReceivedInquiry } from '@real-estate/contracts';
import { getSentInquiries } from '@/features/inquiries/services/inquiries.service';
import { formatDate } from '@/lib/utils/format';

export default function SentInquiriesPage() {
  const [inquiries, setInquiries] = useState<ReceivedInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await getSentInquiries({ limit: 50 });
        setInquiries(res.items);
      } catch (err: any) {
        setError(err?.message || 'Failed to load your sent inquiries.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 dark:bg-teal-950/60 px-3 py-1 text-xs font-bold text-teal-800 dark:text-teal-300 mb-1 border border-teal-200 dark:border-teal-900/40">
          <span>📤</span> Buyer / Tenant Outbox
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sent Inquiries</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Messages and visit requests you sent to property owners
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-12 text-center text-sm text-slate-500 dark:text-slate-400 shadow-2xs">
          <div className="inline-block size-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent mb-3" />
          <p>Loading your sent inquiries...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-6 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-12 text-center shadow-2xs">
          <span className="text-3xl mb-2 block">📬</span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">No Sent Inquiries</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            When you contact an owner from any property details page, your inquiry thread and status will appear here.
          </p>
          <Link
            href="/properties"
            className="mt-4 inline-block rounded-xl bg-teal-700 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 transition"
          >
            Explore Properties to Inquire
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-2xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <Link
                    href={`/properties/${inq.property.slug}`}
                    className="text-base font-bold text-slate-900 dark:text-white hover:text-teal-600 transition"
                  >
                    {inq.property.title} →
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sent on {formatDate(inq.createdAt)}
                  </p>
                </div>
                <span
                  className={`self-start sm:self-auto rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    inq.status === 'contacted'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : inq.status === 'closed'
                        ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  Status: {inq.status}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px] uppercase mb-1">
                  Your Message to Owner:
                </span>
                &ldquo;{inq.message}&rdquo;
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

