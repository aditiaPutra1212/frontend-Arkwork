  'use client';

  import Nav from '@/components/nav';
  import Footer from '@/components/Footer';

  export default function EmployerHome() {
    const stats = [
      { label: 'Active Jobs', value: 3 },
      { label: 'Total Applicants', value: 47 },
      { label: 'Interviews Scheduled', value: 6 },
    ];

    return (
      <>
        <Nav />
        <main className="min-h-[60vh] bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <header className="mb-6">
              <h1 className="text-2xl font-semibold text-slate-900">Employer Overview</h1>
              <p className="text-sm text-slate-600">Ringkasan akun perusahaan dan performa lowongan.</p>
            </header>

            <section className="grid gap-4 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{s.value}</p>
                </div>
              ))}
            </section>

            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Quick Actions</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="/employer/jobs/new" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Post a Job
                </a>
                <a href="/employer/jobs" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Manage Jobs
                </a>
                <a href="/employer/applications" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  View Applications
                </a>
              </div>
            </section>
          </div>
        </main>
      </>
    );
  }
