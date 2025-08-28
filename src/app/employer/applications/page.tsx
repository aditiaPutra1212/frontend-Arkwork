'use client';

import Nav from '@/components/nav';
import Footer from '@/components/Footer';

const applications = [
  { id: 'a1', name: 'Dewi Lestari', job: 'Frontend Engineer', status: 'New', date: '2025-08-12' },
  { id: 'a2', name: 'Rizky Pratama', job: 'Backend Engineer', status: 'Shortlisted', date: '2025-08-10' },
  { id: 'a3', name: 'Adi Saputra', job: 'Product Designer', status: 'Interview', date: '2025-08-09' },
];

export default function ApplicationsPage() {
  return (
    <>
      <Nav />
      <main className="min-h-[60vh] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-4 text-2xl font-semibold text-slate-900">Applications</h1>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{a.name}</td>
                    <td className="px-4 py-3 text-slate-700">{a.job}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{a.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50">View</button>
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50">Message</button>
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50">Move Stage</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
