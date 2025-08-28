// frontend/src/app/auth/signup_perusahaan/utils.ts
import { CompanyProfile, NewJob } from './types';

export function classNames(...s: (string | false | undefined)[]) {
  return s.filter(Boolean).join(' ');
}

export function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(n);
}

export function normalizeUrl(u: string) {
  const v = u.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function validateStep1(p: CompanyProfile) {
  if (p.name.trim().length < 2) return 'Nama perusahaan wajib diisi.';
  if (!/^\S+@\S+\.\S+$/.test(p.email)) return 'Email perusahaan tidak valid.';
  return null;
}

export function validateStep3(j: NewJob) {
  if (j.title.trim().length < 3) return 'Posisi pekerjaan wajib diisi.';
  if (j.location.trim().length < 2) return 'Lokasi wajib diisi.';
  if (j.description.trim().length < 10) return 'Deskripsi terlalu singkat.';
  return null;
}
