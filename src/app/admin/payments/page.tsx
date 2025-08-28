'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

/* ========================= Shared utils ========================= */
const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

function cx(...s: (string | false | null | undefined)[]) { return s.filter(Boolean).join(' '); }
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left text-xs font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="col-span-1 text-slate-500">{label}</div>
      <div className="col-span-2 font-medium text-slate-800 break-all">{children}</div>
    </div>
  );
}

/* ========================= Types ========================= */
type Plan = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  interval: string;
  active: boolean;
  priceId?: string | null;
};

type CheckoutRes = {
  token: string;
  redirect_url: string;
  orderId: string;
  amount: number;
};

type PaymentItem = {
  id: string;
  orderId: string;
  status: string;   // settlement | pending | cancel | expire | deny | refund | failure | capture
  method?: string | null;
  grossAmount: number;
  currency: string; // IDR
  createdAt: string;
  transactionId?: string | null;
  plan?: { id: string; slug: string; name: string; interval: string | null } | null;
  employer?: { id: string; displayName: string; legalName: string; slug: string } | null;
};
type ListResp = { items: PaymentItem[]; nextCursor: string | null };

/* ========================= Constants ========================= */
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '';
const STATUS_COLORS: Record<string, string> = {
  settlement: 'bg-emerald-100 text-emerald-700',
  capture: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  deny: 'bg-rose-100 text-rose-700',
  cancel: 'bg-rose-100 text-rose-700',
  expire: 'bg-slate-200 text-slate-700',
  refund: 'bg-violet-100 text-violet-700',
  failure: 'bg-rose-100 text-rose-700',
};
function badgeClass(status: string) { return STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'; }

/* ========================= Main Page ========================= */
export default function PaymentsCombinedPage() {
  const [tab, setTab] = useState<'inbox' | 'checkout'>('inbox');

  // Load Snap.js sekali
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.snap) return;
    if (!MIDTRANS_CLIENT_KEY) return;
    const id = 'midtrans-snap-script';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    s.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Payments (Midtrans)</h1>
          <p className="text-sm text-slate-600">
            Kelola pembayaran perusahaan (inbox), dan opsional uji coba Snap pada tab Manual Checkout.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 p-1">
          <button
            onClick={() => setTab('inbox')}
            className={cx('rounded-lg px-3 py-1.5 text-sm', tab==='inbox' ? 'bg-slate-900 text-white' : 'text-slate-700')}
          >
            Inbox
          </button>
          <button
            onClick={() => setTab('checkout')}
            className={cx('rounded-lg px-3 py-1.5 text-sm', tab==='checkout' ? 'bg-slate-900 text-white' : 'text-slate-700')}
          >
            Manual Checkout (Test)
          </button>
        </div>
      </div>

      {tab === 'inbox' ? <InboxPayments /> : <ManualCheckout />}
    </div>
  );
}

/* ========================= Tab 1: Inbox ========================= */
function InboxPayments() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(''); // filter status

  async function load({ cursor }: { cursor?: string } = {}) {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams();
      if (cursor) qs.set('cursor', cursor);
      if (status) qs.set('status', status);
      const data = await api<ListResp>(`/api/payments?${qs.toString()}`);
      if (cursor) setItems((prev) => [...prev, ...data.items]);
      else setItems(data.items);
      setNextCursor(data.nextCursor);
    } catch (e: any) {
      setErr(e?.message || 'Gagal memuat pembayaran');
    } finally {
      setLoading(false);
    }
  }

  // initial load + reload on status change
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  // DENGARKAN SINYAL dari halaman signup untuk auto-refresh
  useEffect(() => {
    const onCustom = () => load(); // CustomEvent dari window
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ark:payment:ping') load();
    };
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('ark_payments');
      bc.onmessage = () => load();
    } catch {}
    window.addEventListener('ark:payment' as any, onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('ark:payment' as any, onCustom);
      window.removeEventListener('storage', onStorage);
      try { bc?.close(); } catch {}
    };
  }, []); // eslint-disable-line

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          title="Filter status"
        >
          <option value="">Semua status</option>
          <option value="settlement">Settlement</option>
          <option value="pending">Pending</option>
          <option value="capture">Capture</option>
          <option value="expire">Expire</option>
          <option value="cancel">Cancel</option>
          <option value="deny">Deny</option>
          <option value="refund">Refund</option>
          <option value="failure">Failure</option>
        </select>
        <button
          onClick={() => load()}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {err && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">{err}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <Th>Waktu</Th>
              <Th>Perusahaan</Th>
              <Th>Paket</Th>
              <Th className="text-right">Jumlah</Th>
              <Th>Status</Th>
              <Th>Metode</Th>
              <Th>Order ID</Th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr><td className="p-4 text-slate-500" colSpan={7}>Memuat…</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-6 text-slate-500" colSpan={7}>Belum ada pembayaran.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <Td>{new Date(p.createdAt).toLocaleString('id-ID')}</Td>
                  <Td>
                    <div className="font-medium text-slate-900">
                      {p.employer?.displayName || p.employer?.legalName || '—'}
                    </div>
                    <div className="text-xs text-slate-500">{p.employer?.slug || '—'}</div>
                  </Td>
                  <Td>
                    <div className="text-slate-900">{p.plan?.name || '—'}</div>
                    <div className="text-xs text-slate-500">
                      {p.plan?.slug || '—'} {p.plan?.interval ? `• /${p.plan.interval}` : ''}
                    </div>
                  </Td>
                    <Td className="text-right font-semibold">{fmtIDR(p.grossAmount)}</Td>
                  <Td>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${badgeClass(p.status)}`}>
                      {p.status}
                    </span>
                  </Td>
                  <Td>{p.method || '—'}</Td>
                  <Td>
                    <div className="font-mono text-xs">{p.orderId}</div>
                    {p.transactionId && <div className="font-mono text-[11px] text-slate-500">{p.transactionId}</div>}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between">
        <span className="text-xs text-slate-500">
          {items.length} item{items.length !== 1 ? 's' : ''}{status ? ` • status: ${status}` : ''}
        </span>
        {nextCursor ? (
          <button
            onClick={() => load({ cursor: nextCursor! })}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            disabled={loading}
          >
            {loading ? 'Memuat…' : 'Muat lebih banyak'}
          </button>
        ) : (
          <span className="text-xs text-slate-400">— selesai —</span>
        )}
      </div>
    </>
  );
}

/* ========================= Tab 2: Manual Checkout (Test) ========================= */
function ManualCheckout() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form
  const [planId, setPlanId] = useState<string>('');
  const [employerId, setEmployerId] = useState<string>(''); // opsional
  const [email, setEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutRes | null>(null);
  const [status, setStatus] = useState<string>('');

  const selectedPlan = useMemo(() => plans.find(p => p.id === planId), [plans, planId]);

  // load plans (admin page, boleh pakai endpoint /admin/plans atau /api/payments/plans)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await api<Plan[]>('/admin/plans');
        const active = data.filter(p => p.active);
        setPlans(active);
        if (active.length > 0 && !planId) setPlanId(active[0].id);
      } catch (e: any) {
        setErr(e?.message || 'Gagal memuat paket');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line

  // polling status setelah checkout
  useEffect(() => {
    if (!checkout?.orderId) return;
    let stop = false;
    const tick = async () => {
      try {
        const p = await api<any>(`/api/payments/${checkout.orderId}`);
        setStatus(p?.status || '');
        if (['settlement', 'expire', 'cancel', 'deny', 'refund'].includes(p?.status)) return;
      } catch {}
      if (!stop) setTimeout(tick, 2500);
    };
    tick();
    return () => { stop = true; };
  }, [checkout?.orderId]);

  async function handlePay() {
    if (!planId || !email) {
      setErr('Plan dan email wajib diisi.');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const payload = {
        planId,
        employerId: employerId || undefined,
        customer: { email, first_name: firstName, last_name: lastName, phone },
      };
      const res = await api<CheckoutRes>('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setCheckout(res);

      if (window.snap?.pay) {
        window.snap.pay(res.token, {
          onSuccess: () => setStatus('settlement'),
          onPending: () => setStatus('pending'),
          onError: () => setStatus('error'),
          onClose: () => setStatus((s) => s || 'closed'),
        });
      } else {
        window.open(res.redirect_url, '_blank', 'noopener,noreferrer');
      }
    } catch (e: any) {
      setErr(e?.message || 'Gagal memulai pembayaran');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Data Transaksi (Test)</h2>

        {err && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">{err}</div>}

        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : (
          <div className="grid gap-3">
            <label className="block text-sm">
              <div className="mb-1 text-slate-600">Paket</div>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {fmtIDR(p.amount)} / {p.interval}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <div className="mb-1 text-slate-600">Employer ID (opsional)</div>
              <input
                value={employerId}
                onChange={(e) => setEmployerId(e.target.value)}
                placeholder="uuid employer (jika ada)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <div className="mb-1 text-slate-600">Email Customer</div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="customer@email.com"
                />
              </label>
              <label className="block text-sm">
                <div className="mb-1 text-slate-600">Telepon (opsional)</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="08xxxxxxxxxx"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <div className="mb-1 text-slate-600">Nama Depan</div>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <div className="mb-1 text-slate-600">Nama Belakang</div>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <button
              onClick={handlePay}
              disabled={busy || !planId || !email}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? 'Membuat transaksi…' : 'Buat Pembayaran'}
            </button>

            {!MIDTRANS_CLIENT_KEY && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <b>Warning:</b> <code>NEXT_PUBLIC_MIDTRANS_CLIENT_KEY</code> belum diset.
                Snap tidak bisa dibuka, sistem akan membuka <em>redirect_url</em> saja.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Ringkasan</h2>
        <dl className="space-y-2 text-sm">
          <Row label="Paket">{selectedPlan?.name ?? '-'}</Row>
          <Row label="Harga">{selectedPlan ? fmtIDR(selectedPlan.amount) : '-'}</Row>
          <Row label="Interval">{selectedPlan?.interval ?? '-'}</Row>
          <Row label="Email">{email || '-'}</Row>
          <Row label="Employer ID">{employerId || '-'}</Row>
        </dl>

        {checkout && (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
            <div className="font-semibold text-blue-900">Transaksi dibuat</div>
            <div className="mt-1 text-blue-800">
              Order ID: <code className="font-mono">{checkout.orderId}</code>
            </div>
            <div className="mt-1">
              <button
                onClick={() =>
                  window.snap?.pay
                    ? window.snap.pay(checkout.token)
                    : window.open(checkout.redirect_url, '_blank', 'noopener,noreferrer')
                }
                className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                Buka Snap
              </button>
            </div>
          </div>
        )}

        {status && (
          <div className="mt-4 rounded-xl border px-3 py-2 text-sm"
               style={{ borderColor: '#cbd5e1', background: '#f8fafc' }}>
            Status transaksi: <b>{status}</b>
          </div>
        )}
      </div>
    </div>
  );
}
