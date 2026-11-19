// src/app/api/fix-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const confirm = searchParams.get('confirm');

    // 1. Cari semua data yang statusnya sudah dieksekusi
    const allResolvedData = await prisma.qCResult.findMany({
      where: {
        resolution: {
          in: ['DIJUAL_KEMBALI', 'SCRAP']
        }
      },
      include: { returnItem: true }
    });

    // 2. Filter pakai JavaScript (Biar TypeScript gak rewel soal null dan 0)
    const legacyData = allResolvedData.filter(qc => 
      (!qc.soldQty || qc.soldQty === 0) && 
      (!qc.scrapQty || qc.scrapQty === 0)
    );

    // ==========================================
    // MODE 1: PREVIEW (Jika URL tanpa ?confirm=true)
    // ==========================================
    if (confirm !== 'true') {
      const previewData = legacyData.map(qc => ({
        soNumber: qc.returnItem.soNumber,
        customer: qc.returnItem.customerName,
        barang: qc.returnItem.itemName,
        qtyOrder: qc.returnItem.qtyOrder,
        statusSaatIni: qc.resolution,
        perbaikanNanti: qc.resolution === 'DIJUAL_KEMBALI' 
          ? `Akan diubah -> Terjual: ${qc.returnItem.qtyOrder}, Scrap: 0`
          : `Akan diubah -> Terjual: 0, Scrap: ${qc.returnItem.qtyOrder}`
      }));

      return NextResponse.json({
        mode: "PREVIEW 👀",
        pesan: "Ini hanya preview. Database BELUM diubah. Silakan cek datanya di bawah ini. Jika sudah oke, tambahkan ?confirm=true di akhir URL.",
        totalDataBermasalah: legacyData.length,
        dataYangAkanDiperbaiki: previewData
      });
    }

    // ==========================================
    // MODE 2: EKSEKUSI (Jika URL pakai ?confirm=true)
    // ==========================================
    let updatedCount = 0;

    for (const qc of legacyData) {
      const qtyOrder = qc.returnItem.qtyOrder;
      
      if (qc.resolution === 'DIJUAL_KEMBALI') {
        await prisma.qCResult.update({
          where: { id: qc.id },
          data: { soldQty: qtyOrder, scrapQty: 0 }
        });
        updatedCount++;
      } else if (qc.resolution === 'SCRAP') {
        await prisma.qCResult.update({
          where: { id: qc.id },
          data: { soldQty: 0, scrapQty: qtyOrder }
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ 
      mode: "EKSEKUSI 🚀",
      success: true, 
      pesan: `Mantap! Berhasil memperbaiki ${updatedCount} data lama secara permanen di database.` 
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}