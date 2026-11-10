'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCurrentUser, logout, hasSession } from '@/features/auth/services/auth.service';
import type { AuthUser } from '@real-estate/contracts';
import { ThemeToggle } from '@/components/common/theme-toggle';

const NAV_LINKS = [
  { label: 'Buy', href: '/properties?listingType=sale' },
  { label: 'Rent', href: '/properties?listingType=rent' },
  { label: 'Plots & Land', href: '/properties?propertyType=plot' },
  { label: 'All Properties', href: '/properties' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function SiteNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      if (!hasSession()) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const u = await getCurrentUser();
        if (isMounted) setUser(u);
      } catch {
        if (isMounted) {
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('has_session');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUser();

    const handleAuthChange = () => {
      loadUser();
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setDropdownOpen(false);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Desktop Navigation Links */}
      <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
        {NAV_LINKS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-primary-light text-brand-primary font-semibold dark:bg-surface-secondary dark:text-brand-accent'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Action Controls: Theme Toggle + Post Property + Auth */}
      <div className="hidden items-center gap-2.5 sm:flex">
        {/* Theme Toggle (Sun/Moon) */}
        <ThemeToggle />

        {/* Post Property (Primary Owner Action) */}
        <Link
          href={user ? '/my-properties/create' : '/login?redirect=/my-properties/create'}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-brand-primary-hover transition"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Post Property
          <span className="rounded bg-black/20 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider">Free</span>
        </Link>

        {loading ? (
          <div className="size-8 rounded-full bg-surface-secondary animate-pulse" />
        ) : user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary transition"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
                {(user.fullName?.charAt(0) || user.email.charAt(0) || 'U').toUpperCase()}
              </div>
              <span className="max-w-[100px] truncate text-xs font-semibold">{user.fullName || user.email}</span>
              <svg className="size-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border-subtle bg-surface-elevated py-1.5 shadow-xl z-50">
                <div className="border-b border-border-subtle px-4 py-2.5">
                  <p className="text-sm font-bold text-text-primary">{user.fullName}</p>
                  <p className="text-xs text-text-muted truncate">{user.email}</p>
                  <span className="mt-1 inline-block rounded-md bg-brand-primary-light dark:bg-surface-secondary px-2 py-0.5 text-[10px] font-semibold text-brand-primary dark:text-brand-accent capitalize">
                    {user.role} Account
                  </span>
                </div>

                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-primary dark:text-brand-accent hover:bg-surface-secondary transition"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin Portal
                  </Link>
                )}

                {(user.role === 'moderator' || user.role === 'admin') && (
                  <Link
                    href="/moderator"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-surface-secondary transition"
                  >
                    <span>⚖️</span>
                    Moderator Queue
                  </Link>
                )}

                <Link
                  href="/account"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition font-medium"
                >
                  <span>📊</span>
                  Account Overview
                </Link>

                <Link
                  href="/my-properties"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition"
                >
                  <svg className="size-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  My Properties (Owner)
                </Link>

                <Link
                  href="/account/my-inquiries"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition"
                >
                  <span>📤</span>
                  Sent Inquiries (Buyer)
                </Link>

                <Link
                  href="/my-properties/inquiries"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition"
                >
                  <svg className="size-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Received Leads (Owner)
                </Link>

                <Link
                  href="/my-properties/create"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition"
                >
                  <svg className="size-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  List New Property
                </Link>

                <div className="border-t border-border-subtle my-1" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-error hover:bg-surface-secondary transition"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-border-subtle bg-surface px-3.5 py-2 text-xs sm:text-sm font-semibold text-text-primary hover:bg-surface-secondary transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-text-primary text-text-inverse px-3.5 py-2 text-xs sm:text-sm font-semibold shadow-xs hover:opacity-90 transition"
            >
              Register
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex items-center gap-2 sm:hidden">
        <ThemeToggle />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          className="inline-flex size-9 items-center justify-center rounded-xl border border-border-subtle bg-surface text-text-primary hover:bg-surface-secondary"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-b border-border-subtle bg-surface p-4 shadow-xl lg:hidden z-50">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-border-subtle pt-3 mt-2 flex flex-col gap-2">
              <Link
                href={user ? '/my-properties/create' : '/login?redirect=/my-properties/create'}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl bg-brand-primary px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Post Property Free
              </Link>
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl bg-brand-primary/10 border border-brand-primary/30 px-4 py-2 text-center text-sm font-bold text-brand-primary dark:text-brand-accent"
                    >
                      🛡️ Admin Portal
                    </Link>
                  )}
                  <Link
                    href="/my-properties"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-border-subtle px-4 py-2 text-center text-sm font-medium text-text-primary"
                  >
                    My Properties ({user.fullName})
                  </Link>
                  <Link
                    href="/my-properties/inquiries"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-border-subtle px-4 py-2 text-center text-sm font-medium text-text-primary"
                  >
                    Received Inquiries
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="rounded-xl border border-error/20 px-4 py-2 text-center text-sm font-medium text-error"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-border-subtle py-2 text-center text-sm font-semibold text-text-primary"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl bg-brand-primary py-2 text-center text-sm font-semibold text-white"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
