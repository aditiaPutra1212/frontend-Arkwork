// frontend/src/app/auth/signup_perusahaan/components/Card.tsx
import React from 'react';

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
      {children}
    </div>
  );
}
