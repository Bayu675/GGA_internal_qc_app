// src/app/report/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/Button";
import ReportFilter from "./ReportFilter";

interface ReportPageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ReportPage(props: ReportPageProps) {
  const searchParams = await props.searchParams;
  
  const today = new Date().toLocaleDateString('en-CA');
  const selectedDateStr = searchParams?.date || today;
  const reportType = searchParams?.type === 'pengeluaran' ? 'pengeluaran' : 'pemasukan';

  const startDate = new Date(`${selectedDateStr}T00:00:00`);
  const endDate = new Date(`${selectedDateStr}T23:59:59`);

  // --- QUERY DATABASE BERDASARKAN TAB ---
  let items: any[] = [];

  if (reportType === 'pemasukan') {
    // PEMASUKAN: Berdasarkan kapan barang selesai di-QC (processedAt)
    items = await prisma.returnItem.findMany({
      where: {
        qcStatus: { not: "PENDING" },
        qcResult: {
          processedAt: { gte: startDate, lte: endDate }
        }
      },
      include: { qcResult: true },
      orderBy: { qcResult: { processedAt: "desc" } },
    });
  } else {
    // PENGELUARAN: Berdasarkan kapan barang dieksekusi/diresolusi (resolvedAt)
    items = await prisma.returnItem.findMany({
      where: {
        qcResult: {
          resolvedAt: { gte: startDate, lte: endDate }
        }
      },
      include: { qcResult: true },
      orderBy: { qcResult: { resolvedAt: "desc" } },
    });
  }

  // --- KALKULASI SUMMARY ---
  let totalQtyOrder = 0;
  let totalGood = 0;
  let totalBad = 0;
  let totalSold = 0;
  let totalScrap = 0;

  items.forEach(item => {
    totalQtyOrder += item.qtyOrder;
    if (item.qcResult) {
      totalGood += item.qcResult.goodQty || 0;
      totalBad += item.qcResult.badQty || 0;
      totalSold += item.qcResult.soldQty || 0;
      totalScrap += item.qcResult.scrapQty || 0;
    }
  });

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* HEADER & FILTER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📊 Rekap Kerja Harian</h1>
            <p className="text-sm text-gray-500 mt-1">Laporan terpisah untuk Pemasukan (QC) dan Pengeluaran (Eksekusi).</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <ReportFilter initialDate={selectedDateStr} currentType={reportType} />
            <Link href="/">
              <Button variant="secondary">🏠 Kembali</Button>
            </Link>
          </div>
        </div>

        {/* TABS */}
        <div className="flex space-x-2 border-b border-gray-200 pb-4">
          <Link href={`/report?date=${selectedDateStr}&type=pemasukan`} className="flex-1 md:flex-none">
            <Button variant={reportType === 'pemasukan' ? 'primary' : 'secondary'} className="w-full">
              📥 Pemasukan (Hasil QC)
            </Button>
          </Link>
          <Link href={`/report?date=${selectedDateStr}&type=pengeluaran`} className="flex-1 md:flex-none">
            <Button variant={reportType === 'pengeluaran' ? 'primary' : 'secondary'} className={`w-full ${reportType === 'pengeluaran' ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' : ''}`}>
              📤 Pengeluaran (Eksekusi)
            </Button>
          </Link>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-xs text-gray-500 font-bold uppercase">Total Item (SO)</p>
            <p className="text-2xl font-black text-gray-800">{items.length} <span className="text-sm font-normal">SO</span></p>
          </div>
          
          {reportType === 'pemasukan' ? (
            <>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-indigo-500">
                <p className="text-xs text-gray-500 font-bold uppercase">Total Qty Masuk</p>
                <p className="text-2xl font-black text-gray-800">{totalQtyOrder} <span className="text-sm font-normal">pcs</span></p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-green-500">
                <p className="text-xs text-gray-500 font-bold uppercase">Kondisi Bagus (Good)</p>
                <p className="text-2xl font-black text-green-600">{totalGood} <span className="text-sm font-normal">pcs</span></p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-red-500">
                <p className="text-xs text-gray-500 font-bold uppercase">Kondisi Rusak (Bad)</p>
                <p className="text-2xl font-black text-red-600">{totalBad} <span className="text-sm font-normal">pcs</span></p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-indigo-500">
                <p className="text-xs text-gray-500 font-bold uppercase">Total Qty Keluar</p>
                <p className="text-2xl font-black text-gray-800">{totalSold + totalScrap} <span className="text-sm font-normal">pcs</span></p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
                <p className="text-xs text-gray-500 font-bold uppercase">Dijual Kembali</p>
                <p className="text-2xl font-black text-blue-600">{totalSold} <span className="text-sm font-normal">pcs</span></p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-gray-500">
                <p className="text-xs text-gray-500 font-bold uppercase">Di-Scrap / Buang</p>
                <p className="text-2xl font-black text-gray-600">{totalScrap} <span className="text-sm font-normal">pcs</span></p>
              </div>
            </>
          )}
        </div>

        {/* TABEL RINCIAN (Copy-Paste Friendly) */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">
              Rincian Data {reportType === 'pemasukan' ? 'Pemasukan (QC)' : 'Pengeluaran (Eksekusi)'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="px-4 py-3 border-b">No</th>
                  <th className="px-4 py-3 border-b">No. SO</th>
                  <th className="px-4 py-3 border-b">Customer</th>
                  <th className="px-4 py-3 border-b">Kode Barang</th>
                  <th className="px-4 py-3 border-b">Qty Order</th>
                  
                  {reportType === 'pemasukan' ? (
                    <>
                      <th className="px-4 py-3 border-b">Good</th>
                      <th className="px-4 py-3 border-b">Bad</th>
                      <th className="px-4 py-3 border-b">Keterangan Minus</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 border-b">Dijual</th>
                      <th className="px-4 py-3 border-b">Scrap</th>
                      <th className="px-4 py-3 border-b">Sisa</th> {/* TAMBAHAN KOLOM SISA */}
                      <th className="px-4 py-3 border-b">Status Resolusi</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={reportType === 'pemasukan' ? 8 : 9} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada data {reportType} pada tanggal ini.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const good = item.qcResult?.goodQty || 0;
                    const bad = item.qcResult?.badQty || 0;
                    const sold = item.qcResult?.soldQty || 0;
                    const scrap = item.qcResult?.scrapQty || 0;
                    const notes = item.qcResult?.damageNotes || "-";
                    
                    // KALKULASI SISA STOK
                    const sisa = item.qtyOrder - (sold + scrap);
                    
                    let resStatus = "-";
                    if (item.qcResult?.resolution === "DIJUAL_KEMBALI") resStatus = "Full Jual";
                    else if (item.qcResult?.resolution === "SCRAP") resStatus = "Full Scrap";
                    else if (item.qcResult?.resolution === "RESOLVED_MIXED") resStatus = "Selesai (Campuran)";
                    else if (item.qcResult?.resolution?.includes("PARTIAL")) resStatus = "Parsial";

                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{item.soNumber}</td>
                        <td className="px-4 py-2">{item.customerName}</td>
                        <td className="px-4 py-2">{item.itemCode}</td>
                        <td className="px-4 py-2 font-bold text-center">{item.qtyOrder}</td>
                        
                        {reportType === 'pemasukan' ? (
                          <>
                            <td className="px-4 py-2 text-green-600 font-bold">{good}</td>
                            <td className="px-4 py-2 text-red-600 font-bold">{bad}</td>
                            <td className="px-4 py-2 text-xs">{notes}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2 text-blue-600 font-bold">{sold}</td>
                            <td className="px-4 py-2 text-gray-600 font-bold">{scrap}</td>
                            <td className="px-4 py-2 text-orange-600 font-bold">{sisa}</td> {/* TAMPILKAN SISA */}
                            <td className="px-4 py-2 text-xs font-semibold">{resStatus}</td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}