'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type Role = 'user' | 'admin' | 'employer';

export type EmployerLite = { id: string; slug?: string; displayName?: string | null };

export type UserLite = {
  id: string;
  email?: string;
  name?: string | null;
  photoUrl?: string | null;
  cvUrl?: string | null;
  role: Role;
  employer?: EmployerLite | null; // terisi saat role === 'employer'
};

export type AuthCtx = {
  user: UserLite | null;
  loading: boolean;

  // kandidat (user) atau admin
  signin: (identifier: string, password: string) => Promise<UserLite>;
  signup: (name: string, email: string, password: string) => Promise<UserLite>;

  // employer
  signinEmployer: (usernameOrEmail: string, password: string) => Promise<UserLite>;

  signout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null as any);

/* ================= Snapshot cache (untuk UX cepat) ================= */
const LS_KEY = 'ark:auth:user:v1';
const LS_TTL_MS = 1000 * 60 * 30; // 30 menit

function readSnapshot(): UserLite | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as { ts: number; user: UserLite | null };
    if (!obj?.ts) return null;
    if (Date.now() - obj.ts > LS_TTL_MS) return null;
    return obj.user ?? null;
  } catch {
    return null;
  }
}
function writeSnapshot(user: UserLite | null) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), user }));
  } catch {}
}
function clearSnapshot() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

/* ================= Helper nama tampilan ================= */
const prefixEmail = (e?: string | null) =>
  (e && e.includes('@') ? e.split('@')[0] : e) || '';

const nameForEmployer = (e: any) =>
  e?.employer?.displayName?.trim() ||
  e?.admin?.fullName?.trim() ||
  prefixEmail(e?.admin?.email) ||
  'Company';

const nameForUser = (u: any) =>
  (u?.name && String(u.name).trim()) || prefixEmail(u?.email) || 'User';

const nameForAdmin = (a: any) => (a?.username?.trim?.() || 'Admin');

/* ================= Mapper respons → UserLite ================= */
function mapEmployerMe(resp: any): UserLite {
  return {
    id: resp?.admin?.id || 'unknown',
    email: resp?.admin?.email || undefined,
    name: nameForEmployer(resp),
    role: 'employer',
    employer: resp?.employer
      ? { id: resp.employer.id, slug: resp.employer.slug, displayName: resp.employer.displayName }
      : null,
  };
}

function mapCandidateMe(resp: any): UserLite {
  // bisa berbentuk { ok, user: { ... } } ATAU langsung object user
  const u = resp?.user ?? resp;
  return {
    id: u?.id,
    email: u?.email,
    name: nameForUser(u),
    photoUrl: u?.photoUrl ?? null,
    cvUrl: u?.cvUrl ?? null,
    role: 'user',
  };
}

function mapAdminMe(resp: any): UserLite {
  // bisa { id, username } atau { admin: {...} }
  const a = resp?.admin ?? resp;
  return {
    id: a?.id || `admin:${a?.username || 'unknown'}`,
    email: `${a?.username || 'admin'}@local`,
    name: nameForAdmin(a),
    role: 'admin',
  };
}

/* ================= Provider ================= */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserLite | null>(() => {
    if (typeof window === 'undefined') return null;
    return readSnapshot();
  });
  const [loading, setLoading] = useState(true);

  // sinkron antar-tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY) setUser(readSnapshot());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setUserAndCache = (u: UserLite | null) => {
    setUser(u);
    writeSnapshot(u);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      // 1) employer (emp_token)
      try {
        const e = await api('/api/employers/auth/me');
        setUserAndCache(mapEmployerMe(e));
        return;
      } catch {}

      // 2) user / candidate
      try {
        const u = await api('/auth/me');
        setUserAndCache(mapCandidateMe(u));
        return;
      } catch {}

      // 3) admin
      try {
        const a = await api('/admin/me');
        setUserAndCache(mapAdminMe(a));
        return;
      } catch {}

      setUserAndCache(null);
    } finally {
      setLoading(false);
    }
  };

  // restore saat mount
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= Actions ================= */

  // kandidat / admin fallback
  const signin: AuthCtx['signin'] = async (identifier, password) => {
    if (identifier.includes('@')) {
      // coba kandidat dulu
      try {
        const u = await api('/auth/signin', { json: { email: identifier, password } });
        const mapped = mapCandidateMe(u);
        setUserAndCache(mapped);
        return mapped;
      } catch {
        // fallback admin (boleh email/username)
        const a = await api('/admin/signin', { json: { usernameOrEmail: identifier, password } });
        const mapped = mapAdminMe(a);
        setUserAndCache(mapped);
        return mapped;
      }
    }
    // tidak mengandung '@' → anggap admin
    const a = await api('/admin/signin', { json: { usernameOrEmail: identifier, password } });
    const mapped = mapAdminMe(a);
    setUserAndCache(mapped);
    return mapped;
  };

  const signup: AuthCtx['signup'] = async (name, email, password) => {
    const u = await api('/auth/signup', { json: { name, email, password } });
    const mapped = mapCandidateMe(u);
    setUserAndCache(mapped);
    return mapped;
  };

  const signinEmployer: AuthCtx['signinEmployer'] = async (usernameOrEmail, password) => {
    const resp = await api('/api/employers/auth/signin', { json: { usernameOrEmail, password } });
    const mapped = mapEmployerMe(resp);
    setUserAndCache(mapped);
    return mapped;
  };

  const signout = async () => {
    try {
      await api('/api/employers/auth/signout', { method: 'POST', expectJson: false });
    } catch {}
    try {
      await api('/auth/signout', { method: 'POST', expectJson: false });
    } catch {}
    try {
      await api('/admin/signout', { method: 'POST', expectJson: false });
    } catch {}
    clearSnapshot();
    setUser(null);
  };

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, signin, signup, signinEmployer, signout, refresh }),
    [user, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
