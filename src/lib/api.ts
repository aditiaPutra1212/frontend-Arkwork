// frontend/src/lib/api.ts

/* ====================== Base URL ====================== */
const RAW_BASE =
  (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000').trim();

// hapus trailing slash supaya join URL konsisten
export const API_BASE = RAW_BASE.replace(/\/+$/, '');

/* ====================== Types ====================== */
type ApiOpts = RequestInit & {
  /** Jika diisi, otomatis method POST (kecuali diset manual) dan body = JSON.stringify(json) */
  json?: any;
  /** Kalau false atau server 204, fungsi return null */
  expectJson?: boolean; // default: true
};

/* ====================== Helpers ====================== */
function buildUrl(path: string) {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path; // sudah absolut
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

function getEmployerId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('ark_employer_id');
  } catch {
    return null;
  }
}

/** Ubah array Zod issues → string yang enak dibaca */
function zodIssuesToMessage(issues: any[]): string {
  try {
    if (!Array.isArray(issues) || !issues.length) return 'Validation error';
    const msgs = issues.map((i) => {
      const path = (i?.path || []).join('.') || '(root)';
      const msg = i?.message || 'invalid';
      return `${path}: ${msg}`;
    });
    return msgs.join('; ');
  } catch {
    return 'Validation error';
  }
}

/* Baca pesan error dari response */
async function readErrorMessage(res: Response) {
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data: any = await res.json().catch(() => ({}));
      if (Array.isArray(data?.details)) {
        return zodIssuesToMessage(data.details);
      }
      return data?.message || data?.error || `HTTP ${res.status}`;
    }
    const text = await res.text();
    return text || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/* ====================== Main fetch wrapper ====================== */
/**
 * Contoh:
 *   await api('/admin/signin', { json: { username, password } })
 *   const me = await api('/admin/me')
 */
export async function api<T = any>(path: string, opts: ApiOpts = {}): Promise<T> {
  const { json, headers, expectJson = true, ...rest } = opts;

  const h = new Headers(headers || {});
  const sendingFormData = rest.body instanceof FormData;
  const willSendJson = json !== undefined && !sendingFormData;

  // sisipkan employerId bila ada (fallback auth via header)
  const eid = getEmployerId();
  if (eid && !h.has('x-employer-id')) h.set('x-employer-id', eid);

  if (willSendJson && !h.has('Content-Type')) h.set('Content-Type', 'application/json');

  // PENTING: letakkan ...rest lebih dulu, lalu KUNCI nilai wajib agar tidak ter-override
  const init: RequestInit = {
    ...rest,                          // caller options (boleh, tapi tidak boleh override yg wajib)
    headers: h,
    mode: 'cors',
    cache: 'no-store',
    credentials: 'include',           // 🔒 selalu bawa cookie
    ...(willSendJson ? { method: rest.method ?? 'POST', body: JSON.stringify(json) } : {}),
  };

  const url = buildUrl(path);
  const res = await fetch(url, init);

  if (!res.ok) {
    throw new Error(`[${res.status}] ${url} ${await readErrorMessage(res)}`);
  }

  if (res.status === 204 || !expectJson) {
    // @ts-expect-error: supaya bisa return null saat expectJson=false
    return null;
  }

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return (await res.text()) as unknown as T;
  }

  return (await res.json()) as T;
}

/* =================== Helper FormData / Upload =================== */
export async function apiForm<T = any>(
  path: string,
  form: FormData,
  opts: RequestInit = {}
): Promise<T> {
  const h = new Headers(opts.headers || {});
  const eid = getEmployerId();
  if (eid && !h.has('x-employer-id')) h.set('x-employer-id', eid);

  const url = buildUrl(path);

  // Sama seperti di atas: ...opts dulu, lalu kunci nilai wajib
  const res = await fetch(url, {
    ...opts,
    method: 'POST',
    body: form,
    mode: 'cors',
    cache: 'no-store',
    credentials: 'include',        // 🔒 jangan sampai di-override
    headers: h,                    // JANGAN set Content-Type manual utk FormData
  });

  if (!res.ok) {
    throw new Error(`[${res.status}] ${url} ${await readErrorMessage(res)}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    // @ts-expect-error
    return null;
  }
  return (await res.json()) as T;
}

/* ================== Energy News (Google News RSS → rss2json) ================= */

export type Scope = 'id' | 'global' | 'both';

export interface FetchEnergyNewsParams {
  scope: Scope;
  limit: number;
  lang: string;
  country: string;
  keywords?: string;
}

export interface EnergyNewsItem {
  title: string;
  link: string;
  pubDate?: string;
  source?: string;
  description?: string;
  summary?: string;
  image?: string | null;
}

export interface EnergyNewsResponse {
  items: EnergyNewsItem[];
}

// Utils
function stripHtml(input?: string): string {
  if (!input) return '';
  return input.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
function getDomain(url?: string): string {
  try {
    if (!url) return '';
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function buildGoogleNewsRssUrl(params: { q: string; lang: string; country: string }) {
  const { q, lang, country } = params;
  const hl = `${lang}-${country}`;
  const ceid = `${country}:${lang}`;
  const usp = new URLSearchParams({ q, hl, gl: country, ceid });
  return `https://news.google.com/rss/search?${usp.toString()}`;
}

async function fetchRssAsJson(rssUrl: string) {
  const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(rss2jsonUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<{
    items: Array<{
      title: string;
      link: string;
      pubDate?: string;
      author?: string;
      description?: string;
      content?: string;
      enclosure?: { link?: string };
    }>;
  }>;
}

function buildQuery(baseKeywords?: string) {
  const defaults = [
    'oil',
    'gas',
    'energy',
    'petroleum',
    'geothermal',
    'renewable',
    'minyak',
    'energi',
    'migas',
  ];
  const extra = (baseKeywords || '').split(',').map((s) => s.trim()).filter(Boolean);
  const all = Array.from(new Set([...defaults, ...extra]));
  return all.map((k) => `"${k}"`).join(' OR ');
}

function extractImageFromHtml(html?: string): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] || null;
}

function mapItem(it: any): EnergyNewsItem {
  const desc = stripHtml(it.description || it.content || '');
  const image =
    it?.enclosure?.link && /^https?:\/\//i.test(it.enclosure.link)
      ? it.enclosure.link
      : extractImageFromHtml(it.description || it.content) || null;

  return {
    title: it.title,
    link: it.link,
    pubDate: it.pubDate,
    source: it.author || getDomain(it.link),
    description: desc,
    summary: desc,
    image,
  };
}

export async function fetchEnergyNews(params: FetchEnergyNewsParams): Promise<EnergyNewsResponse> {
  const { scope, limit, lang, country, keywords } = params;
  const q = buildQuery(keywords);

  const urls: string[] = [];
  if (scope === 'id' || scope === 'both') urls.push(buildGoogleNewsRssUrl({ q, lang: 'id', country: 'ID' }));
  if (scope === 'global' || scope === 'both') urls.push(buildGoogleNewsRssUrl({ q, lang: 'en', country: 'US' }));
  if (
    scope !== 'both' &&
    !((scope === 'id' && lang === 'id' && country === 'ID') || (scope === 'global' && lang === 'en' && country === 'US'))
  ) {
    urls.length = 0;
    urls.push(buildGoogleNewsRssUrl({ q, lang, country }));
  }

  const results = await Promise.allSettled(urls.map((u) => fetchRssAsJson(u)));
  const items: EnergyNewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const it of r.value.items ?? []) items.push(mapItem(it));
    }
  }

  // de-dupe berdasarkan link/title
  const seen = new Set<string>();
  const deduped = items.filter((it) => {
    const key = it.link || it.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // sort by pubDate desc
  deduped.sort(
    (a, b) => +(b.pubDate ? new Date(b.pubDate) : 0) - +(a.pubDate ? new Date(a.pubDate) : 0)
  );

  return { items: deduped.slice(0, Math.max(1, limit)) };
}
