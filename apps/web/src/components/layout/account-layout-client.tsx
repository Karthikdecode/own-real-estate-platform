'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AuthUser } from '@real-estate/contracts';
import { getCurrentUser, hasSession, login } from '@/features/auth/services/auth.service';
import { NavLink } from '@/components/layout/nav-link';
import { Container } from '@/components/ui/container';

const ACCOUNT_SECTIONS = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Overview', href: '/account', icon: '📊' },
      { label: 'My Profile', href: '/account/profile', icon: '👤' },
    ],
  },
  {
    title: 'Owner & Seller',
    items: [
      { label: 'My Properties', href: '/my-properties', icon: '🏠' },
      { label: 'Post New Property', href: '/my-properties/create', icon: '➕' },
      { label: 'Received Inquiries', href: '/my-properties/inquiries', icon: '📥' },
    ],
  },
  {
    title: 'Buyer & Tenant',
    items: [
      { label: 'Sent Inquiries', href: '/account/my-inquiries', icon: '📤' },
      { label: 'Saved Shortlists', href: '/account/shortlists', icon: '❤️' },
    ],
  },
];

const LINK_CLASS =
  'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition';

export function AccountLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoLoggingIn, setDemoLoggingIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
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
          localStorage.removeItem('has_session');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuth();

    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      isMounted = false;
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const handleQuickDemo = async (email: string) => {
    try {
      setDemoLoggingIn(true);
      await login({ email, password: 'Password123!' });
      const u = await getCurrentUser();
      setUser(u);
    } catch (err) {
      console.error('Quick demo login error:', err);
    } finally {
      setDemoLoggingIn(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <Container className="py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-border-subtle bg-surface p-12 text-center shadow-xs">
          <div className="inline-block size-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent mb-3" />
          <p className="text-xs sm:text-sm font-medium text-text-muted">Verifying account access...</p>
        </div>
      </Container>
    );
  }

  // 2. Unauthenticated Barrier: DO NOT show form or unified sidebar!
  if (!user) {
    const isCreatePage = pathname.includes('create');
    return (
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-border-subtle bg-surface p-8 sm:p-10 shadow-lg text-center transition-colors">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-primary/10 text-3xl mb-5">
            {isCreatePage ? '🏡' : '🔐'}
          </div>

          <span className="inline-block rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider mb-2">
            Sign In Required
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            {isCreatePage ? 'Sign In to Post Your Property' : 'Sign In to Access Your Dashboard'}
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
            You must be signed in to post property listings, view direct buyer inquiries, or manage your real estate portfolio.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="w-full sm:w-auto rounded-xl bg-brand-primary px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-brand-primary-hover transition text-center"
            >
              Sign In to Your Account
            </Link>
            <Link
              href={`/register?redirect=${encodeURIComponent(pathname)}`}
              className="w-full sm:w-auto rounded-xl border border-border-subtle bg-surface-secondary px-6 py-3 text-xs sm:text-sm font-bold text-text-primary hover:bg-surface-secondary/80 transition text-center"
            >
              Create Free Account
            </Link>
          </div>

          {/* 1-Click Quick Demo Login for instant testing */}
          <div className="mt-8 border-t border-border-subtle pt-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2.5">
              Or Try 1-Click Instant Demo Login:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={demoLoggingIn}
                onClick={() => handleQuickDemo('owner@realestate.com')}
                className="rounded-xl border border-brand-primary/30 bg-brand-primary/5 px-3 py-1.5 text-xs font-bold text-brand-primary dark:text-brand-accent hover:bg-brand-primary/10 transition disabled:opacity-50"
              >
                🏠 Login as Owner (Vikram)
              </button>
              <button
                type="button"
                disabled={demoLoggingIn}
                onClick={() => handleQuickDemo('buyer@realestate.com')}
                className="rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-secondary transition disabled:opacity-50"
              >
                🔍 Login as Buyer (Priya)
              </button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // 3. Authenticated: Render full Unified Portal layout with user details
  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-2xs transition-colors space-y-6">
            <div className="px-2 pb-2 border-b border-border-subtle">
              <span className="text-[10px] font-bold tracking-wider text-brand-primary dark:text-brand-accent uppercase">
                Unified Portal
              </span>
              <h2 className="text-base font-bold text-text-primary truncate">
                {user.fullName || 'User Account'}
              </h2>
              <p className="text-[11px] text-text-muted mt-0.5 truncate">
                {user.email}
              </p>
            </div>

            {ACCOUNT_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <p className="px-3 text-[10px] font-bold tracking-wider text-text-muted uppercase">
                  {section.title}
                </p>
                <nav aria-label={section.title} className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      exact
                      className={LINK_CLASS}
                      activeClassName="bg-brand-primary/10 text-brand-primary dark:text-brand-accent font-semibold"
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </Container>
  );
}

