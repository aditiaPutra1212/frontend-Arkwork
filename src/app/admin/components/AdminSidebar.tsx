'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminSidebar() {
  const currentPath = usePathname() ?? '';
  const router = useRouter();
  const { signout, user } = useAuth();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => setOpen(false), [currentPath]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? 'hidden' : prev || '';
    return () => { document.body.style.overflow = prev || ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleOpenMenu = useCallback(() => setOpen(true), []);
  const handleCloseMenu = useCallback(() => setOpen(false), []);

  const handleLogout = useCallback(async () => {
    try {
      setBusy(true);
      await signout();
      router.replace('/auth/signin');
      router.refresh();
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      setBusy(false);
    }
  }, [router, signout]);

  const menu = useMemo(() => ([
    { name: 'Dashboard', path: '/admin', icon: HomeIcon },
    { name: 'Tenders Management', path: '/admin/tenders', icon: LayersIcon },
    { name: 'User Management', path: '/admin/users', icon: UsersIcon },
    { name: 'Monetisasi (Plans)', path: '/admin/monet', icon: MoneyIcon },
    { name: 'Payments (Midtrans)', path: '/admin/payments', icon: CreditCardIcon },
  ]), []);

  const isActive = (path: string) =>
    path === '/admin' ? currentPath === path : currentPath === path || currentPath.startsWith(path + '/');

  function Item({ name, path, Icon }: { name: string; path: string; Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element }) {
    const active = isActive(path);
    return (
      <li>
        <Link
          href={path}
          aria-current={active ? 'page' : undefined}
          className={[
            'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
            'ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60',
            active
              ? 'bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
              : 'text-white/85 hover:bg-white/8 hover:text-white',
          ].join(' ')}
        >
          <span
            className={[
              'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full',
              active ? 'bg-amber-400' : 'bg-transparent group-hover:bg-white/20',
            ].join(' ')}
          />
          <Icon className="h-5 w-5 opacity-95" />
          <span className="truncate">{name}</span>
        </Link>
      </li>
    );
  }

  const Desktop = (
    <aside
      aria-label="Admin navigation"
      className={[
        'hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-white/10',
        'bg-[radial-gradient(1200px_600px_at_-200px_-200px,#1e3a8a_0%,#0b1736_40%,#0a1228_100%)] text-white',
        'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-72',
      ].join(' ')}
    >
      <div className="flex h-16 items-center px-3 border-b border-white/10/50">
        <button
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 hover:bg-white/5 active:scale-95 transition"
        >
          <SparkIcon className="h-5 w-5 text-white" />
        </button>
        {!collapsed && (
          <div className="ml-3 leading-tight">
            <div className="text-sm font-semibold">Admin Panel</div>
            <div className="text-xs text-white/70">ArkWork CMS</div>
          </div>
        )}
      </div>

      <nav className="mt-2 flex-1 overflow-y-auto px-2">
        <p className={[
          'px-3 text-[10px] uppercase tracking-wider text-white/50 mb-2',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100',
        ].join(' ')}>
          Main
        </p>
        <ul className="space-y-1" role="list">
          {menu.map(({ name, path, icon: Icon }) => (
            <Item key={path} name={name} path={path} Icon={Icon} />
          ))}

          {/* Logout (desktop) */}
          <li>
            <button
              onClick={handleLogout}
              disabled={busy}
              className={[
                'group relative w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition text-left',
                'text-red-100 hover:bg-red-500/10 hover:text-white ring-0 focus-visible:ring-2 focus-visible:ring-red-400/60 disabled:opacity-60',
              ].join(' ')}
            >
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-transparent group-hover:bg-red-400" />
              <LogoutIcon className="h-5 w-5" />
              {!collapsed && <span className="truncate">{busy ? 'Logging out…' : 'Logout'}</span>}
            </button>
          </li>
        </ul>
      </nav>

      <div className="mt-auto border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-white/10 grid place-items-center ring-1 ring-white/10">
            <UsersIcon className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="text-xs font-semibold">Administrator</div>
              <div className="text-[11px] text-white/60 truncate">{user?.email ?? 'admin@arkwork.local'}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              disabled={busy}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs hover:bg-white/10 active:scale-95 transition disabled:opacity-60"
              aria-label="Logout"
            >
              <LogoutIcon className="h-3.5 w-3.5" />
              <span>{busy ? 'Logging…' : 'Logout'}</span>
            </button>
          )}
        </div>
        <div className={['mt-3 text-[11px] text-white/60', collapsed ? 'text-center' : ''].join(' ')}>
          © {new Date().getFullYear()} ArkWork Admin
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="h-14 flex items-center justify-between px-3">
          <button
            onClick={handleOpenMenu}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 text-neutral-700 active:scale-95"
          >
            <BurgerIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-blue-600 grid place-items-center shadow-sm">
              <SparkIcon className="h-4 w-4 text-white" />
            </div>
            <div className="text-sm font-semibold">Admin Panel</div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          onClick={handleCloseMenu}
          className="fixed inset-0 z-50 md:hidden bg-black/40"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Admin menu drawer"
        className={[
          'fixed inset-y-0 left-0 z-50 w-[85%] max-w-[18rem] md:hidden',
          'transform transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ visibility: open ? 'visible' : 'hidden' }}
      >
        <div className="flex h-full flex-col bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 text-white shadow-2xl">
          <div className="flex h-14 items-center justify-between px-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-white/10 grid place-items-center">
                <SparkIcon className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm font-semibold">Admin Panel</div>
            </div>
            <button
              onClick={handleCloseMenu}
              aria-label="Close menu"
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 active:scale-95"
            >
              <CloseIcon className="h-5 w-5 text-white/90" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2">
            <ul className="space-y-1" role="list">
              {menu.map(({ name, path, icon: Icon }) => (
                <li key={path}>
                  <Link
                    href={path}
                    aria-current={isActive(path) ? 'page' : undefined}
                    className={[
                      'group relative flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition',
                      isActive(path) ? 'bg-white/10 text-white' : 'text-white/85 hover:bg-white/8 hover:text-white',
                    ].join(' ')}
                    onClick={() => setOpen(false)}
                  >
                    <span
                      className={[
                        'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full',
                        isActive(path) ? 'bg-amber-400' : 'bg-transparent',
                      ].join(' ')}
                    />
                    <Icon className="h-5 w-5" />
                    <span className="truncate">{name}</span>
                  </Link>
                </li>
              ))}
              {/* Logout mobile */}
              <li>
                <button
                  onClick={async () => { await handleLogout(); setOpen(false); }}
                  disabled={busy}
                  className="group relative w-full flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition text-left text-red-100 hover:bg-red-500/10 hover:text-white disabled:opacity-60"
                >
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-transparent group-hover:bg-red-400" />
                  <LogoutIcon className="h-5 w-5" />
                  <span className="truncate">{busy ? 'Logging out…' : 'Logout'}</span>
                </button>
              </li>
            </ul>
          </nav>

          <div className="border-t border-white/10 px-4 py-3 text-xs text-white/70">
            © {new Date().getFullYear()} ArkWork Admin
          </div>
        </div>
      </aside>

      {Desktop}
    </>
  );
}

/* ----------------------------- Icons ----------------------------- */
function BurgerIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}
function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}
function SparkIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 2l2.2 5.4L20 9l-5 3.8L16 20l-4-3-4 3 1-7.2L4 9l5.8-1.6L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>;
}
function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>;
}
function LayoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 10h18M10 20V10" stroke="currentColor" strokeWidth="2"/></svg>;
}
function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2"/></svg>;
}
function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 3l8 4-8 4-8-4 8-4Z" stroke="currentColor" strokeWidth="2"/><path d="M4 11l8 4 8-4" stroke="currentColor" strokeWidth="2"/><path d="M4 15l8 4 8-4" stroke="currentColor" strokeWidth="2"/></svg>;
}
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" {...props}><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="16" cy="11" r="3" stroke="currentColor" strokeWidth="2"/><path d="M3 20a5 5 0 0 1 7-4.6M14 20a5 5 0 0 1 5-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}
function LogoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 12h10M17 9l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function MoneyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
      <rect x="6" y="14" width="6" height="2" rx="1" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
