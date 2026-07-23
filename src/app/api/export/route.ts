// src/app/api/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { utils, write } from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Tangkap daftar toko. Formatnya: "Toko A|Toko B|Toko C"
    const customersParam = searchParams.get('customers');
    const customerArray = customersParam ? customersParam.split('|').filter(Boolean) : [];

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
        // Filter IN: Ambil data jika nama customer ada di dalam array
        ...(customerArray.length > 0 ? { customerName: { in: customerArray } } : {})
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

      const resolutionText = item.qcResult?.resolution === 'DIJUAL_KEMBALI' 
        ? 'Dijual Kembali' 
        : item.qcResult?.resolution === 'SCRAP' 
        ? 'Di-Scrap / Buang' 
        : 'Belum Ada Keputusan';

      return {
        "NO": index + 1,
        "Tanggal Terima": dateStr,
        "Sales Order": item.soNumber,
        "Customer": item.customerName,
        "Kode Barang": item.itemCode,
        "Nama Barang": item.itemName,
        "L": item.width,
        "T": item.height,
        "Qty": item.qtyOrder,
        "Status QC": item.qcStatus,
        "Tindak Lanjut": resolutionText,
        "Notes Minus": item.qcResult?.damageNotes || "-",
      };
    });

    const worksheet = utils.json_to_sheet(excelData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Data QC");

    const excelBuffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });

    let fileName = "Export_QC";
    if (customerArray.length === 1) fileName += `_${customerArray[0]}`;
    else if (customerArray.length > 1) fileName += `_MultiToko`;
    if (startDate && endDate) fileName += `_${startDate}_to_${endDate}`;
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