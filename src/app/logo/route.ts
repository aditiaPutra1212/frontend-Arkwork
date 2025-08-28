// frontend/src/app/logo/route.ts
import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function GET() {
  // ganti ke nama file LOGO yang benar
  const relPath = 'src/app/Images/Ungu__1_-removebg-preview.png'
  const abs = join(process.cwd(), relPath)

  try {
    const buf = await readFile(abs) // Buffer
    // NextResponse menerima Uint8Array, Buffer juga ok; untuk aman cast ke Uint8Array
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e) {
    // fallback kalau file tak ditemukan
    return new NextResponse('Not found', { status: 404 })
  }
}
