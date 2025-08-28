// frontend/src/app/auth/signup_perusahaan/components/Stepper.tsx
'use client';
import { Step } from '../types';
import { classNames } from '../utils';

export default function Stepper({ step }: { step: Step }) {
  const items = [
    { n: 1, label: 'Profil' },
    { n: 2, label: 'Pilih Paket' },
    { n: 3, label: 'Pasang Lowongan' },
    { n: 4, label: 'Verifikasi' },
  ];
  return (
    <div className="mb-8 flex items-center justify-between">
      {items.map(({ n, label }) => (
        <div key={n} className="flex flex-1 items-center">
          <div
            className={classNames(
              'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
              n <= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
            )}
          >
            {n}
          </div>
          <div className={classNames('ml-3 text-sm', n <= step ? 'text-slate-900 font-medium' : 'text-slate-500')}>
            {label}
          </div>
          {n !== 4 && <div className="mx-4 h-[2px] flex-1 rounded bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}
