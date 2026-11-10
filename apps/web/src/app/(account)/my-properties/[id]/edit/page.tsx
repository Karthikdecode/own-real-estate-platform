'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PropertyDetail } from '@real-estate/contracts';
import {
  getMyListing,
  updateProperty,
  updatePropertyStatus,
} from '@/features/properties/services/property-management.service';

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPropertyPage({ params }: EditPropertyPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    status: 'published',
  });

  useEffect(() => {
    getMyListing(id)
      .then((data) => {
        setProperty(data);
        setForm({
          title: data.title,
          description: data.description,
          price: String(data.price),
          status: data.status,
        });
      })
      .catch((err) => {
        setError(err?.message || 'Could not load property details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateProperty(id, {
        title: form.title,
        description: form.description,
        price: Number.parseInt(form.price, 10),
      });

      if (property && form.status !== property.status && form.status !== 'draft') {
        await updatePropertyStatus(id, { status: form.status as any });
      }

      setSuccess('Property updated successfully!');
      setTimeout(() => {
        router.push('/my-properties');
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update property.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-text-muted">
        <div className="inline-block size-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent mb-2" />
        <p>Loading property details...</p>
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-600 dark:text-red-400">
        <p>{error}</p>
        <Link
          href="/my-properties"
          className="mt-4 inline-block font-semibold text-brand-primary dark:text-brand-accent hover:underline"
        >
          ← Back to my listings
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
            Edit Property Listing
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Update pricing, description and active status for your listing
          </p>
        </div>
        <Link
          href="/my-properties"
          className="text-xs sm:text-sm font-semibold text-brand-primary dark:text-brand-accent hover:underline"
        >
          ← Back to listings
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs sm:text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm transition-colors text-text-primary"
      >
        <div>
          <label
            htmlFor="edit-title"
            className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5"
          >
            Property Title
          </label>
          <input
            id="edit-title"
            type="text"
            required
            minLength={5}
            maxLength={150}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="edit-price"
              className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5"
            >
              Price (₹ INR)
            </label>
            <input
              id="edit-price"
              type="number"
              required
              min={1000}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="edit-status"
              className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5"
            >
              Listing Status
            </label>
            <select
              id="edit-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-xl border border-border-subtle bg-surface-secondary p-3 text-xs sm:text-sm font-semibold text-text-primary focus:border-brand-primary outline-none transition"
            >
              <option value="published">Published (Visible publicly)</option>
              <option value="archived">Archived (Hidden from search)</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="edit-desc"
            className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5"
          >
            Description
          </label>
          <textarea
            id="edit-desc"
            required
            minLength={10}
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/my-properties"
            className="rounded-xl border border-border-subtle px-5 py-2.5 text-xs sm:text-sm font-semibold text-text-secondary hover:bg-surface-secondary transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-primary px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-brand-primary-hover disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
