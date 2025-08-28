'use client';

import useSWR from 'swr';
import { useMemo } from 'react';

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

type User = {
  id: string;
  name: string;
  email: string;
  roles?: string[];           // contoh: ['admin']
  employer?: { id?: string }; // ada id -> employer
};

type UsersResp = { users: User[] };

export default function AdminUsersPage() {
  const { data, error, isLoading, mutate } = useSWR<UsersResp>(
    '/admin/users',   // <-- siapkan endpoint ini di backend
    fetcher,
    { refreshInterval: 0 }
  );

  const users = useMemo(() => data?.users ?? [], [data]);

  function roleOf(u: User) {
    if (u.roles?.includes?.('admin')) return 'Admin';
    if (u.employer?.id) return 'Employer';
    return 'Jobseeker';
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Data Pengguna</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Menampilkan nama, email, dan role pengguna.
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Refresh
        </button>
      </div>

      {isLoading && <div className="mt-6 text-sm text-neutral-500">Memuat data…</div>}
      {error && (
        <div className="mt-6 text-sm text-red-600">
          Gagal memuat data. Pastikan akunmu memiliki akses admin.
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-neutral-50 text-neutral-700">
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-neutral-500" colSpan={3}>
                    Belum ada pengguna.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-neutral-200" />
                      <div className="font-medium text-neutral-900">{u.name || '—'}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
                      {roleOf(u)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
