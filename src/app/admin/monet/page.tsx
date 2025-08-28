'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api'; // jika alias @ belum ada, ganti ke path relatif

type Plan = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  amount: number;        // IDR (integer)
  currency: string;      // 'IDR'
  interval: string;      // 'month' | 'year'
  active: boolean;
  priceId?: string | null;
};

const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

// State form sebagai string agar aman untuk input number
type PlanForm = {
  id: string;
  slug: string;
  name: string;
  description: string;
  amount: string;   // nanti di-parse ke number
  currency: string;
  interval: string;
  active: boolean;
  priceId: string;
};

const emptyForm: PlanForm = {
  id: '',
  slug: '',
  name: '',
  description: '',
  amount: '0',
  currency: 'IDR',
  interval: 'month',
  active: true,
  priceId: '',
};

export default function PlansPage() {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const isEdit = useMemo(() => Boolean(form.id), [form.id]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Plan[]>('/admin/plans');
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat paket');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(p: Plan) {
    setForm({
      id: p.id,
      slug: p.slug ?? '',
      name: p.name ?? '',
      description: p.description ?? '',
      amount: String(p.amount ?? 0),
      currency: p.currency ?? 'IDR',
      interval: p.interval ?? 'month',
      active: !!p.active,
      priceId: p.priceId ?? '',
    });
    setModalOpen(true);
  }

  async function save() {
    try {
      setError(null);

      const payload = {
        slug: (form.slug || '').trim().toLowerCase(),
        name: (form.name || '').trim(),
        description: form.description?.trim() || null,
        amount: Number(form.amount || 0),
        currency: (form.currency || 'IDR').trim(),
        interval: (form.interval || 'month').trim(),
        active: !!form.active,
        priceId: form.priceId?.trim() || null,
      };

      if (!payload.slug) throw new Error('Slug wajib diisi');
      if (!payload.name) throw new Error('Nama paket wajib diisi');
      if (!Number.isFinite(payload.amount) || payload.amount < 0) {
        throw new Error('Harga tidak valid');
      }

      if (isEdit) {
        await api<Plan>(`/admin/plans/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await api<Plan>('/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setModalOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Gagal menyimpan paket');
    }
  }

  async function remove(p: Plan) {
    if (!confirm(`Hapus paket "${p.name}"?`)) return;
    try {
      await api(`/admin/plans/${p.id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      alert(e?.message || 'Gagal menghapus');
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Paket Monetisasi</h1>
          <p className="text-sm text-slate-600">Kelola paket, harga, status aktif/nonaktif.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Paket Baru
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Belum ada paket. Klik <b>+ Paket Baru</b> untuk menambahkan.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">/{p.interval}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-2 text-lg font-bold">{fmtIDR(p.amount)}</div>
              <div className="mt-2 text-sm text-slate-600 line-clamp-3">{p.description || '—'}</div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(p)}
                  className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
                >
                  Hapus
                </button>
              </div>
              <div className="mt-3 text-xs text-slate-500">slug: {p.slug}</div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{isEdit ? 'Edit Paket' : 'Tambah Paket'}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-lg border px-2 text-slate-600">✕</button>
            </div>

            <div className="grid gap-3">
              <label className="block text-sm">
                <div className="mb-1 text-slate-600">Nama</div>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm">
                <div className="mb-1 text-slate-600">Slug</div>
                <input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-sm sm:col-span-2">
                  <div className="mb-1 text-slate-600">Harga (IDR)</div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.amount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, '');
                      setForm((f) => ({ ...f, amount: v }));
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                <label className="block text-sm">
                  <div className="mb-1 text-slate-600">Interval</div>
                  <select
                    value={form.interval}
                    onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="month">Bulanan</option>
                    <option value="year">Tahunan</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm">
                <div className="mb-1 text-slate-600">Deskripsi</div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  Aktif
                </label>

                <label className="text-xs text-slate-500">
                  Price ID (opsional):
                  <input
                    value={form.priceId}
                    onChange={(e) => setForm((f) => ({ ...f, priceId: e.target.value }))}
                    className="ml-2 rounded-lg border border-slate-300 px-2 py-1"
                  />
                </label>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={save}
                  disabled={!form.name || !form.slug || Number(form.amount) < 0}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
