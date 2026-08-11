// src/app/qc/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QCForm } from "@/components/QCForm";
import Link from "next/link";
import { Button } from "@/components/Button";
import { PrintLabelButton } from "@/components/PrintLabelButton";
import { ResolutionButtons } from "./ResolutionButtons";
import { PhotoViewer } from "@/components/PhotoViewer";

interface QCPageProps {
  params: Promise<{ id: string }>;
}

export default async function QCDetailPage(props: QCPageProps) {
  const resolvedParams = await props.params;
  
  const item = await prisma.returnItem.findUnique({
    where: { id: resolvedParams.id },
    include: { qcResult: true },
  });

  if (!item) notFound();

  // JIKA BARANG SUDAH DI-QC (Halaman Detail)
  if (item.qcStatus !== "PENDING" && item.qcResult) {
    let damageUrls: string[] = [];
    if (item.qcResult.damagePhotoUrl) {
      try { damageUrls = JSON.parse(item.qcResult.damagePhotoUrl); } 
      catch { damageUrls = [item.qcResult.damagePhotoUrl]; }
    }

    // Helper untuk format tanggal resolusi
    const formatDateTime = (dateString: Date) => {
      const d = new Date(dateString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-GB', { month: 'short' });
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${mins}`;
    };

    return (
      <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex justify-center pb-20">
        <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Detail Hasil QC</h1>
            
            {/* Tampilkan Badge Jika Sudah Ada Tindak Lanjut */}
            <div className="flex flex-col items-end gap-1">
              {item.qcResult.resolution === "DIJUAL_KEMBALI" && (
                <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm border border-blue-300">
                  ♻️ SIAP DIJUAL KEMBALI
                </span>
              )}
              {item.qcResult.resolution === "SCRAP" && (
                <span className="bg-gray-200 text-gray-800 font-bold px-3 py-1 rounded-full text-sm border border-gray-400">
                  🗑️ DI-SCRAP / BUANG
                </span>
              )}
              {(item.qcResult.resolution === "PARTIAL_SOLD" || item.qcResult.resolution === "PARTIAL_SCRAP") && (
                <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full text-sm border border-purple-300">
                  ⚖️ RESOLUSI PARTIAL
                </span>
              )}
              {item.qcResult.resolvedAt && (
                <span className="text-xs text-gray-500 font-medium mt-1">
                  {formatDateTime(item.qcResult.resolvedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-900">
              <p><strong>SO Number:</strong> {item.soNumber}</p>
              <p><strong>Customer:</strong> {item.customerName}</p>
              <p className="mt-2"><strong>Barang:</strong> {item.itemName} ({item.itemCode})</p>
              <p><strong>Ukuran:</strong> {item.width} x {item.height}</p>
              <p><strong>Total Qty:</strong> {item.qtyOrder} pcs</p>
              <p className="mt-2">
                <strong>Kondisi Fisik (QC):</strong> <span className="font-bold">{item.qcStatus}</span>
              </p>
              {item.qcStatus === "PARTIAL_GOOD" && (
                <p className="text-orange-700 font-medium">
                  ↳ {item.qcResult.goodQty || 0} pcs Good, {item.qcResult.badQty || 0} pcs Bad
                </p>
              )}
              {item.qcResult.damageNotes && (
                <p className="mt-2 text-red-600"><strong>Catatan Minus:</strong> {item.qcResult.damageNotes}</p>
                )}
              
              {/* Rincian Partial Resolution */}
              {(item.qcResult.resolution === "PARTIAL_SOLD" || item.qcResult.resolution === "PARTIAL_SCRAP") && (
                <p className="mt-2 text-purple-700 font-medium border-t border-gray-200 pt-2">
                  <strong>Rincian Eksekusi:</strong> {item.qcResult.soldQty || 0} pcs Dijual, {item.qcResult.scrapQty || 0} pcs Scrap
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold mb-2 text-sm text-gray-600">Foto Fisik</p>
                <PhotoViewer url={item.qcResult.generalPhotoUrl} alt="Fisik" className="w-full h-auto rounded-md border" />
              </div>
              {damageUrls.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-semibold mb-2 text-sm text-gray-600">Foto Minus ({damageUrls.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {damageUrls.map((url, idx) => (
                      <PhotoViewer key={idx} url={url} alt={`Minus ${idx + 1}`} className="w-full h-auto rounded-md border aspect-[4/3] object-cover" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* --- AREA TINDAK LANJUT --- */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3">Eksekusi / Tindak Lanjut</h3>
              <ResolutionButtons 
                returnItemId={item.id} 
                currentResolution={item.qcResult.resolution}
                qtyOrder={item.qtyOrder}
                currentSoldQty={item.qcResult.soldQty}
                currentScrapQty={item.qcResult.scrapQty}
              />
            </div>

            <Link href="/?tab=completed" className="mt-4">
              <Button variant="secondary" className="w-full">Kembali ke Dashboard</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // JIKA BARANG BELUM DI-QC (Halaman Form QC Kamera)
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex justify-center pb-20">
      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Form QC Barang</h1>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mt-4 text-sm text-gray-900">
            <p><strong>SO:</strong> {item.soNumber} | <strong>Cust:</strong> {item.customerName}</p>
            <p><strong>Barang:</strong> {item.itemCode} - {item.itemName}</p>
            <div className="flex justify-between items-center mt-1">
              <p><strong>Qty/Ukuran:</strong> {item.qtyOrder} pcs | {item.width} x {item.height}</p>
              <PrintLabelButton customerName={item.customerName} soNumber={item.soNumber} itemCode={item.itemCode} width={item.width} height={item.height} />
            </div>
          </div>
        </div>
        <QCForm item={item as any} />
      </div>
    </main>
  );
}