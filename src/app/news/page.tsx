'use client';

import {useEffect, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {fetchEnergyNews, type EnergyNewsItem} from '@/lib/api';

export default function NewsPage() {
  const t = useTranslations('news');
  const locale = useLocale();

  const [items, setItems] = useState<EnergyNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [scope, setScope] = useState<'id' | 'global' | 'both'>('id');
  const [limit, setLimit] = useState(15);
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [country, setCountry] = useState<'ID' | 'US'>('ID');
  const [keywords, setKeywords] = useState('');
  const [quick, setQuick] = useState(''); // UI-only quick filter

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, {year: 'numeric', month: 'short', day: '2-digit'}),
    [locale]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEnergyNews({scope, limit, lang, country, keywords});
      setItems(data.items);
    } catch (e: any) {
      setError(e?.message ?? t('error.load'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* initial fetch */ }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    const k = quick.trim().toLowerCase();
    if (!k) return items;
    return items.filter(it =>
      (it.title ?? '').toLowerCase().includes(k) ||
      (it.source ?? '').toLowerCase().includes(k)
    );
  }, [items, quick]);

  const getDomain = (url?: string) => {
    try {
      if (!url) return '';
      const u = new URL(url);
      return u.hostname.replace(/^www\./, '');
    } catch { return ''; }
  };

  const summarize = (it: EnergyNewsItem) =>
    (it.summary || it.description || '').replace(/\s+/g, ' ').trim();

  const fmtDate = (s?: string) => {
    if (!s) return '';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : dateFmt.format(d);
    // kalau mau jam juga: { ... hour:'2-digit', minute:'2-digit' }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-brand-blue">
          {t('title')}
        </h1>

        {/* Controls */}
        <div className="mb-6 grid gap-3 rounded-lg bg-white p-4 shadow md:grid-cols-6 md:gap-4 md:p-6">
          <select
            className="rounded-lg border px-3 py-2 focus:border-brand-blue focus:outline-none"
            value={scope}
            onChange={e => setScope(e.target.value as any)}
          >
            <option value="id">{t('scope.id')}</option>
            <option value="global">{t('scope.global')}</option>
            <option value="both">{t('scope.both')}</option>
          </select>

          <select
            className="rounded-lg border px-3 py-2 focus:border-brand-blue focus:outline-none"
            value={lang}
            onChange={e => setLang(e.target.value as 'id'|'en')}
          >
            <option value="id">{t('lang.id')}</option>
            <option value="en">{t('lang.en')}</option>
          </select>

          <select
            className="rounded-lg border px-3 py-2 focus:border-brand-blue focus:outline-none"
            value={country}
            onChange={e => setCountry(e.target.value as 'ID'|'US')}
          >
            <option value="ID">{t('country.id')}</option>
            <option value="US">{t('country.us')}</option>
          </select>

          <select
            className="rounded-lg border px-3 py-2 focus:border-brand-blue focus:outline-none"
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
          >
            {[10,15,20,30,50].map(n => (
              <option key={n} value={n}>{t('limit.n', {n})}</option>
            ))}
          </select>

          <input
            placeholder={t('keywords.placeholder')}
            className="rounded-lg border px-3 py-2 focus:border-brand-blue focus:outline-none"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
          />

          <button
            onClick={load}
            className="rounded-lg bg-brand-blue px-4 py-2 text-white hover:bg-brand-blue-light disabled:opacity-60"
            disabled={loading}
          >
            {loading ? t('btn.loading') : t('btn.fetch')}
          </button>

          <input
            placeholder={t('quick.placeholder')}
            className="md:col-span-3 rounded-lg border px-3 py-2 focus:border-brand-blue focus:outline-none"
            value={quick}
            onChange={e => setQuick(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {/* List */}
        <section className="rounded-xl bg-white shadow">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-brand-blue" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M14 3v2h3.59L7 15.59 8.41 17 19 6.41V10h2V3zM5 5h6V3H3v8h2z"/><path d="M19 19H5V8H3v13h18V10h-2z"/>
              </svg>
              <span className="font-semibold">{t('latest')}</span>
            </div>
            {quick && (
              <button onClick={() => setQuick('')} className="text-sm text-brand-blue hover:underline">
                {t('quick.clear')}
              </button>
            )}
          </div>

          {loading && (
            <div className="space-y-3 p-5">
              {[...Array(5)].map((_,i)=>(
                <div key={i} className="animate-pulse space-y-2 border-b pb-4 last:border-none">
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-100" />
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.map((it, i) => (
            <article key={`${it.link}-${i}`} className="border-b px-5 py-5 last:border-none md:px-6">
              {/* Title + source badge */}
              <div className="flex items-start justify-between gap-3">
                <a href={it.link} target="_blank" rel="noreferrer" className="hover:underline">
                  <h3 className="text-base font-semibold text-gray-900 md:text-lg">
                    {it.title}
                  </h3>
                </a>
                <span className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs text-gray-700">
                  {it.source || getDomain(it.link) || t('source.unknown')}
                </span>
              </div>

              {/* Summary */}
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {summarize(it) || '…'}
              </p>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between text-sm">
                <time className="text-gray-500">{fmtDate(it.pubDate)}</time>
                <a
                  href={it.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-brand-blue hover:underline"
                >
                  {t('readMore')}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z"/><path d="M5 5h6V3H3v8h2z"/>
                  </svg>
                </a>
              </div>
            </article>
          ))}
        </section>

        {!loading && !error && filtered.length === 0 && (
          <p className="mt-10 text-center text-gray-500">{t('empty')}</p>
        )}
      </div>
    </div>
  );
}
