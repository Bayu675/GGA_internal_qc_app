// src/app/api/uploads/[filename]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest, props: { params: Promise<{ filename: string }> }) {
  const params = await props.params;
  const filename = params.filename;
  
  // Cari file fisiknya di hardisk server
  const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

  try {
    // Jika file tidak ada di hardisk
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Baca file dan kirim sebagai gambar
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        // Cache di browser agar loading cepat
        'Cache-Control': 'public, max-age=31536000, immutable', 
      },
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}