'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AuthUser } from '@real-estate/contracts';
import { getCurrentUser, logout } from '@/features/auth/services/auth.service';

export default function ModeratorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const u = await getCurrentUser();
        if (u.role !== 'moderator' && u.role !== 'admin') {
          router.replace('/account');
          return;
        }
        setUser(u);
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="inline-block size-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* ── TOP MODERATION HEADER ────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-amber-200 dark:border-amber-900/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                Quality Moderation Queue
              </span>
              <span className="rounded bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                {user?.role === 'admin' ? 'Super Admin' : 'Listing Moderator'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Review and moderate marketplace property listings for quality and compliance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/properties"
            className="hidden sm:inline-block rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Public Site
          </Link>
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {user?.fullName}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── CONTENT BODY ────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}

