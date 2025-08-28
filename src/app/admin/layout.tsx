// src/app/admin/layout.tsx
import type { Metadata } from 'next';
import AdminSidebar from './components/AdminSidebar';

export const metadata: Metadata = {
  title: 'Admin | ArkWork',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar kiri (fixed) */}
      <AdminSidebar />

      {/* Konten utama geser 72 (lebar sidebar) saat md+ */}
      <div className="md:pl-72">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-neutral-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <h1 className="text-lg font-semibold text-neutral-900">Admin Dashboard</h1>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
