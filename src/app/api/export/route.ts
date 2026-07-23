// src/app/api/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { utils, write } from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerName = searchParams.get('customerName');

    let dateFilter = undefined;
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); 
      dateFilter = { gte: new Date(startDate), lt: end };
    }

    const items = await prisma.returnItem.findMany({
      where: { 
        qcStatus: { not: 'PENDING' },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
        ...(customerName ? { customerName: customerName } : {})
      },
      include: { qcResult: true },
      orderBy: { qcResult: { processedAt: 'desc' } }, 
    });

    if (items.length === 0) {
      return new NextResponse("Belum ada data barang return yang sesuai dengan filter Anda.", { status: 400 });
    }

    const excelData = items.map((item, index) => {
      const dateStr = item.qcResult 
        ? new Date(item.qcResult.processedAt).toISOString().split('T')[0] 
        : '-';

      // Terjemahkan status database ke bahasa manusia yang enak dibaca bos
      const resolutionText = item.qcResult?.resolution === 'DIJUAL_KEMBALI' 
        ? 'Dijual Kembali' 
        : item.qcResult?.resolution === 'SCRAP' 
        ? 'Di-Scrap / Buang' 
        : 'Belum Ada Keputusan';

      return {
        "NO": index + 1,
        "tanggal terima barang": dateStr,
        "SALES ORDER": item.soNumber,
        "Customer": item.customerName,
        "Kode SKU Barang": item.itemCode,
        "Nama Barang": item.itemName,
        "LEBAR": item.width,
        "TINGGI": item.height,
        "QTY ORDER": item.qtyOrder,
        "Status QC": item.qcStatus,
        "Tindak Lanjut": resolutionText, // <--- INI KOLOM BARUNYA
        "Notes": item.qcResult?.damageNotes || "-",
      };
    });

    const worksheet = utils.json_to_sheet(excelData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Data QC Barang");

    const excelBuffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });

    let fileName = "Export_QC_Return";
    if (customerName) fileName += `_${customerName}`;
    if (startDate && endDate) fileName += `_${startDate}_sampai_${endDate}`;
    fileName += ".xlsx";

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName.replace(/\s+/g, '_')}"`,
      },
    });

  } catch (error: unknown) {
    console.error("Export Action Error:", error);
    return new NextResponse("Internal Server Error saat export data", { status: 500 });
  }
}