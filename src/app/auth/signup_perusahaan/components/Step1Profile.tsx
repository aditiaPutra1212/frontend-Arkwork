// frontend/src/app/auth/signup_perusahaan/components/Step1Profile.tsx
'use client';

import { useRef } from 'react';
import Card from './Card';
import { CompanyProfile } from '../types';

export default function Step1Profile({
  profile, setProfile, error, onNext,
}: {
  profile: CompanyProfile;
  setProfile: (updater: (p: CompanyProfile) => CompanyProfile) => void;
  error: string | null;
  onNext: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card>
      <div className="flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-blue-50 ring-1 ring-blue-100 mb-3 flex items-center justify-center">
          <span className="text-blue-600 text-lg font-bold">AW</span>
        </div>
        <h2 className="text-2xl font-semibold text-slate-900">Lengkapi Profil Perusahaan</h2>
        <p className="mt-1 text-sm text-slate-600">Profil yang jelas meningkatkan ketertarikan kandidat.</p>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-5">
        {/* Logo */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Logo</label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {profile.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logo} alt="Logo preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400 text-xs">
                  No logo
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setProfile((p) => ({ ...p, logo: String(ev.target?.result || '') }));
                  reader.readAsDataURL(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Pilih Foto
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">.jpg/.png, 1000×1000px disarankan, maks 2MB.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Nama Perusahaan</span>
            <input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. ArkWork Indonesia, Inc."
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Email Perusahaan</span>
            <input
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              type="email"
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="hr@company.com"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-600">Tentang perusahaan</span>
          <textarea
            value={profile.about}
            onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))}
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="Visi, misi, budaya kerja, dsb."
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-600">Alamat kantor</span>
            <textarea
              value={profile.address}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Jalan, nomor, dll."
            />
          </label>
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-1 block text-sm text-slate-600">Kota / Kabupaten</span>
              <input
                value={profile.city}
                onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Jakarta Selatan"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-600">Website (opsional)</span>
              <input
                value={profile.website}
                onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="company.com"
              />
            </label>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-700">Website & Sosial</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {['website','linkedin','instagram','facebook','tiktok','youtube'].map((key) => (
              <input
                key={key}
                value={(profile.socials as any)[key] || ''}
                onChange={(e) => setProfile((p) => ({ ...p, socials: { ...p.socials, [key]: e.target.value } }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder={key[0].toUpperCase() + key.slice(1)}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </Card>
  );
}
