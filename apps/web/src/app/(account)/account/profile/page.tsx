'use client';

import { useEffect, useState } from 'react';
import type { AuthUser } from '@real-estate/contracts';
import { getCurrentUser } from '@/features/auth/services/auth.service';

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const u = await getCurrentUser();
        setUser(u);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-12 text-center text-sm text-slate-500 dark:text-slate-400">
        <div className="inline-block size-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent mb-3" />
        <p>Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personal details and marketplace participant credentials
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-700 text-xl font-bold text-white shadow-xs">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.fullName}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            <span className="mt-1 inline-block rounded-md bg-teal-100 dark:bg-teal-950/60 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase">
              Role: {user?.role || 'user'} (Marketplace Participant)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">
              Account Identifier
            </span>
            <p className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              {user?.id}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">
              Registered Role
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              Standard User (Single account for Buyer, Tenant & Owner)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

