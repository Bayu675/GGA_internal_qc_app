import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QCForm } from "@/components/QCForm";
import Link from "next/link";
import { Button } from "@/components/Button";

// Next.js App Router dynamic route params interface
interface QCPageProps {
  params: Promise<{ id: string }>;
}

export default async function QCDetailPage(props: QCPageProps) {
  // Next.js 15 requires awaiting params
  const resolvedParams = await props.params;
  // Fetch specific return item
  const item = await prisma.returnItem.findUnique({
    where: { id: resolvedParams.id },
    include: { qcResult: true },
  });

  if (!item) {
    notFound();
  }

  // If already checked, show summary instead of form
  if (item.qcStatus !== "PENDING" && item.qcResult) {
        let damageUrls: string[] = [];
    if (item.qcResult.damagePhotoUrl) {
      try {
        damageUrls = JSON.parse(item.qcResult.damagePhotoUrl);
      } catch {
        damageUrls = [item.qcResult.damagePhotoUrl]; // Fallback for old single-string data
      }
    }
    return (
      <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Hasil QC: {item.soNumber}</h1>
          <div className="flex flex-col gap-4">
            <div className="bg-gray-100 p-4 rounded-md">
              <p><strong>Barang:</strong> {item.itemName} ({item.itemCode})</p>
              <p><strong>Status:</strong> {item.qcStatus}</p>
              {item.qcResult.damageNotes && (
                <p className="mt-2 text-red-600"><strong>Minus:</strong> {item.qcResult.damageNotes}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold mb-2">Foto Fisik</p>
                <img src={item.qcResult.generalPhotoUrl} className="w-full h-auto rounded-md border" alt="Fisik" />
              </div>
                            {damageUrls.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-semibold mb-2">Foto Minus ({damageUrls.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {damageUrls.map((url, idx) => (
                      <img key={idx} src={url} className="w-full h-auto rounded-md border aspect-[4/3] object-cover" alt={`Minus ${idx + 1}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/?tab=completed" className="mt-4">
              <Button variant="secondary" className="w-full">Kembali</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // If pending, render the QC Form
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex justify-center pb-20">
      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Form QC Barang</h1>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mt-4 text-sm text-gray-900">
            <p><strong>SO:</strong> {item.soNumber} | <strong>Cust:</strong> {item.customerName}</p>
            <p><strong>Barang:</strong> {item.itemCode} - {item.itemName}</p>
            <p><strong>Qty/Ukuran:</strong> {item.qtyOrder} pcs | {item.width} x {item.height}</p>
          </div>
        </div>

        <QCForm item={item as any} />
      </div>
    </main>
  );
}