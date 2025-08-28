// frontend/src/app/auth/signup_perusahaan/components/Step4Verify.tsx
'use client';

import Card from './Card';
import { CompanyProfile, NewJob, Package } from '../types';
import { formatIDR, normalizeUrl } from '../utils';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="col-span-1 text-slate-500">{label}</div>
      <div className="col-span-2 font-medium text-slate-800">{children}</div>
    </div>
  );
}

export default function Step4Verify({
  profile, pkg, job, error, busy, onBack, onFinish,
}: {
  profile: CompanyProfile;
  pkg: Package;
  job: NewJob;
  error: string | null;
  busy: boolean;
  onBack: () => void;
  onFinish: () => void;
}) {
  return (
    <Card>
      <h2 className="text-2xl font-semibold text-slate-900">Verifikasi & Ringkasan</h2>
      <p className="mt-1 text-sm text-slate-600">Pastikan data sudah benar sebelum dikirim.</p>

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">Profil Perusahaan</div>
          <dl className="space-y-2 text-sm">
            <Row label="Nama">{profile.name}</Row>
            <Row label="Email">{profile.email}</Row>
            <Row label="Industri">{profile.industry || '-'}</Row>
            <Row label="Ukuran">{profile.size || '-'}</Row>
            <Row label="Kota">{profile.city || '-'}</Row>
            <Row label="Website">{profile.website ? normalizeUrl(profile.website) : '-'}</Row>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">Paket</div>
          <dl className="space-y-2 text-sm">
            <Row label="Nama Paket">{pkg.title}</Row>
            <Row label="Harga">{formatIDR(pkg.price)}</Row>
            <Row label="Fitur">
              <ul className="mt-1 list-disc pl-4">
                {pkg.features.map((f, i) => (<li key={i}>{f}</li>))}
              </ul>
            </Row>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 md:col-span-2">
          <div className="mb-3 text-sm font-semibold text-slate-900">Lowongan</div>
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <Row label="Posisi">{job.title}</Row>
            <Row label="Bidang">{job.functionArea || '-'}</Row>
            <Row label="Level">{job.level || '-'}</Row>
            <Row label="Tipe">{job.type.replace('_', ' ')}</Row>
            <Row label="Mode Kerja">{job.workMode}</Row>
            <Row label="Lokasi">{job.location}</Row>
            <Row label="Batas Lamar">{job.deadline || '-'}</Row>
            <Row label="Tags">{job.tags || '-'}</Row>
          </dl>
          <div className="mt-3">
            <div className="mb-1 text-xs font-medium text-slate-500">Deskripsi</div>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{job.description}</p>
          </div>
          <div className="mt-3">
            <div className="mb-1 text-xs font-medium text-slate-500">Kualifikasi</div>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{job.requirements}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50">
          Kembali
        </button>
        <button
          disabled={busy}
          onClick={onFinish}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? 'Mengirim…' : 'Kirim'}
        </button>
      </div>
    </Card>
  );
}
