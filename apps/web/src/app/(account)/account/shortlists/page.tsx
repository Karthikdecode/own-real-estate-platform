'use client';

import Link from 'next/link';

export default function ShortlistsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-950/60 px-3 py-1 text-xs font-bold text-rose-800 dark:text-rose-300 mb-1 border border-rose-200 dark:border-rose-900/40">
          <span>❤️</span> Buyer Shortlists
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Saved Properties</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your bookmarked apartments, houses, and plots
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-12 text-center shadow-2xs">
        <span className="text-4xl mb-3 block">🏡</span>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">No Shortlisted Properties Yet</h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Browse verified homes across Bengaluru, Mumbai, Chennai, Hyderabad, and Pune. Click the heart icon on any card to save it for easy access.
        </p>
        <Link
          href="/properties"
          className="mt-5 inline-block rounded-xl bg-teal-700 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 transition"
        >
          Explore Properties Now
        </Link>
      </div>
    </div>
  );
}

