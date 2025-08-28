'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type AppRow = {
  jobId: string | number;
  title: string;
  location: string;
  date: string; // ISO/string
  status?: 'submitted' | 'review' | 'shortlist' | 'rejected';
};

export default function Applications() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AppRow[]>([]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'new' | 'old'>('new');

  // Redirect jika belum login
  useEffect(() => {
    if (!user) {
      window.location.href = '/auth/signin';
    }
  }, [user]);

  // Load data dari localStorage
  useEffect(() => {
    if (!user?.email) return;

    try {
      const appsByUser = JSON.parse(localStorage.getItem('ark_apps') ?? '{}')[user.email] ?? [];
      const jobs: any[] = JSON.parse(localStorage.getItem('ark_jobs') ?? '[]');

      const r: AppRow[] = appsByUser.map((a: any) => {
        const j = jobs.find((jj) => jj.id === a.jobId);
        const fallbackTitle = `Job ${a.jobId}`;
        const fallbackLoc = j?.location ?? '-';

        // status dummy (kalau belum ada di data, gunakan review)
        const status: AppRow['status'] =
          a.status ?? (Math.random() < 0.1 ? 'shortlist' : Math.random() < 0.15 ? 'rejected' : 'review');

        return {
          jobId: a.jobId,
          title: j?.title ?? fallbackTitle,
          location: fallbackLoc,
          date: a.date ?? new Date().toISOString(),
          status,
        };
      });

      setRows(r);
    } catch (e) {
      console.error('Failed to parse localStorage:', e);
      setRows([]);
    }
  }, [user?.email]);

  if (!user) return null;

  // Search + sort
  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    const base = key
      ? rows.filter(
          (r) =>
            r.title.toLowerCase().includes(key) ||
            r.location.toLowerCase().includes(key) ||
            String(r.jobId).toLowerCase().includes(key),
        )
      : rows.slice();

    base.sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      return sort === 'new' ? tb - ta : ta - tb;
    });

    return base;
  }, [rows, q, sort]);

  return (
    <div className="min-h-screen bg-neutral-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero / Header */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-900 to-neutral-700 p-6 text-white shadow-sm">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs/5 opacity-70">Lamaran Saya</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">My Applications</h1>
              <p className="mt-1 text-sm opacity-80">
                Riwayat lamaran kerja yang kamu kirim melalui ArkWork.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/15 active:translate-y-[1px]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Cari Lowongan
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat label="Total Lamaran" value={rows.length} />
            <Stat
              label="Dalam Peninjauan"
              value={rows.filter((x) => x.status === 'review' || x.status === 'submitted').length}
            />
            <Stat label="Masuk Shortlist" value={rows.filter((x) => x.status === 'shortlist').length} />
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari posisi / lokasi / ID…"
              className="w-full rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
              >
                Hapus
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Urut:</span>
            <div className="inline-flex overflow-hidden rounded-xl border border-neutral-300 bg-white p-0.5">
              <button
                onClick={() => setSort('new')}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  sort === 'new' ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Terbaru
              </button>
              <button
                onClick={() => setSort('old')}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  sort === 'old' ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Terlama
              </button>
            </div>
          </div>
        </div>

        {/* Table / List */}
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <Th className="w-[40%]">Position</Th>
                    <Th>Location</Th>
                    <Th>Applied On</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filtered.map((r, i) => (
                    <tr key={i} className="hover:bg-neutral-50/60">
                      <Td>
                        <div className="max-w-[540px] truncate font-medium text-neutral-900">{r.title}</div>
                        <div className="mt-0.5 text-xs text-neutral-500">ID: {String(r.jobId)}</div>
                      </Td>
                      <Td className="text-neutral-700">{r.location}</Td>
                      <Td className="text-neutral-700">{formatDate(r.date)}</Td>
                      <Td>
                        <StatusBadge status={r.status ?? 'review'} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="grid gap-3 p-3 sm:hidden">
                {filtered.map((r, i) => (
                  <div key={`m-${i}`} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="max-w-[240px] truncate font-medium text-neutral-900">{r.title}</div>
                        <div className="mt-1 text-xs text-neutral-500">ID: {String(r.jobId)}</div>
                      </div>
                      <StatusBadge status={r.status ?? 'review'} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                      <div>
                        <div className="text-neutral-400">Location</div>
                        <div className="mt-0.5">{r.location}</div>
                      </div>
                      <div>
                        <div className="text-neutral-400">Applied On</div>
                        <div className="mt-0.5">{formatDate(r.date)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          Data lamaran disimpan lokal untuk demo. Beberapa status ditandai otomatis.
        </p>
      </div>
    </div>
  );
}

/* ---------- Small components ---------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/70">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neutral-100">
          <svg className="h-6 w-6 text-neutral-500" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-neutral-900">Belum ada lamaran</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Kamu belum melamar pekerjaan. Mulai eksplorasi lowongan sekarang.
        </p>
        <Link
          href="/jobs"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 active:translate-y-[1px]"
        >
          Telusuri Lowongan
        </Link>
      </div>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${className}`}>{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-6 py-4 ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: NonNullable<AppRow['status']> }) {
  const map: Record<
    NonNullable<AppRow['status']>,
    { text: string; cls: string }
  > = {
    submitted: { text: 'Submitted', cls: 'bg-blue-100 text-blue-700' },
    review: { text: 'Under Review', cls: 'bg-amber-100 text-amber-800' },
    shortlist: { text: 'Shortlisted', cls: 'bg-emerald-100 text-emerald-700' },
    rejected: { text: 'Rejected', cls: 'bg-rose-100 text-rose-700' }
  };

  const { text, cls } = map[status] ?? map.review;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{text}</span>;
}

function formatDate(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;

  // relative dalam 30 hari terakhir
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) {
      const mins = Math.max(1, Math.floor(diff / (1000 * 60)));
      return `${mins} menit lalu`;
    }
    return `${hours} jam lalu`;
  }
  if (days < 30) return `${days} hari lalu`;

  // fallback absolut
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(d);
}
