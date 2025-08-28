'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { api, apiForm, API_BASE } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

/* ====================== Types ====================== */
type Job = {
  id: string | number;
  title: string;
  location: string;
  type: string;
  postedAt: string;
};

type MeResp = {
  ok: boolean;
  role: 'employer';
  admin: { id: string; email: string | null; fullName?: string | null; isOwner?: boolean };
  employer: {
    id: string;
    slug: string;
    displayName?: string | null;
    legalName?: string | null;
    website?: string | null;
  } | null;
};

type ProfileResp = {
  about?: string | null;
  hqCity?: string | null;
  hqCountry?: string | null;
  logoUrl?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  bannerUrl?: string | null;
  industry?: string | null;
  size?: string | null;
  foundedYear?: number | null;
};

/* ====================== Helpers ====================== */
function normalizeUrl(input?: string | null): string | '' {
  const v = (input ?? '').trim();
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}
function toAbs(u?: string | null) {
  if (!u) return '';
  try {
    return new URL(u).toString();
  } catch {
    return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`;
  }
}

/* ====================== Page ====================== */
export default function ProfileEmployerPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employerId, setEmployerId] = useState<string>('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');

  const [about, setAbout] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  const [social, setSocial] = useState({
    instagram: '',
    linkedin: '',
    twitter: '',
    websitePublic: '',
    facebook: '',
    youtube: '',
  });

  const [jobs, setJobs] = useState<Job[]>([]);

  // ====== Load data: me -> profile
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // ✅ balik pakai endpoint auth yang pasti authorized + kirim email admin
        const me = await api<MeResp>('/api/employers/auth/me');
        if (!alive) return;

        const emp = me.employer;
        const eid = emp?.id || '';
        setEmployerId(eid);
        setCompanyEmail(me.admin?.email || user?.email || '');
        setCompanyName((emp?.displayName || emp?.legalName || '').trim());
        setWebsite(emp?.website || '');

        if (eid) {
          const prof = await api<ProfileResp>(
            `/api/employers/profile?employerId=${encodeURIComponent(eid)}`
          );
          if (!alive) return;
          setAbout(prof?.about || '');
          setCity(prof?.hqCity || '');
          setLogoUrl(prof?.logoUrl || undefined);
          setSocial((prev) => ({
            ...prev,
            instagram: prof?.instagram || '',
            linkedin: prof?.linkedin || '',
            twitter: prof?.twitter || '',
          }));
        }

        // dummy jobs
        setJobs([
          { id: 1, title: 'Senior Frontend Engineer', location: 'Jakarta', type: 'Full-time', postedAt: new Date().toISOString() },
          { id: 2, title: 'Product Designer (UI/UX)', location: 'Remote (ID)', type: 'Full-time', postedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
          { id: 3, title: 'Recruiter / TA Specialist', location: 'Bandung', type: 'Contract', postedAt: new Date(Date.now() - 86400000 * 12).toISOString() },
        ]);
      } catch (e) {
        console.error('[profile] load failed:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.email]);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'short', day: '2-digit' }),
    []
  );

  const fileRef = useRef<HTMLInputElement | null>(null);

  // ====== Upload logo
  async function handleSelectFile(file: File) {
    if (!file || !file.type.startsWith('image/')) return;
    if (!employerId) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      return;
    }
    setLogoUrl(URL.createObjectURL(file));

    try {
      const fd = new FormData();
      fd.append('employerId', employerId);
      fd.append('file', file);
      const resp = await apiForm<{ ok: boolean; url: string }>('/api/employers/profile/logo', fd);
      if (resp?.url) {
        setLogoUrl(resp.url);
        try {
          if (user?.email) {
            localStorage.setItem(`ark_nav_avatar:${user.email}`, toAbs(resp.url));
            window.dispatchEvent(new Event('ark:avatar-updated'));
          }
        } catch {}
      }
    } catch (err) {
      console.error('upload logo error:', err);
      alert('Gagal upload logo');
    }
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void handleSelectFile(f);
  }

  // ====== Simpan
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      if (!employerId) throw new Error('Missing employerId');

      await api('/api/employers/step2', {
        method: 'POST',
        json: {
          employerId,
          about: about || undefined,
          hqCity: city || undefined,
          linkedin: normalizeUrl(social.linkedin) || undefined,
          instagram: normalizeUrl(social.instagram) || undefined,
          twitter: normalizeUrl(social.twitter) || undefined,
        } as any,
      });

      const normalizedSite = normalizeUrl(website);
      await api('/api/employers/update-basic', {
        method: 'POST',
        json: {
          employerId,
          displayName: companyName?.trim() || undefined,
          website: normalizedSite || null,
        } as any,
      });

      alert('Profil disimpan.');
    } catch (err) {
      console.error('save profile error:', err);
      alert('Validation error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="h-6 w-56 rounded bg-slate-200 animate-pulse dark:bg-slate-800" />
          <div className="mt-2 h-4 w-96 rounded bg-slate-200 animate-pulse dark:bg-slate-800" />
        </div>
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-40 rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Profil Perusahaan
        </h1>
        <p className="mb-8 max-w-2xl text-base text-slate-600 dark:text-slate-300">
          Lengkapi informasi perusahaan Anda agar terlihat lebih profesional bagi calon kandidat.
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* LEFT */}
          <section className="space-y-8 lg:col-span-2">
            <Card title="Logo Perusahaan">
              <div className="flex items-center gap-6">
                <div className="relative overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700">
                  <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800 grid place-items-center">
                    {logoUrl ? (
                      <img src={toAbs(logoUrl)} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-500">No logo</span>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="logo-input"
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="group block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-4 text-center text-sm text-slate-600 transition hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  >
                    <div className="mb-1 font-medium">Unggah Logo</div>
                    <div className="text-xs text-slate-500">
                      Seret & lepas berkas ke sini atau klik untuk memilih
                    </div>
                  </label>
                  <input
                    id="logo-input"
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleSelectFile(f);
                    }}
                  />
                  <p className="mt-2 text-xs text-slate-500">PNG/JPG, rasio 1:1, max ~2MB.</p>
                </div>
              </div>
            </Card>

            <Card title="Informasi Utama">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nama Perusahaan">
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="ui-input"
                    placeholder="e.g. ArkWork Indonesia, Inc."
                  />
                </Field>
                <Field label="Email Perusahaan (admin)">
                  <input
                    value={companyEmail}
                    readOnly
                    className="ui-input bg-slate-50 dark:bg-slate-800/40"
                    placeholder="hr@company.com"
                  />
                </Field>
                <Field label="Website (opsional)">
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="ui-input"
                    placeholder="company.com"
                  />
                </Field>
                <Field className="sm:col-span-2" label="Tentang Perusahaan">
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="ui-input min-h-[120px]"
                    placeholder="Visi, misi, budaya kerja, dsb."
                  />
                </Field>
              </div>
            </Card>

            <Card title="Alamat Kantor">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Alamat">
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="ui-input min-h-[80px]"
                    placeholder="Jalan, nomor, dll."
                  />
                </Field>
                <Field label="Kota / Kabupaten">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="ui-input"
                    placeholder="Jakarta Selatan"
                  />
                </Field>
              </div>
            </Card>

            <Card title="Sosial Media">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="LinkedIn">
                  <input
                    value={social.linkedin}
                    onChange={(e) => setSocial({ ...social, linkedin: e.target.value })}
                    className="ui-input"
                    placeholder="linkedin.com/company/..."
                  />
                </Field>
                <Field label="Instagram">
                  <input
                    value={social.instagram}
                    onChange={(e) => setSocial({ ...social, instagram: e.target.value })}
                    className="ui-input"
                    placeholder="instagram.com/..."
                  />
                </Field>
                <Field label="Twitter/X">
                  <input
                    value={social.twitter}
                    onChange={(e) => setSocial({ ...social, twitter: e.target.value })}
                    className="ui-input"
                    placeholder="x.com/..."
                  />
                </Field>
                <Field label="Website (Publik)">
                  <input
                    value={social.websitePublic}
                    onChange={(e) => setSocial({ ...social, websitePublic: e.target.value })}
                    className="ui-input"
                    placeholder="https://company.com"
                  />
                </Field>
                <Field label="Facebook">
                  <input
                    value={social.facebook}
                    onChange={(e) => setSocial({ ...social, facebook: e.target.value })}
                    className="ui-input"
                    placeholder="facebook.com/..."
                  />
                </Field>
                <Field label="Youtube">
                  <input
                    value={social.youtube}
                    onChange={(e) => setSocial({ ...social, youtube: e.target.value })}
                    className="ui-input"
                    placeholder="youtube.com/@..."
                  />
                </Field>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Link href="/auth/signup" className="btn-secondary">
                Kembali
              </Link>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary">
                  Simpan Draft
                </button>
                <ButtonPrimary type="submit" loading={saving}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V7l4-4h9l4 4v12a2 2 0 0 1-2 2Z" />
                    <path d="M9 21v-8h6v8M9 3v4h6V3" />
                  </svg>
                  {saving ? 'Menyimpan…' : 'Simpan Profil'}
                </ButtonPrimary>
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <aside className="space-y-6">
            <Card title="Lowongan yang Diposting" action={<Link href="/jobs/new" className="btn-chip">+ Posting</Link>}>
              {jobs.length === 0 ? (
                <Empty text="Belum ada lowongan diposting." />
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {jobs.map((j) => (
                    <li key={j.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{j.title}</p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {j.type} • {j.location} • {dateFmt.format(new Date(j.postedAt))}
                          </p>
                        </div>
                        <Link href={`/jobs/${j.id}`} className="btn-link">Detail →</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Tip: Email admin bersifat khusus akun dan tidak bisa diubah dari halaman ini.
                Hubungi dukungan atau menu Pengaturan Akun untuk mengganti email.
              </p>
            </Card>
          </aside>
        </form>
      </main>
    </div>
  );
}

/* ====================== Small Comps ====================== */
function Card({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800/60 dark:bg-slate-900/60">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ''}`}>
      <div className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div>
      {children}
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-slate-500 dark:border-slate-700">{text}</div>;
}

/* ===== Buttons ===== */
function ButtonPrimary({
  children,
  loading,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={[
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm',
        'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
        'disabled:opacity-70 disabled:cursor-not-allowed',
      ].join(' ')}
    >
      {loading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" className="opacity-25" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      )}
      {children}
    </button>
  );
}
