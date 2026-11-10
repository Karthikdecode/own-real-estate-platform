'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/features/auth/services/auth.service';
import type { AuthUser } from '@real-estate/contracts';
import { ThemeToggle } from '@/components/common/theme-toggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAdmin() {
      try {
        const u = await getCurrentUser();
        if (!isMounted) return;
        if (u.role !== 'admin') {
          router.replace('/my-properties');
          return;
        }
        setUser(u);
      } catch {
        if (isMounted) {
          router.replace('/login');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAdmin();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          <p className="text-sm font-medium text-text-muted">Authenticating Admin Session…</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const navItems = [
    {
      name: 'Overview Dashboard',
      href: '/admin',
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: 'Property Moderation',
      href: '/admin/properties',
      icon: (
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-surface-secondary text-text-primary">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-border-subtle bg-surface transition-colors">
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border-subtle">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary text-white shadow-xs font-black">
            🛡️
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-text-primary">Estate Admin</h1>
            <p className="text-[10px] uppercase font-bold text-brand-primary tracking-wider">Moderation Portal</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 pt-4 border-t border-border-subtle">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Public Marketplace</span>
            </Link>

            <div className="rounded-xl border border-border-subtle bg-surface-secondary p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-text-primary">{user.fullName}</p>
                  <p className="truncate text-[10px] text-text-muted">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-error/20 bg-error/10 py-1.5 text-xs font-semibold text-error hover:bg-error/20 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-subtle bg-surface/95 px-4 sm:px-6 lg:px-8 backdrop-blur transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden inline-flex size-9 items-center justify-center rounded-xl border border-border-subtle bg-surface text-text-primary hover:bg-surface-secondary"
              aria-label="Open sidebar"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-bold text-brand-primary dark:text-brand-accent">
              <span className="size-1.5 rounded-full bg-brand-primary animate-pulse" />
              Admin Mode
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              Marketplace ↗
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-surface p-4 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛡️</span>
                  <span className="font-extrabold text-sm text-text-primary">Admin Portal</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="size-8 rounded-lg text-text-muted hover:bg-surface-secondary flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <nav className="mt-4 space-y-1.5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                      pathname === item.href
                        ? 'bg-brand-primary text-white'
                        : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-border-subtle space-y-2">
              <Link
                href="/"
                onClick={() => setMobileSidebarOpen(false)}
                className="block text-center text-xs text-text-secondary py-2 rounded-lg bg-surface-secondary"
              >
                Marketplace View
              </Link>
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full text-center text-xs text-error font-semibold py-2 rounded-lg bg-error/10"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

