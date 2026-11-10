'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AuthUser, OwnerPropertySummary, ReceivedInquiry } from '@real-estate/contracts';
import { getCurrentUser } from '@/features/auth/services/auth.service';
import { getReceivedInquiries, getSentInquiries } from '@/features/inquiries/services/inquiries.service';
import { getMyListings } from '@/features/properties/services/property-management.service';
import { formatPrice } from '@/lib/utils/format';

export default function AccountOverviewPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [myListings, setMyListings] = useState<OwnerPropertySummary[]>([]);
  const [receivedInquiries, setReceivedInquiries] = useState<ReceivedInquiry[]>([]);
  const [sentInquiries, setSentInquiries] = useState<ReceivedInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const u = await getCurrentUser();
        setUser(u);

        // Fetch owner listings & leads
        const [listingsRes, receivedRes, sentRes] = await Promise.allSettled([
          getMyListings({ limit: 5 }),
          getReceivedInquiries({ limit: 5 }),
          getSentInquiries({ limit: 5 }),
        ]);

        if (listingsRes.status === 'fulfilled') setMyListings(listingsRes.value.items);
        if (receivedRes.status === 'fulfilled') setReceivedInquiries(receivedRes.value.items);
        if (sentRes.status === 'fulfilled') setSentInquiries(sentRes.value.items);
      } catch (err) {
        console.error('Failed to load account dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-12 text-center text-sm text-slate-500 dark:text-slate-400">
        <div className="inline-block size-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent mb-3" />
        <p>Loading your unified account overview...</p>
      </div>
    );
  }

  const publishedCount = myListings.filter((p) => p.status === 'published').length;
  const draftCount = myListings.filter((p) => p.status === 'draft').length;

  return (
    <div className="space-y-8">
      {/* ── USER WELCOME BANNER ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50 via-emerald-50 to-white dark:border-teal-900/50 dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 dark:bg-teal-900/60 px-3 py-1 text-xs font-bold text-teal-800 dark:text-teal-300 mb-2">
              <span className="size-2 rounded-full bg-teal-500 animate-pulse" />
              Active Participant • Single Unified Account
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Hello, {user?.fullName || 'Property Explorer'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Signed in as <span className="font-semibold text-slate-900 dark:text-white">{user?.email}</span>. Manage both your property listings and search activities seamlessly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/my-properties/create"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
            >
              <span>+</span> Post Property
            </Link>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              🔍 Browse Homes
            </Link>
          </div>
        </div>
      </div>

      {/* ── METRIC STAT CARDS (OWNER + BUYER) ────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link
          href="/my-properties"
          className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-2xs hover:border-teal-500 transition"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">My Listings</p>
            <span className="text-lg">🏠</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{myListings.length}</p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {publishedCount} published • {draftCount} draft
          </p>
        </Link>

        <Link
          href="/my-properties/inquiries"
          className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-2xs hover:border-teal-500 transition"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Received Leads</p>
            <span className="text-lg">📥</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{receivedInquiries.length}</p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Buyer inquiries on your listings</p>
        </Link>

        <Link
          href="/account/my-inquiries"
          className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-2xs hover:border-teal-500 transition"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Sent Inquiries</p>
            <span className="text-lg">📤</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{sentInquiries.length}</p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Questions sent to owners</p>
        </Link>

        <Link
          href="/account/shortlists"
          className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-2xs hover:border-teal-500 transition"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Saved Shortlists</p>
            <span className="text-lg">❤️</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Active</p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Quick property shortlists</p>
        </Link>
      </div>

      {/* ── OWNER ACTIVITIES SECTION ─────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Your Property Listings (Owner)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Properties you posted for sale or rent</p>
          </div>
          <Link
            href="/my-properties"
            className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
          >
            View All ({myListings.length}) →
          </Link>
        </div>

        {myListings.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">You haven&apos;t posted any properties yet.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Post a home for sale or rent in 2 minutes with free direct buyer leads.</p>
            <Link
              href="/my-properties/create"
              className="mt-3 inline-block rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition"
            >
              Post a Property
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myListings.slice(0, 3).map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {item.primaryImageUrl ? (
                    <img
                      src={item.primaryImageUrl}
                      alt={item.title}
                      className="size-12 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      🏠
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.locality}, {item.city} • <span className="font-semibold text-teal-700 dark:text-teal-400">{formatPrice(item.price, item.listingType)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      item.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {item.status}
                  </span>
                  <Link
                    href={`/properties/${item.slug}`}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CUSTOMER ACTIVITIES SECTION ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sent Inquiries Box */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Sent Inquiries (Buyer/Tenant)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct inquiries you sent to owners</p>
            </div>
            <Link
              href="/account/my-inquiries"
              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
            >
              View All →
            </Link>
          </div>

          {sentInquiries.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              <p>You haven&apos;t contacted any property owners yet.</p>
              <Link
                href="/properties"
                className="mt-2 inline-block font-bold text-teal-700 dark:text-teal-400 hover:underline"
              >
                Explore properties and send an inquiry
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sentInquiries.slice(0, 3).map((inq) => (
                <div key={inq.id} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{inq.property.title}</p>
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase">
                      {inq.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 italic line-clamp-1">&ldquo;{inq.message}&rdquo;</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Shortlists Box */}
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Favorite Shortlists</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bookmarked homes for quick comparison</p>
            </div>
            <Link
              href="/account/shortlists"
              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
            >
              Manage →
            </Link>
          </div>

          <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <span className="text-2xl mb-2 block">❤️</span>
            <p>Save homes you like to review EMI, amenities, and owner contacts later.</p>
            <Link
              href="/properties"
              className="mt-2 inline-block font-bold text-teal-700 dark:text-teal-400 hover:underline"
            >
              Browse verified homes to shortlist
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

