import { NextResponse } from 'next/server';

export const revalidate = 60 * 60 * 24;

export async function GET(
  _req: Request,
  { params }: { params: { provinceId: string } }
) {
  const { provinceId } = params;
  const r = await fetch(
    `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`,
    { next: { revalidate } }
  );
  if (!r.ok) return NextResponse.json({ items: [] }, { status: 500 });
  const data = await r.json();
  const items = (data || []).map((d: any) => ({ id: String(d.id), name: d.name }));
  return NextResponse.json({ items });
}
