// src/app/admin/page.tsx
export default function AdminHome() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card title="Tenders Management">
        <p className="text-sm text-neutral-600">Create & curate tender opportunities.</p>
      </Card>
      <Card title="Jobs">
        <p className="text-sm text-neutral-600">Manage posted jobs and approvals.</p>
      </Card>
      <Card title="Payments">
        <p className="text-sm text-neutral-600">Plans, subscriptions, and transactions.</p>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-neutral-900">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}
