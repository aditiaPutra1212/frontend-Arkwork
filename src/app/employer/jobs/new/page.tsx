'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/* ---------------- Env (dukung 2 var + fallback) ---------------- */
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

/* ---------------- Local types & const ---------------- */
type LocalJob = {
  id: number | string;
  title: string;
  company: string;
  location: string;
  type: 'full_time' | 'part_time' | 'contract' | 'internship';
  remote?: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  deadline?: string | null;
  tags?: string[];
  description?: string;
  requirements?: string;
  postedAt?: string; // ISO
  status?: 'active' | 'closed';
  logo?: string | null; // data URL base64
};

type CreatePayload = {
  title: string;
  location?: string;
  employment?: string;
  description?: string;
  isDraft?: boolean;
  // backend tidak pakai semua field lokal, tapi kita simpan lokal lengkap
};

const LS_KEY = 'ark_jobs';

/* ---------------- Alert Modal (modern) ---------------- */
function AlertModal({
  title = 'Berhasil',
  message,
  onClose,
}: {
  title?: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-center text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-center text-sm text-slate-600">{message}</p>
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Oke
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function NewJobPage() {
  const router = useRouter();
  const qs = useSearchParams();
  const editId = qs.get('id'); // jika ada => mode edit

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    // --- field lokal (kaya) ---
    title: '',
    company: '',
    location: '',
    type: 'full_time' as LocalJob['type'],
    remote: false,
    salaryMin: '',
    salaryMax: '',
    currency: 'IDR',
    deadline: '',
    tags: '', // comma separated
    description: '',
    requirements: '',

    // --- field untuk backend (sederhana) ---
    employment: 'Full-time',
    isDraft: false,

    // --- logo ---
    logoFile: null as File | null,
    logoPreview: '' as string, // data URL
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  // Prefill saat edit (dari localStorage)
  useEffect(() => {
    if (!editId) return;
    try {
      const arr: LocalJob[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
      const cur = arr.find((j) => String(j.id) === String(editId));
      if (cur) {
        setForm((p) => ({
          ...p,
          title: cur.title,
          company: cur.company,
          location: cur.location,
          type: cur.type,
          remote: !!cur.remote,
          salaryMin: cur.salaryMin?.toString() ?? '',
          salaryMax: cur.salaryMax?.toString() ?? '',
          currency: cur.currency ?? 'IDR',
          deadline: cur.deadline ?? '',
          tags: (cur.tags ?? []).join(', '),
          description: cur.description ?? '',
          requirements: cur.requirements ?? '',
          // backend mapping (boleh diabaikan saat edit lama)
          employment: p.employment,
          isDraft: p.isDraft,
          logoFile: null,
          logoPreview: cur.logo ?? '',
        }));
      }
    } catch {}
  }, [editId]);

  // handle file -> dataURL
  const onPickLogo: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] || null;
    set('logoFile', f);
    if (!f) return set('logoPreview', '');
    const reader = new FileReader();
    reader.onload = () => set('logoPreview', String(reader.result || ''));
    reader.readAsDataURL(f);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim() || !form.location.trim()) {
      setToast({ type: 'err', msg: 'Judul, perusahaan, dan lokasi wajib diisi.' });
      return;
    }

    setBusy(true);
    setToast(null);

    try {
      /* ---------------- 1) Simpan ke localStorage (selalu) ---------------- */
      const nowIso = new Date().toISOString();

      let arr: LocalJob[] = [];
      try {
        arr = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
      } catch {}

      const existing = editId ? arr.find((j) => String(j.id) === String(editId)) : undefined;

      const localRec: LocalJob = {
        id: editId ?? Date.now(),
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location.trim(),
        type: form.type,
        remote: !!form.remote,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        currency: form.currency || 'IDR',
        deadline: form.deadline || null,
        tags: form.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        description: form.description,
        requirements: form.requirements,
        postedAt: existing?.postedAt ?? nowIso,
        status: existing?.status ?? 'active',
        logo: form.logoPreview || existing?.logo || null,
      };

      if (existing) {
        const i = arr.findIndex((j) => String(j.id) === String(editId));
        if (i >= 0) arr[i] = { ...arr[i], ...localRec, id: arr[i].id };
      } else {
        arr.push(localRec);
      }

      localStorage.setItem(LS_KEY, JSON.stringify(arr));
      window.dispatchEvent(new Event('ark:jobs-updated'));

      /* ---------------- 2) Coba kirim ke server (opsional) ---------------- */
      const employerId = localStorage.getItem('ark_employer_id') || '';
      if (!employerId) {
        // tidak menghalangi sukses lokal — beri info di modal
        setSuccessMsg(
          'Job tersimpan secara lokal.\nCatatan: Gagal menyimpan ke server karena tidak ada employerId (login sebagai employer dulu).'
        );
        return;
      }

      const payloadForBackend: CreatePayload = {
        title: form.title.trim(),
        location: form.location.trim(),
        employment: form.employment,
        description: form.description,
        isDraft: form.isDraft,
      };

      const res = await fetch(`${API.replace(/\/+$/, '')}/api/employer/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...payloadForBackend,
          employerId,
          logoDataUrl: form.logoPreview || undefined, // simpan logo ke profil employer
        }),
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !(json as any)?.ok) {
        const msg = (json as any)?.error || `HTTP ${res.status}`;
        setSuccessMsg(`Job tersimpan secara lokal.\nCatatan: Gagal menyimpan ke server: ${msg}`);
        return;
      }

      // sukses server
      setSuccessMsg('Job berhasil dipublikasikan ke server.');
    } catch (err: any) {
      const msg =
        err?.message === 'Failed to fetch'
          ? 'Job tersimpan lokal.\nCatatan: Gagal terhubung ke server. Periksa BACKEND & NEXT_PUBLIC_API_BASE/NEXT_PUBLIC_API_URL.'
          : `Job tersimpan lokal.\nCatatan: ${err?.message || 'Gagal menyimpan ke server.'}`;
      setSuccessMsg(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[60vh] bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">{editId ? 'Edit Job' : 'Post a Job'}</h1>
        <p className="mt-1 text-sm text-slate-600">Isi detail lowongan untuk dipublikasikan.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Logo uploader / preview */}
          <div className="grid gap-4 sm:grid-cols-[96px,1fr] items-center">
            <div className="h-20 w-20 rounded-2xl bg-slate-100 grid place-items-center overflow-hidden">
              {form.logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="logo" src={form.logoPreview} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-slate-500">Logo</span>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Company Logo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={onPickLogo}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-slate-300 file:px-3 file:py-1.5 file:bg-white"
              />
            </div>
          </div>

          {/* Company & Title */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Company Name</span>
              <input
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="PT ArkWork Indonesia"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Job Title</span>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Frontend Engineer"
              />
            </label>
          </div>

          {/* Location & Type (lokal) + Employment (backend) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Location</span>
              <input
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Jakarta / Remote"
              />
            </label>
            <div className="grid gap-2">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Type (Local)</span>
                <select
                  value={form.type}
                  onChange={(e) => set('type', e.target.value as LocalJob['type'])}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-600">Employment (Send to Server)</span>
                <select
                  value={form.employment}
                  onChange={(e) => set('employment', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </label>
            </div>
          </div>

          {/* Currency, Deadline, Remote */}
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Currency</span>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option>IDR</option>
                <option>USD</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Deadline</span>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => set('deadline', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="mt-6 inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.remote}
                onChange={(e) => set('remote', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Remote-friendly
            </label>
          </div>

          {/* Salary */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Salary Min</span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.salaryMin}
                onChange={(e) => set('salaryMin', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="10000000"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-600">Salary Max</span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.salaryMax}
                onChange={(e) => set('salaryMax', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="20000000"
              />
            </label>
          </div>

          {/* Tags */}
          <label className="block">
            <span className="mb-1 block text-xs text-slate-600">Tags (comma separated)</span>
            <input
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="react, nextjs, tailwind"
            />
          </label>

          {/* Description */}
          <label className="block">
            <span className="mb-1 block text-xs text-slate-600">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Describe the role, team, responsibilities..."
            />
          </label>

          {/* Requirements */}
          <label className="block">
            <span className="mb-1 block text-xs text-slate-600">Requirements</span>
            <textarea
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g., 3+ years of experience, familiar with React, etc."
            />
          </label>

          {/* Draft (backend) */}
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isDraft}
              onChange={(e) => set('isDraft', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Save as draft (server)
          </label>

          {/* Actions */}
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
              disabled={busy}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? (editId ? 'Updating…' : 'Publishing…') : editId ? 'Update Job' : 'Publish Job'}
            </button>
          </div>
        </form>
      </div>

      {/* Toast kecil */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
          <div
            className={`pointer-events-auto w-full max-w-md rounded-2xl border p-4 shadow-2xl backdrop-blur ${
              toast.type === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-6 w-6 rounded-full bg-black/10 grid place-items-center">
                {toast.type === 'ok' ? '✓' : '!'}
              </div>
              <div className="flex-1 text-sm">{toast.msg}</div>
              <button onClick={() => setToast(null)} className="rounded-lg border px-2 text-xs hover:bg-white/50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal sukses */}
      {successMsg && (
        <AlertModal
          title="Berhasil"
          message={successMsg}
          onClose={() => {
            setSuccessMsg(null);
            router.push('/jobs');
          }}
        />
      )}
    </main>
  );
}
