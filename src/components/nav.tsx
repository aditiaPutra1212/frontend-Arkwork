'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { api, API_BASE } from '@/lib/api';
import ArkLogo from '@/app/Images/Ungu__1_-removebg-preview.png';

const NAV_AVATAR_KEY_PREFIX = 'ark_nav_avatar:';

/* ========= Helpers ========= */
function toAbs(u?: string | null) {
  if (!u) return undefined;
  try {
    if (/^(https?:|data:|blob:)/i.test(u)) return u;
    if (u.startsWith('/_next')) return u;
    return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`;
  } catch {
    return u || undefined;
  }
}
function firstStr(...vals: unknown[]): string | undefined {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return undefined;
}
function findEmailDeep(obj: unknown, depth = 0): string | undefined {
  if (!obj || depth > 5) return undefined;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (typeof obj === 'string') return EMAIL.test(obj.trim()) ? obj.trim() : undefined;
  if (Array.isArray(obj)) {
    for (const it of obj) {
      const f = findEmailDeep(it, depth + 1);
      if (f) return f;
    }
    return undefined;
  }
  if (typeof obj === 'object' && obj) {
    const rec = obj as Record<string, unknown>;
    // prioritas jika key mengandung "email"
    for (const k of Object.keys(rec)) {
      const v = rec[k];
      if (typeof v === 'string' && /email/i.test(k) && EMAIL.test(v.trim())) return v.trim();
    }
    for (const k of Object.keys(rec)) {
      const f = findEmailDeep(rec[k], depth + 1);
      if (f) return f;
    }
  }
  return undefined;
}
function resolveEmployerEmail(user: any): string | null {
  if (!user?.employer) return user?.admin?.email ?? user?.email ?? null;
  const e = user.employer;
  const direct =
    firstStr(
      e.email,
      e.contactEmail,
      e.companyEmail,
      e.businessEmail,
      e.ownerEmail,
      e.hrEmail,
      e.adminEmail,
      e.user?.email,
      e.account?.email,
      e.profile?.email,
      e.owner?.email,
      e.contact?.email
    ) || findEmailDeep(e);
  return (direct || user?.admin?.email || user?.email || null) as string | null;
}

/** tipe lentur supaya tidak bentrok dgn UserLite */
type Employerish = {
  role?: string;
  email?: string | null;
  photoUrl?: string | null;
  admin?: { email?: string | null } | null;
  employer?: any;
};

export default function Nav() {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user, loading, signout } = useAuth();

  const hide = pathname?.startsWith('/admin') ?? false;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | undefined>(undefined);

  const U = (user ?? {}) as Employerish;
  const isEmployer = U.role === 'employer';
  const isLoggedIn = !!user;

  const displayName = useMemo(
    () =>
      (user?.name ??
        (U.employer?.displayName as string | undefined) ??
        t('user.fallback', { defaultMessage: 'User' })) as string,
    [user?.name, U.employer?.displayName, t]
  );

  // ✅ email employer: admin.email → user.email → deep scan employer
  const email: string | null = isEmployer
    ? (U.admin?.email ?? U.email ?? resolveEmployerEmail(U))
    : (U.email ?? null);

  const links = useMemo(
    () => [
      { href: '/', label: t('nav.home'), icon: HomeIcon },
      { href: '/jobs', label: t('nav.jobs'), icon: BriefcaseIcon },
      { href: '/tender', label: t('nav.tenders'), icon: FileTextIcon },
      { href: '/news', label: t('nav.news'), icon: NewspaperIcon },
      { href: '/about', label: t('nav.about'), icon: InfoIcon },
    ],
    [t]
  );
  const employerLinks = useMemo(
    () => [
      { href: '/employer/jobs/new', label: t('emp.postJob', { defaultMessage: 'Post a Job' }) },
      { href: '/employer/jobs', label: t('emp.manageJobs', { defaultMessage: 'Manage Jobs' }) },
      { href: '/employer/applications', label: t('emp.applications', { defaultMessage: 'Applications' }) },
      { href: '/employer/billing', label: t('emp.billing', { defaultMessage: 'Billing' }) },
      { href: '/employer/settings', label: t('emp.settings', { defaultMessage: 'Settings' }) },
    ],
    [t]
  );

  /* ===== Avatar priority ===== */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhotoURL(undefined);

      if (U.photoUrl) {
        if (!cancelled) setPhotoURL(toAbs(U.photoUrl));
        return;
      }

      if (U.role === 'employer' && U.employer?.id) {
        try {
          const prof: any = await api(
            `/api/employers/profile?employerId=${encodeURIComponent(U.employer.id)}`
          );
          const logo = toAbs(prof?.logoUrl);
          if (!cancelled && logo) {
            setPhotoURL(logo);
            return;
          }
        } catch {}
      }

      if (U.email) {
        const key = NAV_AVATAR_KEY_PREFIX + U.email;
        const cached = localStorage.getItem(key);
        if (!cancelled && cached) {
          setPhotoURL(toAbs(cached));
          return;
        }
        try {
          const raw = localStorage.getItem('ark_users') || '[]';
          const arr = JSON.parse(raw) as any[];
          const u = arr.find((x) => x.email === U.email);
          const legacy = toAbs(u?.profile?.photo?.dataUrl as string | undefined);
          if (!cancelled && legacy) {
            setPhotoURL(legacy);
            return;
          }
        } catch {}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [U.role, U.photoUrl, U.email, U.employer?.id]);

  // sync avatar cache
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!U.email) return;
      if (e.key === NAV_AVATAR_KEY_PREFIX + U.email) {
        setPhotoURL(toAbs(e.newValue || undefined));
      }
    };
    const onUpdated = () => {
      if (!U.email) return;
      const v = localStorage.getItem(NAV_AVATAR_KEY_PREFIX + U.email);
      setPhotoURL(toAbs(v || undefined));
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('ark:avatar-updated', onUpdated);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('ark:avatar-updated', onUpdated);
    };
  }, [U.email]);

  const switchLocale = () => {
    const next = locale === 'en' ? 'id' : 'en';
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
    router.refresh();
  };

  const handleSignout = async () => {
    await signout();
    setMenuOpen(false);
    router.replace('/auth/signin');
  };

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  if (hide) return null;

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200/60 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-neutral-950/60">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="ArkWork Home">
          <Image src={ArkLogo} alt="ArkWork" width={200} height={200} priority className="h-20 w-auto object-contain" />
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <NavLink key={l.href} href={l.href} active={active}>
                {l.label}
              </NavLink>
            );
          })}
        </div>

        {/* Right side (desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          {mounted && !loading && isEmployer && (
            <>
              <Link href="/employer/jobs/new" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                {t('emp.postJob', { defaultMessage: 'Post a Job' })}
              </Link>
              <Link href="/employer/applications" className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50">
                {t('emp.applications', { defaultMessage: 'Applications' })}
              </Link>
            </>
          )}

          <button
            onClick={switchLocale}
            aria-label={t('lang.switch', { defaultMessage: 'Switch language' })}
            title={t('lang.switch', { defaultMessage: 'Switch language' })}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            <GlobeIcon className="h-4 w-4" />
            <span className="font-semibold">{locale === 'en' ? 'EN' : 'ID'}</span>
          </button>

          {!mounted || loading ? (
            <div className="h-9 w-28 rounded-xl bg-neutral-200 animate-pulse dark:bg-neutral-800" />
          ) : !isLoggedIn ? (
            <>
              <Link href="/auth/signin" className="inline-flex items-center rounded-xl border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
                {t('auth.signIn', { defaultMessage: 'Masuk' })}
              </Link>
              <Link href="/auth/signup_perusahaan" className="inline-flex items-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                {t('auth.signUp', { defaultMessage: 'Daftar' })}
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                id="avatarBtn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-2xl border border-neutral-200 px-2 py-1.5 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
              >
                <Avatar src={photoURL} alt={displayName} size={32} />
                <div className="hidden sm:flex flex-col max-w-[180px] text-left">
                  <span className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">{displayName}</span>
                 
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-neutral-500 transition ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              <div
                id="avatarMenu"
                role="menu"
                aria-hidden={!menuOpen}
                className={[
                  'absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950',
                  menuOpen ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-1',
                  'transition-all duration-150',
                ].join(' ')}
              >
                <div className="px-3 py-3 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <Avatar src={photoURL} alt={displayName} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{displayName}</p>
                      {!!email && <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{email}</p>}
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <MenuItem href={isEmployer ? '/profile_employer' : '/profile'} onClick={() => setMenuOpen(false)}>
                    <UserIcon className="h-4 w-4" />
                    <span>{t('user.profile', { defaultMessage: 'Profile' })}</span>
                  </MenuItem>

                  <MenuItem href={isEmployer ? '/employer' : '/dashboard'} onClick={() => setMenuOpen(false)}>
                    <GridIcon className="h-4 w-4" />
                    <span>
                      {isEmployer
                        ? t('emp.dashboard', { defaultMessage: 'Employer Dashboard' })
                        : t('user.dashboard', { defaultMessage: 'Dashboard' })}

                    </span>
                  </MenuItem>

                  {isEmployer && (
                    <>
                      <hr className="my-1 border-neutral-200 dark:border-neutral-800" />
                      {employerLinks.map((i) => (
                        <MenuItem key={i.href} href={i.href} onClick={() => setMenuOpen(false)}>
                          <span className="ml-0.5">{i.label}</span>
                        </MenuItem>
                      ))}
                    </>
                  )}

                  <hr className="my-1 border-neutral-200 dark:border-neutral-800" />
                  <button
                    role="menuitem"
                    onClick={async () => {
                      await handleSignout();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-neutral-900"
                  >
                    <LogoutIcon className="h-4 w-4" />
                    <span>{t('user.logout', { defaultMessage: 'Sign out' })}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile trigger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 text-neutral-700 hover:bg-neutral-50 active:translate-y-[1px] md:hidden dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-[60] w-[86%] max-w-sm transform transition-transform duration-250 ease-out md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
      >
        <div className="relative m-3 ms-auto h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <Image src={ArkLogo} alt="ArkWork" width={120} height={120} priority className="h-10 w-auto object-contain md:h-12" />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex h-[calc(100%-7.5rem)] flex-col">
            <nav className="flex-1 overflow-y-auto px-3 py-2">
              <ul className="space-y-1">
                {links.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className={[
                          'flex items-center gap-3 rounded-xl px-3 py-3 text-[15px]',
                          active
                            ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white'
                            : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900',
                        ].join(' ')}
                      >
                        <Icon className="h-5 w-5 opacity-90" />
                        <span>{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <hr className="my-4 border-neutral-200 dark:border-neutral-800" />

              {!mounted || loading ? (
                <div className="h-10 w-full rounded-xl bg-neutral-200 animate-pulse dark:bg-neutral-800" />
              ) : !isLoggedIn ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/auth/signin" onClick={() => setOpen(false)} className="rounded-xl border border-blue-600 px-3 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-50">
                    {t('auth.signIn', { defaultMessage: 'Masuk' })}
                  </Link>
                  <Link href="/auth/signup_perusahaan" onClick={() => setOpen(false)} className="rounded-xl bg-amber-500 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-amber-600">
                    {t('auth.signUp', { defaultMessage: 'Daftar' })}
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {isEmployer && (
                    <>
                      <Link href="/employer/jobs/new" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-center text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900">
                        {t('emp.postJob', { defaultMessage: 'Post a Job' })}
                      </Link>
                      <Link href="/employer/applications" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-center text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900">
                        {t('emp.applications', { defaultMessage: 'Applications' })}
                      </Link>
                    </>
                  )}
                  <button
                    onClick={async () => {
                      await handleSignout();
                      setOpen(false);
                    }}
                    className="block w-full rounded-xl border border-red-600 px-3 py-2 text-center text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    {t('user.logout', { defaultMessage: 'Sign out' })}
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </aside>
    </nav>
  );
}

/* ===== small pieces ===== */
function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={[
        'rounded-xl px-3 py-2 text-sm transition',
        active
          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
          : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

function Avatar({ src, alt, size = 32 }: { src?: string; alt: string; size?: number }) {
  const [ok, setOk] = useState(true);
  const final = toAbs(src);
  if (final && ok) {
    return (
      <img
        src={final}
        alt={alt}
        width={size}
        height={size}
        className="h-8 w-8 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
        onError={() => setOk(false)}
      />
    );
  }
  const initial = (alt || 'U').trim().charAt(0).toUpperCase();
  return (
    <div
      aria-hidden
      style={{ width: size, height: size }}
      className="grid place-items-center rounded-full bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
    >
      <span className="text-sm font-semibold">{initial}</span>
    </div>
  );
}

function MenuItem({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link role="menuitem" href={href} onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900">
      {children}
    </Link>
  );
}

/* ===== icons sederhana (aman TSX) ===== */
function HomeIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}
function BriefcaseIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth={2} />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}
function FileTextIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth={2} />
      <path d="M14 2v6h6M8 9h3M8 13h8M8 17h6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
function NewspaperIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth={2} />
      <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
function InfoIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
      <path d="M12 16v-5M12 8h.01" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
function ChevronDownIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 3-9 6v1h18v-1c0-3-4-6-9-6Z" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}
function GridIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth={2} />
      <rect x="13" y="3" width="8" height="8" stroke="currentColor" strokeWidth={2} />
      <rect x="3" y="13" width="8" height="8" stroke="currentColor" strokeWidth={2} />
      <rect x="13" y="13" width="8" height="8" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}
function LogoutIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M15 17l5-5-5-5M20 12H9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}
function GlobeIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
      <path d="M3 12h18M12 3a12 12 0 0 0 0 18M12 3a12 12 0 0 1 0 18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
