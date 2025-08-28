import { NextResponse } from 'next/server';

export const revalidate = 60 * 60 * 24; // cache 24 jam (ISR)

export async function GET() {
  const r = await fetch(
    'https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json',
    { next: { revalidate } }
  );
  if (!r.ok) return NextResponse.json({ items: [] }, { status: 500 });
  const data = await r.json();
  // Normalisasi -> {id,name}
  const items = (data || []).map((d: any) => ({ id: String(d.id), name: d.name }));
  return NextResponse.json({ items });
}
