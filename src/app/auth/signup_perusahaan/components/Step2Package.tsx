'use client';

import { useEffect, useMemo, useState } from 'react';

// ================= Config =================
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '';

// ================= Types dari UI lama =================
export type PackageId = string;
export type Package = {
  id: PackageId;            // ex: 'starter', 'basic', 'pro' (disarankan = slug plan)
  title: string;            // nama paket di UI
  price: number;            // IDR
  features: string[];
  interval?: 'month' | 'year';
  // Opsional: kalau kamu sudah simpan mapping planId Midtrans/DB di level UI
  planId?: string;
};

// ================ Utils kecil ================
function classNames(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ');
}
function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

// ================ Komponen utama ================
export default function Step2Package({
  packages, selected, setSelected, onBack, onNext,
  userId,                 // <-- kirim dari parent (disarankan). WAJIB agar backend tidak error.
  employerId,             // <-- opsional, kalau mau kaitkan payment ke employer tertentu
  customerEmail,          // <-- opsional; kalau ada, dikirim ke Midtrans
  customerName,           // <-- opsional; kalau ada, dikirim ke Midtrans
}: {
  packages: Package[];
  selected: PackageId;
  setSelected: (v: PackageId) => void;
  onBack: () => void;
  onNext: () => void;
  userId?: string;        // Wajib di backend. Kalau belum ada auth, sementara bisa hardcode di parent.
  employerId?: string;
  customerEmail?: string;
  customerName?: string;
}) {
  const current = packages.find((p) => p.id === selected)!;

  // State loading Snap / bayar
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRedirectUrl, setLastRedirectUrl] = useState<string | null>(null);

  // Muat Snap hanya sekali ketika komponen dipakai
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.snap || !MIDTRANS_CLIENT_KEY) return;
    const s = document.createElement('script');
    s.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    s.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    s.async = true;
    document.body.appendChild(s);
    return () => { document.body.removeChild(s); };
  }, []);

  // Fallback: cari plan dari /api/payments/plans dengan slug === selected
  async function resolvePlanId(): Promise<{ planId: string, interval?: string } | null> {
    // 1) Kalau package-nya sudah punya planId, langsung pakai
    const pkg = packages.find(p => p.id === selected);
    if (pkg?.planId) return { planId: pkg.planId, interval: pkg.interval };

    // 2) Ambil plan publik & cocokkan slug == selected (disarankan id package = slug plan)
    const res = await fetch(`${API_BASE}/api/payments/plans`, { credentials: 'include' });
    if (!res.ok) throw new Error('Gagal memuat daftar plan');
    const plans = await res.json() as Array<{ id: string; slug: string; interval?: string }>;
    const found = plans.find(p => p.slug === selected);
    return found ? { planId: found.id, interval: found.interval } : null;
  }

  // Handler klik "Bayar"
  async function handlePay() {
    try {
      setError(null);
      setPaying(true);
      setLastRedirectUrl(null);

      if (!selected) throw new Error('Silakan pilih paket.');
      if (!userId) throw new Error('User belum terautentikasi (userId tidak tersedia).');

      // Pastikan dapat planId untuk checkout
      const resolved = await resolvePlanId();
      if (!resolved?.planId) throw new Error('Plan tidak ditemukan. Pastikan slug paket sama dengan plan.slug di backend.');
      const planId = resolved.planId;

      // Panggil backend untuk bikin transaksi
      const resp = await fetch(`${API_BASE}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planId,
          userId,                   // ⬅️ WAJIB, agar tidak error "Invalid params: userId required"
          employerId: employerId || undefined,
          customer: {
            email: customerEmail || undefined,
            first_name: customerName || undefined,
          },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || data?.message || 'Gagal memulai pembayaran');

      const { token, redirect_url } = data as { token: string; redirect_url: string };
      setLastRedirectUrl(redirect_url);

      // Buka Snap kalau ada; kalau tidak, buka redirect_url di tab baru
      if (typeof window !== 'undefined' && (window as any).snap?.pay) {
        await new Promise<void>((resolve, reject) => {
          (window as any).snap.pay(token, {
            onSuccess: () => resolve(),              // berhasil => lanjut step berikut
            onPending: () => resolve(),              // pending juga boleh lanjut (nanti diverifikasi dari webhook)
            onError: (e: any) => reject(new Error(e?.message || 'Pembayaran gagal')),
            onClose: () => reject(new Error('Jendela pembayaran ditutup sebelum selesai')),
          });
        });
      } else {
        window.open(redirect_url, '_blank', 'noopener,noreferrer');
      }

      // Kalau sampai sini, anggap sukses/pending → lanjut ke step berikutnya
      onNext();
    } catch (e: any) {
      setError(e?.message || 'Gagal memproses pembayaran.');
    } finally {
      setPaying(false);
    }
  }

  // Info ringkas paket terpilih
  const summary = useMemo(() => {
    if (!current) return null;
    return {
      title: current.title,
      priceText: formatIDR(current.price),
      interval: current.interval ?? 'month',
    };
  }, [current]);

  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <h2 className="text-2xl font-semibold text-slate-900">Pilih Paket</h2>
      <p className="mt-1 text-sm text-slate-600">Pilih paket sesuai kebutuhan. Bisa upgrade kapan saja.</p>

      {/* Error Box */}
      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Grid packages */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((p) => {
          const active = p.id === selected;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={classNames(
                'text-left rounded-2xl border p-5 transition focus:outline-none',
                active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="flex items-baseline justify-between">
                <h3 className={classNames('text-lg font-semibold', active ? 'text-blue-700' : 'text-slate-900')}>
                  {p.title}
                </h3>
                <div className={classNames('text-sm', active ? 'text-blue-600' : 'text-slate-500')}>
                  {formatIDR(p.price)}
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              {p.interval && <div className="mt-2 text-xs text-slate-500">/{p.interval}</div>}
            </button>
          );
        })}
      </div>

      {/* Ringkasan & Aksi */}
      <div className="mt-6 rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Paket dipilih</span>
          <span className="font-semibold text-slate-900">{summary?.title ?? '-'}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-semibold text-slate-900">{summary ? summary.priceText : '-'}</span>
        </div>

        {/* Info: kalau client key belum di-set, kita pakai redirect_url */}
        {!MIDTRANS_CLIENT_KEY && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
            <b>Catatan:</b> <code>NEXT_PUBLIC_MIDTRANS_CLIENT_KEY</code> belum diset.
            Popup Snap tidak bisa dibuka — sistem akan membuka <em>redirect_url</em> di tab baru.
          </p>
        )}

        {/* Kalau sebelumnya sempat gagal buka popup, kasih tombol buka link manual */}
        {lastRedirectUrl && (
          <div className="mt-3 text-xs">
            Link pembayaran:{" "}
            <a
              href={lastRedirectUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-blue-700 underline"
            >
              Buka kembali
            </a>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
        >
          Kembali
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePay}
            disabled={paying || !selected}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            title={!userId ? 'Butuh userId (login) agar bisa checkout' : 'Bayar sekarang'}
          >
            {paying ? 'Memproses…' : 'Bayar / Subscribe'}
          </button>
        </div>
      </div>
    </div>
  );
}
