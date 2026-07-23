// src/app/qc/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QCForm } from "@/components/QCForm";
import Link from "next/link";
import { Button } from "@/components/Button";
import { PrintLabelButton } from "@/components/PrintLabelButton";
import { ResolutionButtons } from "./ResolutionButtons";

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

    return (
      <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex justify-center pb-20">
        <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Detail Hasil QC</h1>
            
            {/* Tampilkan Badge Jika Sudah Ada Tindak Lanjut */}
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
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-gray-100 p-4 rounded-md text-sm">
              <p><strong>SO Number:</strong> {item.soNumber}</p>
              <p><strong>Customer:</strong> {item.customerName}</p>
              <p className="mt-2"><strong>Barang:</strong> {item.itemName} ({item.itemCode})</p>
              <p><strong>Kondisi Fisik (QC):</strong> <span className="font-bold">{item.qcStatus}</span></p>
              {item.qcResult.damageNotes && (
                <p className="mt-2 text-red-600"><strong>Catatan Minus:</strong> {item.qcResult.damageNotes}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold mb-2 text-sm text-gray-600">Foto Fisik</p>
                <img src={item.qcResult.generalPhotoUrl} className="w-full h-auto rounded-md border" alt="Fisik" />
              </div>
              {damageUrls.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-semibold mb-2 text-sm text-gray-600">Foto Minus ({damageUrls.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {damageUrls.map((url, idx) => (
                      <img key={idx} src={url} className="w-full h-auto rounded-md border aspect-[4/3] object-cover" alt={`Minus ${idx + 1}`} />
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