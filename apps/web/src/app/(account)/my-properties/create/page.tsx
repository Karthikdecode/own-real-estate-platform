'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProperty } from '@/features/properties/services/property-management.service';

const CITIES = ['Bengaluru', 'Mumbai', 'Chennai', 'Pune', 'Hyderabad', 'Delhi'];

const AMENITY_OPTIONS = [
  'Lift / Elevator',
  'Reserved Parking',
  '24x7 Security & CCTV',
  'Power Backup',
  'Gym & Fitness',
  'Swimming Pool',
  'Clubhouse',
  '24x7 Water Supply',
  'Piped Gas',
  'Children Play Area',
];

const SAMPLE_PHOTO_PRESETS = [
  { label: 'Living Room', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Master Bedroom', url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Modular Kitchen', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Balcony View', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop&q=80' },
];

export default function CreatePropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Lift / Elevator',
    'Reserved Parking',
    '24x7 Security & CCTV',
    'Power Backup',
  ]);

  // Uploaded images state (max 4 images as requested)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    listingType: 'sale',
    propertyType: 'apartment',
    price: '',
    areaSqft: '',
    bedrooms: '2',
    bathrooms: '2',
    city: 'Bengaluru',
    locality: '',
    address: '',
    pincode: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleAmenity = (item: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item],
    );
  };

  // Client-side image compression for fast and resilient uploading
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            resolve(compressed);
            return;
          }
          resolve(event.target?.result as string);
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Image Upload Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 4 - uploadedImages.length;
    if (remainingSlots <= 0) {
      alert('You can upload a maximum of 4 photos.');
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToRead) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload valid image files (JPEG, PNG, WebP).');
        continue;
      }
      try {
        const compressedDataUrl = await compressImage(file);
        if (compressedDataUrl) {
          setUploadedImages((prev) => (prev.length < 4 ? [...prev, compressedDataUrl] : prev));
        }
      } catch {
        // Fallback to standard reader
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const result = uploadEvent.target?.result as string;
          if (result) {
            setUploadedImages((prev) => (prev.length < 4 ? [...prev, result] : prev));
          }
        };
        reader.readAsDataURL(file);
      }
    }

    e.target.value = '';
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    if (uploadedImages.length >= 4) {
      alert('Maximum 4 photos allowed.');
      return;
    }
    setUploadedImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddPresetPhoto = (url: string) => {
    if (uploadedImages.length >= 4) {
      alert('Maximum 4 photos allowed.');
      return;
    }
    if (!uploadedImages.includes(url)) {
      setUploadedImages((prev) => [...prev, url]);
    }
  };

  const formatPricePreview = (val: string) => {
    const num = Number.parseInt(val, 10);
    if (!num || Number.isNaN(num)) return '₹—';
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fullDescription =
        selectedAmenities.length > 0
          ? `${form.description.trim()}\n\nKey Amenities: ${selectedAmenities.join(', ')}`
          : form.description;

      const payload: any = {
        title: form.title,
        description: fullDescription,
        listingType: form.listingType,
        propertyType: form.propertyType,
        price: Number.parseInt(form.price, 10),
        areaSqft: Number.parseInt(form.areaSqft, 10),
        city: form.city,
        locality: form.locality,
        address: form.address,
        pincode: form.pincode,
        bedrooms: form.propertyType === 'plot' ? null : Number.parseInt(form.bedrooms, 10),
        bathrooms: form.propertyType === 'plot' ? null : Number.parseInt(form.bathrooms, 10),
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
      };

      const created = await createProperty(payload);
      router.push(`/properties/${created.slug}`);
      router.refresh();
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to create property. Please ensure all required fields are filled correctly and you are logged in.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
            Post a New Property
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            List your residential or commercial property with photos and live preview
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

      {/* 2-Column Responsive Layout: Form on Left, Live Side Preview & Photos on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Property Details Form (7 cols) */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 shadow-sm transition-colors text-text-primary"
          >
            {/* Listing Purpose & Property Type */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                  Listing Purpose
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 text-xs sm:text-sm font-bold transition ${
                      form.listingType === 'sale'
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary dark:text-brand-accent'
                        : 'border-border-subtle text-text-secondary hover:bg-surface-secondary'
                    }`}
                  >
                    <input
                      type="radio"
                      name="listingType"
                      value="sale"
                      checked={form.listingType === 'sale'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    For Sale
                  </label>
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 text-xs sm:text-sm font-bold transition ${
                      form.listingType === 'rent'
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary dark:text-brand-accent'
                        : 'border-border-subtle text-text-secondary hover:bg-surface-secondary'
                    }`}
                  >
                    <input
                      type="radio"
                      name="listingType"
                      value="rent"
                      checked={form.listingType === 'rent'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    For Rent
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor="prop-type"
                  className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2"
                >
                  Property Type
                </label>
                <select
                  id="prop-type"
                  name="propertyType"
                  value={form.propertyType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary focus:border-brand-primary outline-none transition"
                >
                  <option value="apartment">Apartment / Flat</option>
                  <option value="independent_house">Independent House</option>
                  <option value="villa">Luxury Villa</option>
                  <option value="plot">Plot / Land</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="prop-title"
                  className="block text-xs font-bold uppercase tracking-wider text-text-muted"
                >
                  Property Title
                </label>
                <span className="text-[11px] text-text-muted">Min 10 characters</span>
              </div>
              <input
                id="prop-title"
                type="text"
                name="title"
                required
                minLength={10}
                maxLength={150}
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Spacious 3 BHK Sea-View Apartment with Balcony"
                className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
              />
            </div>

            {/* Price & Area */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="prop-price"
                  className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1"
                >
                  {form.listingType === 'sale' ? 'Expected Price (₹ INR)' : 'Monthly Rent (₹ INR)'}
                </label>
                <input
                  id="prop-price"
                  type="number"
                  name="price"
                  required
                  min={1000}
                  value={form.price}
                  onChange={handleChange}
                  placeholder={form.listingType === 'sale' ? 'e.g. 8500000' : 'e.g. 35000'}
                  className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
                />
              </div>

              <div>
                <label
                  htmlFor="prop-area"
                  className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1"
                >
                  Super Built-up Area (SQ.FT)
                </label>
                <input
                  id="prop-area"
                  type="number"
                  name="areaSqft"
                  required
                  min={100}
                  value={form.areaSqft}
                  onChange={handleChange}
                  placeholder="e.g. 1450"
                  className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
                />
              </div>
            </div>

            {/* Bedrooms & Bathrooms */}
            {form.propertyType !== 'plot' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="prop-bedrooms"
                    className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1"
                  >
                    Bedrooms (BHK)
                  </label>
                  <select
                    id="prop-bedrooms"
                    name="bedrooms"
                    value={form.bedrooms}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary focus:border-brand-primary outline-none transition"
                  >
                    <option value="1">1 BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                    <option value="5">5+ BHK</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="prop-bathrooms"
                    className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1"
                  >
                    Bathrooms
                  </label>
                  <select
                    id="prop-bathrooms"
                    name="bathrooms"
                    value={form.bathrooms}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary focus:border-brand-primary outline-none transition"
                  >
                    <option value="1">1 Bathroom</option>
                    <option value="2">2 Bathrooms</option>
                    <option value="3">3 Bathrooms</option>
                    <option value="4">4+ Bathrooms</option>
                  </select>
                </div>
              </div>
            )}

            {/* Location Details */}
            <div className="border-t border-border-subtle pt-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                Location Details
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="prop-city"
                    className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1"
                  >
                    City
                  </label>
                  <select
                    id="prop-city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary focus:border-brand-primary outline-none transition"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="prop-locality"
                    className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1"
                  >
                    Locality / Area
                  </label>
                  <input
                    id="prop-locality"
                    type="text"
                    name="locality"
                    required
                    value={form.locality}
                    onChange={handleChange}
                    placeholder="e.g. Indiranagar"
                    className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prop-pincode"
                    className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1"
                  >
                    PIN Code
                  </label>
                  <input
                    id="prop-pincode"
                    type="text"
                    name="pincode"
                    required
                    pattern="^[1-9][0-9]{5}$"
                    maxLength={6}
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="560038"
                    className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="prop-address"
                  className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1"
                >
                  Complete Street Address
                </label>
                <input
                  id="prop-address"
                  type="text"
                  name="address"
                  required
                  minLength={5}
                  value={form.address}
                  onChange={handleChange}
                  placeholder="e.g. Tower 3, Flat 1202, Prestige Palms, 100ft Road"
                  className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
                />
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div className="border-t border-border-subtle pt-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Select Amenities & Features
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {AMENITY_OPTIONS.map((item) => {
                  const checked = selectedAmenities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAmenity(item)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-semibold text-left transition ${
                        checked
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary dark:text-brand-accent'
                          : 'border-border-subtle bg-surface-secondary text-text-secondary hover:border-border-strong'
                      }`}
                    >
                      <span
                        className={`flex size-4 items-center justify-center rounded-md border text-[10px] ${
                          checked
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'border-border-strong'
                        }`}
                      >
                        {checked ? '✓' : ''}
                      </span>
                      <span className="truncate">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-border-subtle pt-6">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="prop-desc"
                  className="block text-xs font-bold uppercase tracking-wider text-text-muted"
                >
                  Property Description
                </label>
                <span className="text-[11px] text-text-muted">Min 30 characters</span>
              </div>
              <textarea
                id="prop-desc"
                name="description"
                required
                minLength={30}
                maxLength={5000}
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Describe key features, furnishing status, facing, ventilation and proximity to metro/schools/hospitals... (Minimum 30 characters)"
                className="w-full rounded-xl border border-border-subtle bg-surface p-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-primary py-3.5 text-sm font-bold text-white shadow-md hover:bg-brand-primary-hover disabled:opacity-50 transition"
            >
              {loading ? 'Publishing Property...' : 'Publish Property Listing'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Photo Upload & Live Card Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* ── PHOTO UPLOAD SECTION (UP TO 4 PHOTOS) ── */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm transition-colors text-text-primary space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-1.5">
                  <span>📸</span>
                  <span>Upload Home Photos</span>
                </h3>
                <p className="text-[11px] text-text-muted">Upload up to 4 high-quality photographs</p>
              </div>
              <span className="rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-bold text-brand-primary dark:text-brand-accent">
                {uploadedImages.length} / 4 Photos
              </span>
            </div>

            {/* Upload Action Zone */}
            {uploadedImages.length < 4 ? (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-primary/40 bg-brand-primary/5 p-6 cursor-pointer hover:bg-brand-primary/10 transition group">
                  <div className="flex size-11 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary dark:text-brand-accent group-hover:scale-110 transition">
                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="mt-2 text-xs font-bold text-brand-primary dark:text-brand-accent">
                    Click to browse or drop images
                  </span>
                  <span className="text-[10px] text-text-muted mt-0.5">PNG, JPG, WebP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    multiple
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                {/* Quick Presets for Instant One-Click Adding */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Quick Sample Room Photos:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_PHOTO_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleAddPresetPhoto(preset.url)}
                        className="rounded-lg border border-border-subtle bg-surface-secondary px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-brand-primary hover:text-brand-primary transition"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Or Paste Image URL */}
                <form onSubmit={handleAddUrl} className="flex gap-1.5 pt-1">
                  <input
                    type="url"
                    placeholder="Or paste photo URL..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 rounded-xl border border-border-subtle bg-surface px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-primary"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-surface-secondary border border-border-subtle px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-secondary/80"
                  >
                    Add
                  </button>
                </form>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ✓ Maximum 4 photos uploaded. Remove any to replace.
              </div>
            )}

            {/* 4 Photo Thumbnail Slots Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[0, 1, 2, 3].map((slotIdx) => {
                const img = uploadedImages[slotIdx];
                return (
                  <div
                    key={slotIdx}
                    className="relative aspect-video rounded-xl border border-border-subtle bg-surface-secondary overflow-hidden flex items-center justify-center group"
                  >
                    {img ? (
                      <>
                        <img
                          src={img}
                          alt={`Uploaded photo ${slotIdx + 1}`}
                          className="size-full object-cover"
                        />
                        {slotIdx === 0 && (
                          <span className="absolute top-1.5 left-1.5 rounded-md bg-brand-primary px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white shadow-xs">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(slotIdx)}
                          title="Remove photo"
                          className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/70 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2 text-text-muted">
                        <span className="text-lg block">📷</span>
                        <span className="text-[10px] font-semibold">Slot {slotIdx + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── LIVE PROPERTY CARD PREVIEW ── */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm transition-colors text-text-primary space-y-3">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                Live Listing Card Preview
              </span>
              <span className="text-[10px] font-semibold text-text-muted">As seen by buyers</span>
            </div>

            {/* Card Simulation */}
            <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-secondary/40 shadow-xs">
              <div className="relative aspect-16/10 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                {uploadedImages[0] ? (
                  <img
                    src={uploadedImages[0]}
                    alt="Preview cover"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center text-text-muted">
                    <span className="text-3xl mb-1">🏡</span>
                    <span className="text-xs font-semibold">Upload photo to preview</span>
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                  <span className="rounded-md bg-brand-primary px-2 py-0.5 text-[10px] font-extrabold uppercase text-white shadow">
                    For {form.listingType}
                  </span>
                  <span className="rounded-md bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-bold text-white capitalize">
                    {form.propertyType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <p className="text-xs text-text-muted">
                  {form.locality || 'Locality'}, {form.city}
                </p>
                <h4 className="text-sm font-bold text-text-primary truncate">
                  {form.title || 'Your Property Title Will Appear Here'}
                </h4>
                <div className="flex items-baseline justify-between pt-1 border-t border-border-subtle">
                  <p className="text-base font-black text-brand-primary dark:text-brand-accent">
                    {formatPricePreview(form.price)}
                    {form.listingType === 'rent' && <span className="text-xs font-normal text-text-muted">/mo</span>}
                  </p>
                  <p className="text-xs font-semibold text-text-muted">
                    {form.bedrooms} BHK • {form.areaSqft || '0'} sq.ft
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
