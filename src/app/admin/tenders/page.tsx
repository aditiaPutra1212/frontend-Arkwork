'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

/* ===== Enum harus sama persis dengan backend (Prisma) ===== */
type Sector = 'OIL_GAS' | 'RENEWABLE_ENERGY' | 'UTILITIES' | 'ENGINEERING';
type Status = 'OPEN' | 'PREQUALIFICATION' | 'CLOSED';
type Contract = 'EPC' | 'SUPPLY' | 'CONSULTING' | 'MAINTENANCE';

type FormState = {
  title: string;
  buyer: string;
  sector: Sector;
  location: string;
  status: Status;
  contract: Contract;
  budgetUSD: number;
  teamSlots: number;
  deadline: string; // yyyy-mm-dd
  description: string;
  documentsCsv: string;
};

type Tender = {
  id: number;
  title: string;
  buyer: string;
  sector: Sector;
  status: Status;
  contract: Contract;
  location: string;
  budgetUSD: number;
  teamSlots: number;
  deadline: string; // ISO
  description: string;
  documents?: string[];
  createdAt?: string;
};

const PATH_ADMIN_TENDERS = '/admin/tenders';

export default function AdminTendersPage() {
  /* ---------- Create form state ---------- */
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [f, setF] = useState<FormState>({
    title: '',
    buyer: '',
    sector: 'OIL_GAS',
    location: '',
    status: 'OPEN',
    contract: 'EPC',
    budgetUSD: 0,
    teamSlots: 0,
    deadline: new Date().toISOString().slice(0, 10),
    description: '',
    documentsCsv: '',
  });
  const onChange = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setF((s) => ({ ...s, [key]: val }));

  /* ---------- List & actions ---------- */
  const [list, setList] = useState<Tender[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listErr, setListErr] = useState<string | null>(null);

  const moneyFmt = useMemo(
    () => new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
    []
  );

  async function fetchList() {
    setLoadingList(true);
    setListErr(null);
    try {
      const res: any = await api(PATH_ADMIN_TENDERS, { method: 'GET' });
      const rows: any[] = Array.isArray(res) ? res
        : Array.isArray(res?.items) ? res.items
        : Array.isArray(res?.data) ? res.data
        : [];
      // sort terbaru dulu (kalau ada createdAt/updatedAt)
      rows.sort((a, b) => +new Date(b?.createdAt || 0) - +new Date(a?.createdAt || 0));
      setList(rows as Tender[]);
    } catch (e: any) {
      setListErr(e?.message || 'Failed to load tenders');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => { fetchList(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const payload = {
        title: f.title.trim(),
        buyer: f.buyer.trim(),
        sector: f.sector,
        location: f.location.trim(),
        status: f.status,
        contract: f.contract,
        budgetUSD: Number(f.budgetUSD) || 0,
        teamSlots: Number(f.teamSlots) || 0,
        description: f.description.trim(),
        documents: f.documentsCsv.split(',').map((s) => s.trim()).filter(Boolean),
        deadline: new Date(f.deadline + 'T00:00:00').toISOString(),
      };

      await api(PATH_ADMIN_TENDERS, { json: payload }); // created id biasanya dikembalikan
      alert('Tender created!');
      // reset sebagian
      setF((s) => ({ ...s, title: '', buyer: '', location: '', description: '', documentsCsv: '' }));
      // refresh list
      fetchList();
    } catch (e: any) {
      setErr(e?.message || 'Failed to create tender');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    const ok = confirm('Delete this tender? This action cannot be undone.');
    if (!ok) return;
    try {
      await api(`${PATH_ADMIN_TENDERS}/${id}`, { method: 'DELETE', expectJson: false });
      setList((rows) => rows.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Failed to delete tender');
    }
  }

  return (
    <div className="space-y-8">
      {/* ======= Create Form ======= */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Tenders Management</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Create tender, set status, upload docs (comma separated), and assign details.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 max-w-3xl">
          {err && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {err}
            </div>
          )}

          <div className="grid gap-2">
            <label className="text-sm font-medium">Title</label>
            <input
              value={f.title}
              onChange={(e) => onChange('title', e.target.value)}
              className="rounded-xl border px-3 py-2"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Buyer</label>
            <input
              value={f.buyer}
              onChange={(e) => onChange('buyer', e.target.value)}
              className="rounded-xl border px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Sector</label>
              <select
                value={f.sector}
                onChange={(e) => onChange('sector', e.target.value as Sector)}
                className="rounded-xl border px-3 py-2"
              >
                <option value="OIL_GAS">OIL_GAS</option>
                <option value="RENEWABLE_ENERGY">RENEWABLE_ENERGY</option>
                <option value="UTILITIES">UTILITIES</option>
                <option value="ENGINEERING">ENGINEERING</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Location</label>
              <input
                value={f.location}
                onChange={(e) => onChange('location', e.target.value)}
                className="rounded-xl border px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={f.status}
                onChange={(e) => onChange('status', e.target.value as Status)}
                className="rounded-xl border px-3 py-2"
              >
                <option value="OPEN">OPEN</option>
                <option value="PREQUALIFICATION">PREQUALIFICATION</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Contract</label>
              <select
                value={f.contract}
                onChange={(e) => onChange('contract', e.target.value as Contract)}
                className="rounded-xl border px-3 py-2"
              >
                <option value="EPC">EPC</option>
                <option value="SUPPLY">SUPPLY</option>
                <option value="CONSULTING">CONSULTING</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Budget (USD)</label>
              <input
                type="number"
                value={f.budgetUSD}
                onChange={(e) => onChange('budgetUSD', Number(e.target.value))}
                className="rounded-xl border px-3 py-2"
                min={0}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Team Slots</label>
              <input
                type="number"
                value={f.teamSlots}
                onChange={(e) => onChange('teamSlots', Number(e.target.value))}
                className="rounded-xl border px-3 py-2"
                min={0}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Deadline</label>
              <input
                type="date"
                value={f.deadline}
                onChange={(e) => onChange('deadline', e.target.value)}
                className="rounded-xl border px-3 py-2"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={f.description}
              onChange={(e) => onChange('description', e.target.value)}
              className="min-h-32 rounded-xl border px-3 py-2"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Documents (comma separated)</label>
            <input
              value={f.documentsCsv}
              onChange={(e) => onChange('documentsCsv', e.target.value)}
              className="rounded-xl border px-3 py-2"
              placeholder="RFP.pdf, BoQ.xlsx"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-neutral-900 px-4 py-2.5 text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>

      {/* ======= List & Delete ======= */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">Existing Tenders</h3>
          <button
            onClick={fetchList}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Refresh
          </button>
        </div>

        {listErr && (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {listErr}
          </div>
        )}

        {loadingList ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-600">
            Loading…
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-600">
            No tenders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 text-left">
                  <Th>Title</Th>
                  <Th>Buyer</Th>
                  <Th>Sector</Th>
                  <Th>Status</Th>
                  <Th>Contract</Th>
                  <Th>Budget</Th>
                  <Th>Deadline</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <Td className="font-medium">{r.title}</Td>
                    <Td>{r.buyer}</Td>
                    <Td>{r.sector}</Td>
                    <Td>{r.status}</Td>
                    <Td>{r.contract}</Td>
                    <Td>{moneyFmt.format(r.budgetUSD || 0)}</Td>
                    <Td>{fmtDate(r.deadline)}</Td>
                    <Td className="text-right">
                      <button
                        onClick={() => onDelete(r.id)}
                        className="rounded-lg border border-red-500 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                        title="Delete tender"
                      >
                        Delete
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- small UI helpers ---------- */
function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-xs uppercase tracking-wide text-neutral-500 ${className}`}>{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}
function fmtDate(iso?: string) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch { return iso; }
}
