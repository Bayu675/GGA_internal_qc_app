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
  
  // Default ke hari ini jika tidak ada tanggal di URL
  const today = new Date().toLocaleDateString('en-CA'); // Format YYYY-MM-DD
  const selectedDateStr = searchParams?.date || today;

  // Setup range waktu dari jam 00:00:00 sampai 23:59:59 di tanggal tersebut
  const startDate = new Date(`${selectedDateStr}T00:00:00`);
  const endDate = new Date(`${selectedDateStr}T23:59:59`);

  // Ambil data yang "di-update" pada hari tersebut dan sudah di-QC
  // Kita pakai updatedAt supaya kalau hari ini dia cuma ngerubah status resolusi, datanya tetap masuk rekap hari ini
  const items = await prisma.returnItem.findMany({
    where: {
      qcStatus: { not: "PENDING" },
      updatedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: { qcResult: true },
    orderBy: { updatedAt: "desc" },
  });

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
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📊 Rekap Kerja Harian</h1>
            <p className="text-sm text-gray-500 mt-1">Laporan aktivitas QC dan Resolusi untuk dilaporkan ke klien.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <ReportFilter initialDate={selectedDateStr} />
            <Link href="/">
              <Button variant="secondary">🏠 Kembali</Button>
            </Link>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-xs text-gray-500 font-bold uppercase">Total Item Diproses</p>
            <p className="text-2xl font-black text-gray-800">{items.length} <span className="text-sm font-normal">SO</span></p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-indigo-500">
            <p className="text-xs text-gray-500 font-bold uppercase">Total Qty Barang</p>
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
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-purple-500 col-span-2 md:col-span-1">
            <p className="text-xs text-gray-500 font-bold uppercase">Eksekusi Akhir</p>
            <div className="flex justify-between mt-1">
              <span className="text-sm font-bold text-blue-600">♻️ Jual: {totalSold}</span>
              <span className="text-sm font-bold text-gray-600">🗑️ Scrap: {totalScrap}</span>
            </div>
          </div>
        </div>

        {/* TABEL RINCIAN (Copy-Paste Friendly) */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Rincian Data</h2>
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
                  <th className="px-4 py-3 border-b">Kondisi (Good/Bad)</th>
                  <th className="px-4 py-3 border-b">Eksekusi (Jual/Scrap)</th>
                  <th className="px-4 py-3 border-b">Keterangan Minus</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada aktivitas QC atau Resolusi pada tanggal ini.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const good = item.qcResult?.goodQty || 0;
                    const bad = item.qcResult?.badQty || 0;
                    const sold = item.qcResult?.soldQty || 0;
                    const scrap = item.qcResult?.scrapQty || 0;
                    const notes = item.qcResult?.damageNotes || "-";

                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{item.soNumber}</td>
                        <td className="px-4 py-2">{item.customerName}</td>
                        <td className="px-4 py-2">{item.itemCode}</td>
                        <td className="px-4 py-2 font-bold text-center">{item.qtyOrder}</td>
                        <td className="px-4 py-2">
                          <span className="text-green-600 font-semibold">{good} G</span> / <span className="text-red-600 font-semibold">{bad} B</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-blue-600 font-semibold">{sold} Jual</span> / <span className="text-gray-600 font-semibold">{scrap} Scrap</span>
                        </td>
                        <td className="px-4 py-2 text-xs">{notes}</td>
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