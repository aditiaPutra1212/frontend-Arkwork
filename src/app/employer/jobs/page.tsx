'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Nav from '@/components/nav';
import Footer from '@/components/Footer';

/* ---------------- Types ---------------- */
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
  postedAt?: string;                  // ISO
  status?: 'active' | 'closed';       // <— penting: union type
  logo?: string | null;               // dataURL/logo url (opsional)
};

const LS_KEY = 'ark_jobs';

/* ---------------- UI: Modern Alerts ---------------- */
function AlertModal({
  title = 'Berhasil',
  message,
  variant = 'success',
  onClose,
}: {
  title?: string;
  message: string;
  variant?: 'success' | 'error' | 'info';
  onClose: () => void;
}) {
  const ring =
    variant === 'success'
      ? 'bg-emerald-100 text-emerald-600'
      : variant === 'error'
      ? 'bg-rose-100 text-rose-600'
      : 'bg-blue-100 text-blue-600';

  const icon = (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {variant === 'success' && <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />}
      {variant === 'error' && <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
      {variant === 'info' && (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
          <circle cx="12" cy="12" r="9" />
        </>
      )}
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ease-out animate-in fade-in-0 zoom-in-95">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${ring}`}>{icon}</div>
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

function ConfirmModal({
  title = 'Konfirmasi',
  message,
  confirmText = 'Ya, lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86l-7.4 12.84A2 2 0 004.53 20h14.94a2 2 0 001.64-3.3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-center text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-center text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={onCancel}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="w-full rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/* ---------------- Page ---------------- */
export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<LocalJob[]>([]);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LocalJob | null>(null);

  // load awal
  useEffect(() => {
    try {
      const arr: LocalJob[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
      setJobs(arr);
    } catch {
      setJobs([]);
    }
  }, []);

  function save(next: LocalJob[], successMessage?: string) {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    setJobs(next);
    // beri tahu halaman /jobs agar refresh
    window.dispatchEvent(new Event('ark:jobs-updated'));
    if (successMessage) setAlertMsg(successMessage);
  }

  function remove(id: LocalJob['id']) {
    setConfirmDelete(null);
    const filtered = jobs.filter((j) => String(j.id) !== String(id));
    save(filtered, 'Job berhasil dihapus.');
  }

  function toggleStatus(id: LocalJob['id']) {
    const next = jobs.map((j) => {
      if (String(j.id) !== String(id)) return j;
      const current: 'active' | 'closed' = j.status ?? 'active';
      const updated: 'active' | 'closed' = current === 'active' ? 'closed' : 'active';
      return { ...j, status: updated };
    });
    save(next, 'Status berhasil diperbarui.');
  }

  const sorted = useMemo(
    () =>
      [...jobs].sort((a, b) => {
        const ta = new Date(a.postedAt ?? 0).getTime();
        const tb = new Date(b.postedAt ?? 0).getTime();
        return tb - ta;
      }),
    [jobs]
  );

  return (
    <>
      <Nav />
      <main className="min-h-[60vh] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex items-end justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
              <p className="text-sm text-slate-600">Kelola lowongan yang sedang tayang.</p>
            </div>
            <Link
              href="/employer/jobs/new"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Post a Job
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Posisi</th>
                  <th className="px-4 py-3">Perusahaan</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Diposting</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-600">
                      Belum ada lowongan. Klik <span className="font-medium text-slate-900">Post a Job</span>.
                    </td>
                  </tr>
                )}

                {sorted.map((j) => {
                  const friendlyType =
                    j.type === 'full_time'
                      ? 'Full-time'
                      : j.type === 'part_time'
                      ? 'Part-time'
                      : j.type === 'contract'
                      ? 'Contract'
                      : 'Internship';

                  return (
                    <tr key={j.id} className="border-b last:border-0">
                      {/* Title + avatar/logo */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-amber-400 text-sm font-bold text-white">
                            {j.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={j.logo} alt="logo" className="h-full w-full object-cover" />
                            ) : (
                              initials(j.company || 'AW')
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{j.title}</div>
                            <div className="text-xs text-slate-500">{j.tags?.slice(0, 3).join(' • ')}</div>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3 text-slate-700">{j.company}</td>

                      {/* Location */}
                      <td className="px-4 py-3 text-slate-700">
                        {j.location} {j.remote ? '• Remote' : ''}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 text-slate-700">{friendlyType}</td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                            (j.status ?? 'active') === 'active'
                              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                              : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
                          ].join(' ')}
                        >
                          {(j.status ?? 'active') === 'active' ? 'Active' : 'Closed'}
                        </span>
                      </td>

                      {/* Posted date */}
                      <td className="px-4 py-3 text-slate-700">
                        {j.postedAt ? new Date(j.postedAt).toLocaleDateString() : '-'}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/employer/jobs/new?id=${j.id}`}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => toggleStatus(j.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          >
                            {(j.status ?? 'active') === 'active' ? 'Tutup' : 'Buka'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(j)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 hover:bg-rose-100"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert success */}
        {alertMsg && (
          <AlertModal
            title="Berhasil"
            message={alertMsg}
            variant="success"
            onClose={() => setAlertMsg(null)}
          />
        )}

        {/* Confirm delete */}
        {confirmDelete && (
          <ConfirmModal
            title="Hapus Lowongan?"
            message={`Anda yakin ingin menghapus "${confirmDelete.title}" di ${confirmDelete.company}? Tindakan ini tidak dapat dibatalkan.`}
            confirmText="Ya, hapus"
            cancelText="Batal"
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => remove(confirmDelete.id)}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
