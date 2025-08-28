'use client'
export function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">{label}</span>
      {children}
    </label>
  )
}
