'use client';

import { useState } from 'react';
import { createInquiry } from '@/features/inquiries/services/inquiries.service';

interface InquiryFormProps {
  propertyId: string;
  propertyTitle: string;
}

export function InquiryForm({ propertyId, propertyTitle }: InquiryFormProps) {
  const [message, setMessage] = useState(
    `Hi, I am interested in your property "${propertyTitle}". Please share more details and let me know when we can arrange a site visit.`,
  );
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      await createInquiry(propertyId, { message });
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(
        err?.message ||
          'Failed to send inquiry. Please ensure you are logged in and have not already sent an active inquiry.',
      );
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-6 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 className="mt-3 text-base font-bold text-emerald-900 dark:text-emerald-200">
          Inquiry Sent Successfully!
        </h4>
        <p className="mt-1.5 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
          The property owner has received your contact request and will connect with you directly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm transition-colors text-text-primary"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-text-primary">Contact Property Owner</h3>
        <span className="rounded-full bg-brand-primary/10 text-brand-primary dark:text-brand-accent px-2 py-0.5 text-[10px] font-bold uppercase">
          0% Brokerage
        </span>
      </div>
      <p className="mt-1 text-xs text-text-muted">
        Connect directly with the verified owner. No intermediary or agent charges.
      </p>

      {status === 'error' && (
        <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 border border-red-500/20">
          {errorMessage}
        </div>
      )}

      <div className="mt-4">
        <label
          htmlFor="inquiry-message"
          className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5"
        >
          Your Message
        </label>
        <textarea
          id="inquiry-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={1000}
          className="w-full rounded-xl border border-border-subtle bg-surface-secondary p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition"
        />
        <p className="mt-1 text-right text-[11px] text-text-muted">{message.length}/1000</p>
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-3 w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-white shadow-md hover:bg-brand-primary-hover disabled:opacity-50 transition"
      >
        {status === 'submitting' ? 'Sending Inquiry...' : 'Send Inquiry to Owner'}
      </button>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted">
        <svg
          className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <span>Anti-spam protected. Duplicate submissions blocked.</span>
      </div>
    </form>
  );
}
