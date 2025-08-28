'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

/* ---------------- Server base (dukung 2 var + fallback dev) ---------------- */
const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

/* ---------------- Types ---------------- */
type JobDTO = {
  id: string;
  title: string;
  location: string;
  employment: string;
  description: string;
  postedAt: string; // ISO
  company: string;
  logoUrl: string | null;
  isActive: boolean;
};

type Job = {
  id: string | number;
  title: string;
  location: string;
  industry: 'Oil & Gas' | 'Renewable Energy' | 'Mining';
  contract: 'Full-time' | 'Contract' | 'Part-time';
  function: 'Engineering' | 'Operations' | 'Management';
  remote: 'On-site' | 'Remote' | 'Hybrid';
  posted: string; // YYYY-MM-DD
  description: string;
  company?: string;
  logo?: string | null; // data URL atau URL
};

const LS_KEY = 'ark_jobs';

type LocalJob = {
  id: string | number;
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
  logo?: string | null; // data URL
};

/* ---------- Helpers & Normalizer ---------- */
function guessIndustry(tags?: string[]): Job['industry'] {
  const t = (tags ?? []).map((s) => s.toLowerCase());
  if (t.some((x) => /renewable|solar|wind|pv|geothermal|hydro/.test(x))) return 'Renewable Energy';
  if (t.some((x) => /mining|mine|coal|nickel|mineral/.test(x))) return 'Mining';
  return 'Oil & Gas';
}
function mapContractFromLocal(t: LocalJob['type']): Job['contract'] {
  switch (t) {
    case 'part_time':
      return 'Part-time';
    case 'contract':
      return 'Contract';
    default:
      return 'Full-time';
  }
}
function mapFunctionFromTextLocal(j: LocalJob): Job['function'] {
  const txt = `${j.title} ${j.description ?? ''}`.toLowerCase();
  if (/(manager|lead|head|director|pm)/.test(txt)) return 'Management';
  if (/(operator|technician|maintenance|operations)/.test(txt)) return 'Operations';
  return 'Engineering';
}
function mapRemoteLocal(r?: boolean): Job['remote'] {
  return r ? 'Remote' : 'On-site';
}
function isoToYmd(iso?: string): string {
  try {
    const d = iso ? new Date(iso) : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return iso || '';
  }
}
function normalizeLocal(ls: LocalJob[]): Job[] {
  return ls
    .filter((j) => (j.status ?? 'active') === 'active')
    .map((j, idx) => ({
      id: j.id ?? Date.now() + idx,
      title: j.title,
      company: j.company,
      location: j.location || 'Indonesia',
      industry: guessIndustry(j.tags),
      contract: mapContractFromLocal(j.type),
      function: mapFunctionFromTextLocal(j),
      remote: mapRemoteLocal(j.remote),
      posted: isoToYmd(j.postedAt),
      description: j.description || '',
      logo: j.logo ?? null,
    }));
}

/* ---------- Normalizer dari server DTO ---------- */
function mapContractFromServer(e: string): Job['contract'] {
  const v = (e || '').toLowerCase();
  if (v.includes('part')) return 'Part-time';
  if (v.includes('contract')) return 'Contract';
  return 'Full-time';
}
function mapFunctionFromTextServer(j: JobDTO): Job['function'] {
  const txt = `${j.title} ${j.description ?? ''}`.toLowerCase();
  if (/(manager|lead|head|director|pm)/.test(txt)) return 'Management';
  if (/(operator|technician|maintenance|operations)/.test(txt)) return 'Operations';
  return 'Engineering';
}
function mapRemoteFromServer(location: string): Job['remote'] {
  const lc = (location || '').toLowerCase();
  if (lc.includes('remote')) return 'Remote';
  if (lc.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}
function normalizeServer(arr: JobDTO[]): Job[] {
  return (arr || [])
    .filter((j) => j.isActive !== false)
    .map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location || 'Indonesia',
      industry: 'Oil & Gas', // default; bisa diperkaya jika backend kirim tags
      contract: mapContractFromServer(j.employment),
      function: mapFunctionFromTextServer(j),
      remote: mapRemoteFromServer(j.location),
      posted: isoToYmd(j.postedAt),
      description: j.description || '',
      logo: j.logoUrl || null,
    }));
}

/* ---------------- Page ---------------- */
export default function JobsPage() {
  const t = useTranslations('jobs');
  const locale = useLocale();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState({
    q: '',
    loc: '',
    industry: '',
    contract: '',
    func: '',
    remote: '',
  });
  const [selected, setSelected] = useState<Job | null>(null);
  const [saved, setSaved] = useState<Array<string | number>>([]);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [drawer, setDrawer] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // baca localStorage jobs
  const readLocal = (): LocalJob[] => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
    } catch {
      return [];
    }
  };

  const refreshFromLocal = () => {
    const ls = readLocal();
    const normalized = normalizeLocal(ls);
    const sorted = normalized.sort((a, b) =>
      sort === 'newest'
        ? new Date(b.posted).getTime() - new Date(a.posted).getTime()
        : new Date(a.posted).getTime() - new Date(b.posted).getTime()
    );
    setJobs(sorted);
  };

  // load dari server dlu, kalau kosong/gagal => fallback local
  useEffect(() => {
    (async () => {
      try {
        setLoadErr(null);
        const base = API.replace(/\/+$/, '');

        // 1) publik
        const r1 = await fetch(`${base}/api/jobs?active=1`, { credentials: 'include' });
        if (r1.ok) {
          const j1 = await r1.json().catch(() => null);
          const serverList: JobDTO[] = Array.isArray(j1?.data) ? j1.data : [];
          const mapped = normalizeServer(serverList);
          if (mapped.length > 0) {
            const sorted = mapped.sort((a, b) =>
              sort === 'newest'
                ? new Date(b.posted).getTime() - new Date(a.posted).getTime()
                : new Date(a.posted).getTime() - new Date(b.posted).getTime()
            );
            setJobs(sorted);
            return;
          }
        }

        // 2) fallback: job milik employer (dev / logged-in)
        const eid = localStorage.getItem('ark_employer_id');
        if (eid) {
          const r2 = await fetch(`${base}/api/employer/jobs?employerId=${encodeURIComponent(eid)}`, {
            credentials: 'include',
          });
          if (r2.ok) {
            const j2 = await r2.json().catch(() => null);
            const serverList2: JobDTO[] = Array.isArray(j2?.data) ? j2.data : [];
            const mapped2 = normalizeServer(serverList2);
            if (mapped2.length > 0) {
              const sorted = mapped2.sort((a, b) =>
                sort === 'newest'
                  ? new Date(b.posted).getTime() - new Date(a.posted).getTime()
                  : new Date(a.posted).getTime() - new Date(b.posted).getTime()
              );
              setJobs(sorted);
              return;
            }
          }
        }

        // 3) local fallback
        refreshFromLocal();
      } catch (e: any) {
        console.error('[JobsPage] load error:', e);
        setLoadErr(e?.message || 'Gagal memuat data');
        refreshFromLocal();
      }
    })();

    // saved jobs
    try {
      setSaved(JSON.parse(localStorage.getItem('ark_saved_global') ?? '[]'));
    } catch {}

    // live refresh setelah posting dari form
    const onUpd = () => refreshFromLocal();
    window.addEventListener('ark:jobs-updated', onUpd);
    return () => window.removeEventListener('ark:jobs-updated', onUpd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' }),
    [locale]
  );

  const items = useMemo(() => {
    const k = filters.q.toLowerCase();
    const loc = filters.loc.toLowerCase();

    const arr = jobs.filter(
      (j) =>
        (k === '' || j.title.toLowerCase().includes(k) || (j.company || '').toLowerCase().includes(k)) &&
        (loc === '' || j.location.toLowerCase().includes(loc)) &&
        (filters.industry === '' || j.industry === filters.industry) &&
        (filters.contract === '' || j.contract === filters.contract) &&
        (filters.func === '' || j.function === filters.func) &&
        (filters.remote === '' || j.remote === filters.remote)
    );

    arr.sort((a, b) =>
      sort === 'newest'
        ? new Date(b.posted).getTime() - new Date(a.posted).getTime()
        : new Date(a.posted).getTime() - new Date(b.posted).getTime()
    );

    return arr;
  }, [jobs, filters, sort]);

  const toggleSave = (id: string | number) => {
    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(next);
    localStorage.setItem('ark_saved_global', JSON.stringify(next));
  };
  const clearFilters = () =>
    setFilters({ q: '', loc: '', industry: '', contract: '', func: '', remote: '' });

  const formatPosted = (ymd: string) => {
    const d = new Date(ymd);
    return isNaN(d.getTime()) ? ymd : dateFmt.format(d);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">{t('heading')}</h1>
              <p className="text-neutral-600">{t('subheading')}</p>
              {loadErr && (
                <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {loadErr}
                </div>
              )}
            </div>

            {/* Search + Sort + Mobile filter */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  value={filters.q}
                  onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
                  placeholder={t('search.placeholder')}
                  className="w-full sm:w-80 rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-600">{t('sort.label')}</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="newest">{t('sort.newest')}</option>
                  <option value="oldest">{t('sort.oldest')}</option>
                </select>
              </div>

              <button
                onClick={() => setDrawer(true)}
                className="sm:hidden inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                <FilterIcon className="h-4 w-4" /> {t('filters.title')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8 grid lg:grid-cols-12 gap-6">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:col-span-3 lg:block">
          <FilterCard>
            <FilterInput
              label={t('filters.location')}
              value={filters.loc}
              onChange={(v) => setFilters((s) => ({ ...s, loc: v }))}
              icon={<PinIcon className="h-4 w-4" />}
            />
            <FilterSelect
              label={t('filters.industry')}
              value={filters.industry}
              onChange={(v) => setFilters((s) => ({ ...s, industry: v }))}
              options={['', 'Oil & Gas', 'Renewable Energy', 'Mining']}
              icon={<LayersIcon className="h-4 w-4" />}
            />
            <FilterSelect
              label={t('filters.contract')}
              value={filters.contract}
              onChange={(v) => setFilters((s) => ({ ...s, contract: v }))}
              options={['', 'Full-time', 'Contract', 'Part-time']}
              icon={<BriefcaseIcon className="h-4 w-4" />}
            />
            <FilterSelect
              label={t('filters.function')}
              value={filters.func}
              onChange={(v) => setFilters((s) => ({ ...s, func: v }))}
              options={['', 'Engineering', 'Operations', 'Management']}
              icon={<CogIcon className="h-4 w-4" />}
            />
            <FilterSelect
              label={t('filters.workmode')}
              value={filters.remote}
              onChange={(v) => setFilters((s) => ({ ...s, remote: v }))}
              options={['', 'On-site', 'Remote', 'Hybrid']}
              icon={<GlobeIcon className="h-4 w-4" />}
            />

            <div className="pt-3 flex items-center justify-between">
              <span className="text-sm text-neutral-500">
                {t('filters.results', { count: items.length })}
              </span>
              <button onClick={clearFilters} className="text-sm text-blue-700 hover:underline">
                {t('filters.clear')}
              </button>
            </div>
          </FilterCard>
        </aside>

        {/* List */}
        <section className="lg:col-span-6 space-y-4">
          {items.length === 0 ? (
            <EmptyState t={t} />
          ) : (
            items.map((job) => (
              <article
                key={job.id}
                className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-amber-400 grid place-items-center overflow-hidden text-white text-sm font-bold">
                    {job.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={job.company || 'logo'} src={job.logo} className="h-full w-full object-cover" />
                    ) : (
                      initials(job.company || 'AW')
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base md:text-lg font-semibold text-neutral-900">
                          {job.title}
                        </h3>
                        <p className="text-sm text-neutral-600 truncate">{job.company || t('common.company')}</p>
                      </div>
                      <button
                        onClick={() => setSelected(job)}
                        className="rounded-lg bg-neutral-900 text-white px-3 py-1.5 text-xs hover:opacity-90"
                      >
                        {t('common.view')}
                      </button>
                    </div>

                    {/* meta row */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[13px]">
                      <Meta icon={<PinIcon className="h-4 w-4" />} text={job.location} />
                      <Meta icon={<BriefcaseIcon className="h-4 w-4" />} text={job.contract} />
                      <Meta icon={<LayersIcon className="h-4 w-4" />} text={job.industry} />
                      <Meta icon={<GlobeIcon className="h-4 w-4" />} text={job.remote} />
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-neutral-600">{job.description}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-neutral-500">
                        {t('common.posted', { date: formatPosted(job.posted) })}
                      </span>
                      <button
                        onClick={() => toggleSave(job.id)}
                        className={[
                          'rounded-lg border px-2.5 py-1 text-xs transition',
                          saved.includes(job.id)
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50',
                        ].join(' ')}
                      >
                        {saved.includes(job.id) ? t('common.saved') : t('common.save')}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        {/* Detail (desktop sticky) */}
        <aside className="hidden lg:col-span-3 lg:block">
          <DetailPanel
            tns={t}
            job={selected}
            onApply={() => applySelected(selected)}
            onSave={() => selected && toggleSave(selected.id)}
            saved={selected ? saved.includes(selected.id) : false}
            formatPosted={formatPosted}
          />
        </aside>
      </div>

      {/* Drawer (mobile filters) */}
      {drawer && (
        <Drawer onClose={() => setDrawer(false)} title={t('filters.title')}>
          <div className="space-y-3">
            <FilterInput
              label={t('filters.location')}
              value={filters.loc}
              onChange={(v) => setFilters((s) => ({ ...s, loc: v }))}
              icon={<PinIcon className="h-4 w-4" />}
            />
            <FilterSelect
              label={t('filters.industry')}
              value={filters.industry}
              onChange={(v) => setFilters((s) => ({ ...s, industry: v }))}
              options={['', 'Oil & Gas', 'Renewable Energy', 'Mining']}
              icon={<LayersIcon className="h-4 w-4" />}
            />
            <FilterSelect
              label={t('filters.contract')}
              value={filters.contract}
              onChange={(v) => setFilters((s) => ({ ...s, contract: v }))}
              options={['', 'Full-time', 'Contract', 'Part-time']}
              icon={<BriefcaseIcon className="h-4 w-4" />}
            />
            <FilterSelect
              label={t('filters.function')}
              value={filters.func}
              onChange={(v) => setFilters((s) => ({ ...s, func: v }))}
              options={['', 'Engineering', 'Operations', 'Management']}
              icon={<CogIcon className="h-4 w-4" />}
            />
            <FilterSelect
              label={t('filters.workmode')}
              value={filters.remote}
              onChange={(v) => setFilters((s) => ({ ...s, remote: v }))}
              options={['', 'On-site', 'Remote', 'Hybrid']}
              icon={<GlobeIcon className="h-4 w-4" />}
            />
            <div className="pt-2 flex items-center justify-between">
              <span className="text-sm text-neutral-500">
                {t('filters.results', { count: items.length })}
              </span>
              <button onClick={clearFilters} className="text-sm text-blue-700 hover:underline">
                {t('filters.clear')}
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );

  function applySelected(sel: Job | null) {
    if (!sel) return;
    const cur = localStorage.getItem('ark_current');
    if (!cur) {
      alert(t('apply.needLogin'));
      return;
    }
    const apps = JSON.parse(localStorage.getItem('ark_apps') ?? '{}');
    const arr = apps[cur] ?? [];
    if (arr.find((a: any) => a.jobId === sel.id)) {
      alert(t('apply.dup'));
      return;
    }
    arr.push({ jobId: sel.id, date: new Date().toISOString().split('T')[0] });
    apps[cur] = arr;
    localStorage.setItem('ark_apps', JSON.stringify(apps));
    alert(t('apply.ok'));
  }
}

/* ---------------- UI helpers ---------------- */
function FilterCard({ children }: { children: React.ReactNode }) {
  const t = useTranslations('jobs');
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sticky top-24">
      <div className="mb-2 text-sm font-semibold text-neutral-900">{t('filters.title')}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function FilterInput({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  const t = useTranslations('jobs');
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">{icon}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400"
          placeholder={t('filters.placeholder', { label: label.toLowerCase() })}
        />
      </div>
    </label>
  );
}
function FilterSelect({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon?: React.ReactNode;
}) {
  const t = useTranslations('jobs');
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">{icon}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-400"
        >
          {options.map((o) => (
            <option key={o || 'all'} value={o}>
              {o || t('filters.all', { label })}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1">
      <span className="text-neutral-600">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}
function DetailPanel({
  job,
  onApply,
  onSave,
  saved,
  tns,
  formatPosted,
}: {
  job: Job | null;
  onApply: () => void;
  onSave: () => void;
  saved: boolean;
  tns: ReturnType<typeof useTranslations>;
  formatPosted: (iso: string) => string;
}) {
  if (!job) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500">
        {tns('detail.empty')}
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sticky top-24">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-amber-400 grid place-items-center overflow-hidden text-white text-sm font-bold">
          {job.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={job.company || 'logo'} src={job.logo} className="h-full w-full object-cover" />
          ) : (
            initials(job.company || 'AW')
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{job.title}</h2>
          <p className="text-sm text-neutral-600">
            {job.company || tns('common.company')} • {job.location}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Info label={tns('detail.industry')} value={job.industry} />
        <Info label={tns('detail.contract')} value={job.contract} />
        <Info label={tns('detail.function')} value={job.function} />
        <Info label={tns('detail.workmode')} value={job.remote} />
        <Info label={tns('detail.posted')} value={formatPosted(job.posted)} />
        <Info label={tns('detail.id')} value={String(job.id)} />
      </div>

      <p className="mt-4 text-sm text-neutral-700">{job.description}</p>

      <div className="mt-5 space-y-2">
        <button onClick={onApply} className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-white hover:opacity-90">
          {tns('detail.apply')}
        </button>
        <button
          onClick={onSave}
          className={`w-full rounded-xl px-4 py-2.5 ${
            saved ? 'bg-amber-500 text-white' : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
          }`}
        >
          {saved ? tns('common.saved') : tns('detail.saveJob')}
        </button>
      </div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-sm text-neutral-900 break-words">{value}</div>
    </div>
  );
}
function Drawer({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-[85%] max-w-xs bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 h-12">
          <div className="text-sm font-semibold">{title}</div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-3 space-y-3">{children}</div>
      </div>
    </div>
  );
}
function EmptyState({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-neutral-100 grid place-items-center">
          <SearchIcon className="h-6 w-6 text-neutral-600" />
        </div>
        <h3 className="font-semibold text-neutral-900">{t('empty.title')}</h3>
        <p className="mt-1 text-sm text-neutral-600">{t('empty.desc')}</p>
    </div>
  );
}

/* ------------ Icons ------------ */
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function PinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 22s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3l8 4-8 4-8-4 8-4z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 11l8 4 8-4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 15l8 4 8-4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function CogIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a7.97 7.97 0 000-6l-2.1.5a6 6 0 00-1.5-1.5l.5-2.1a8 8 0 00-6 0l.5 2.1a6 6 0 001.5-1.5l-2.1-.5a7.97 7.97 0 000 6l2.1-.5z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 6h16M6 12h12M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ------------ Utils ------------ */
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
