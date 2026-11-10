'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/features/auth/services/auth.service';

interface CountryCodeOption {
  code: string;
  country: string;
  flag: string;
  digits: number;
  placeholder: string;
}

const DEFAULT_COUNTRY: CountryCodeOption = {
  code: '+91',
  country: 'India',
  flag: '🇮🇳',
  digits: 10,
  placeholder: '9876543210',
};

const COUNTRY_CODES: CountryCodeOption[] = [
  DEFAULT_COUNTRY,
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸', digits: 10, placeholder: '4155552671' },
  { code: '+44', country: 'UK', flag: '🇬🇧', digits: 10, placeholder: '7911123456' },
  { code: '+971', country: 'UAE', flag: '🇦🇪', digits: 9, placeholder: '501234567' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', digits: 8, placeholder: '81234567' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', digits: 9, placeholder: '412345678' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', digits: 10, placeholder: '15123456789' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', digits: 9, placeholder: '123456789' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', digits: 9, placeholder: '501234567' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦', digits: 8, placeholder: '33123456' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼', digits: 8, placeholder: '51234567' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentCountry: CountryCodeOption =
    COUNTRY_CODES.find((c) => c.code === countryCode) ?? DEFAULT_COUNTRY;
  const isPhoneValid = !phoneDigits || phoneDigits.length === currentCountry.digits;
  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation checks
    if (fullName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    if (phoneDigits && phoneDigits.length !== currentCountry.digits) {
      setError(`Mobile number must be exactly ${currentCountry.digits} digits for ${currentCountry.country}.`);
      return;
    }

    setLoading(true);

    try {
      const fullMobile = phoneDigits ? `${countryCode}${phoneDigits}` : undefined;

      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        mobileNumber: fullMobile,
      });

      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect');

      if (redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
        router.push(redirectUrl);
      } else {
        router.push('/my-properties');
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm transition-colors text-text-primary">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Create an Account</h1>
        <p className="mt-1 text-xs sm:text-sm text-text-muted">
          List your properties directly with zero brokerage
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="reg-name"
            className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5"
          >
            Full Name
          </label>
          <input
            id="reg-name"
            type="text"
            required
            minLength={2}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Karthik P"
            className="w-full rounded-xl border border-border-subtle bg-surface p-2.5 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
          />
        </div>

        {/* Email Address */}
        <div>
          <label
            htmlFor="reg-email"
            className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5"
          >
            Email Address
          </label>
          <input
            id="reg-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="raj@gmail.com"
            className="w-full rounded-xl border border-border-subtle bg-surface p-2.5 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
          />
        </div>

        {/* Mobile Number with Country Code Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="reg-mobile"
              className="block text-xs font-bold uppercase tracking-wider text-text-muted"
            >
              Mobile Number (Optional)
            </label>
            <span className="text-[11px] text-text-muted">
              {currentCountry.country} ({currentCountry.digits} digits)
            </span>
          </div>

          <div className="flex rounded-xl border border-border-subtle bg-surface focus-within:border-brand-primary overflow-hidden transition">
            {/* Country Code Select Box */}
            <select
              value={countryCode}
              onChange={(e) => {
                setCountryCode(e.target.value);
                setPhoneDigits('');
              }}
              aria-label="Country Calling Code"
              className="bg-surface-secondary px-3 py-2.5 text-xs sm:text-sm font-bold text-text-primary border-r border-border-subtle outline-none cursor-pointer hover:bg-surface-secondary/80 transition"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({c.country})
                </option>
              ))}
            </select>

            {/* Mobile Digits Only Input */}
            <input
              id="reg-mobile"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={currentCountry.digits}
              value={phoneDigits}
              onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ''))}
              placeholder={currentCountry.placeholder}
              className="flex-1 bg-surface px-3 py-2.5 text-xs sm:text-sm text-text-primary placeholder:text-text-muted outline-none transition"
            />
          </div>

          {/* Real-time Phone Validation Hint */}
          {phoneDigits && (
            <p
              className={`mt-1 text-[11px] font-medium ${
                isPhoneValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {isPhoneValid
                ? `✓ Valid ${currentCountry.digits}-digit mobile number`
                : `Enter all ${currentCountry.digits} digits (${phoneDigits.length}/${currentCountry.digits})`}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="reg-password"
            className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5"
          >
            Password (Min 8 chars)
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border-subtle bg-surface p-2.5 pr-14 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted hover:text-text-primary"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="reg-confirm-password"
            className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border-subtle bg-surface p-2.5 pr-14 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted hover:text-text-primary"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Real-time Confirm Password Matching Feedback */}
          {confirmPassword && (
            <p
              className={`mt-1 text-[11px] font-semibold ${
                passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
              }`}
            >
              {passwordsMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || (Boolean(confirmPassword) && !passwordsMatch) || !isPhoneValid}
          className="w-full rounded-xl bg-brand-primary py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-brand-primary-hover disabled:opacity-50 transition"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-xs sm:text-sm text-text-secondary">
        Already have an account?{' '}
        <Link
          href={
            typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('redirect')
              ? `/login?redirect=${encodeURIComponent(new URLSearchParams(window.location.search).get('redirect')!)}`
              : '/login'
          }
          className="font-bold text-brand-primary dark:text-brand-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
