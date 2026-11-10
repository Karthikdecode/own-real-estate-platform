'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/features/auth/services/auth.service';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const session = await login({ email, password });
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect');

      if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
        router.push(redirectUrl);
      } else if (session.user.role === 'admin') {
        router.push('/admin');
      } else if (session.user.role === 'moderator') {
        router.push('/moderator');
      } else {
        router.push('/account');
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-2xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome Back</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sign in to manage your listings and received inquiries
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@realestate.com"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-brand-600 outline-none"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-brand-600 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-800 disabled:opacity-50 transition"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Quick Demo Credentials Autofill */}
      <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-center text-xs text-slate-500 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Quick 1-Click Demo Login:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => handleDemoFill('owner@realestate.com')}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-[11px] font-semibold text-brand-700 dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            🏠 Owner
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('buyer@realestate.com')}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-[11px] font-semibold text-brand-700 dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            🔍 Buyer
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('moderator@realestate.com')}
            className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2 py-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition"
          >
            ⚖️ Moderator
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('admin@realestate.com')}
            className="rounded-lg border border-brand-primary/40 bg-brand-primary/10 px-2 py-1.5 text-[11px] font-bold text-brand-primary dark:text-brand-accent hover:bg-brand-primary/20 transition"
          >
            🛡️ Admin
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link
          href={
            typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('redirect')
              ? `/register?redirect=${encodeURIComponent(new URLSearchParams(window.location.search).get('redirect')!)}`
              : '/register'
          }
          className="font-semibold text-brand-700 dark:text-teal-400 hover:underline"
        >
          Register now
        </Link>
      </p>
    </div>
  );
}
