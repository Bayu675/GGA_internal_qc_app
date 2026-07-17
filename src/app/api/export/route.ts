import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { utils, write } from 'xlsx';

export async function GET() {
  try {
    // 1. Fetch all items that have been processed (Not PENDING)
    const items = await prisma.returnItem.findMany({
      where: { qcStatus: { not: 'PENDING' } },
      include: { qcResult: true },
      orderBy: { qcResult: { processedAt: 'desc' } }, // Urutkan dari yang terbaru di-QC
    });

    if (items.length === 0) {
      return new NextResponse("Belum ada data barang return yang selesai di-QC.", { status: 400 });
    }

    // 2. Map data into the exact format requested
    const excelData = items.map((item, index) => {
      // Format Date: YYYY-MM-DD
      const dateStr = item.qcResult 
        ? new Date(item.qcResult.processedAt).toISOString().split('T')[0] 
        : '-';

      return {
        "NO": index + 1,
        "tanggal terima barang": dateStr,
        "SALES ORDER": item.soNumber,
        "Kode SKU Barang": item.itemCode,
        "Nama Barang": item.itemName,
        "LEBAR": item.width,
        "TINGGI": item.height,
        "QTY ORDER": item.qtyOrder,
        "Status": item.qcStatus,
        "Notes": item.qcResult?.damageNotes || "-",
      };
    });

    // 3. Create Workbook & Worksheet
    const worksheet = utils.json_to_sheet(excelData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Data QC Barang");

    // 4. Generate Excel Buffer
    const excelBuffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 5. Send file directly as a downloadable response
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Export_QC_Return_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error: unknown) {
    console.error("Export Action Error:", error);
    return new NextResponse("Internal Server Error saat export data", { status: 500 });
  }
}