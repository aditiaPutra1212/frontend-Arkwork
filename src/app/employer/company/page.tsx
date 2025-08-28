'use client';

import { useState } from 'react';
import Nav from '@/components/nav';
import Footer from '@/components/Footer';

export default function CompanyProfilePage() {
  const [form, setForm] = useState({
    name: 'PT Contoh Sejahtera',
    website: 'https://contoh.co.id',
    size: '51-200',
    about: 'Kami perusahaan teknologi fokus pada produk B2B...',
    address: 'Jakarta Selatan',
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert('Saved (demo only)');
  }

  return (
    <>
      <Nav />
      <main className="min-h-[60vh] bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="text-2xl font-semibold text-slate-900">Company Profile</h1>
          <p className="mb-6 text-sm text-slate-600">Perbarui informasi perusahaan Anda.</p>

          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Company Name</span>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Website</span>
                <input
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Company Size</span>
                <select
                  value={form.size}
                  onChange={(e) => set('size', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option>1-10</option>
                  <option>11-50</option>
                  <option>51-200</option>
                  <option>201-500</option>
                  <option>500+</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Address</span>
              <input
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">About</span>
              <textarea
                value={form.about}
                onChange={(e) => set('about', e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => history.back()}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
