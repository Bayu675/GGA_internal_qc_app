// src/app/qc/[id]/ResolutionButtons.tsx
"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { updateResolutionAction } from "@/app/actions";
import { useUI } from "@/components/UIProvider";

export const ResolutionButtons = ({ 
  returnItemId, 
  currentResolution,
  qtyOrder,
  currentSoldQty,
  currentScrapQty
}: { 
  returnItemId: string; 
  currentResolution: string | null;
  qtyOrder: number;
  currentSoldQty: number | null;
  currentScrapQty: number | null;
}) => {
  const [isPending, startTransition] = useTransition();
  const [showPartialForm, setShowPartialForm] = useState(false);
  const [soldQty, setSoldQty] = useState<number | "">("");
  const [scrapQty, setScrapQty] = useState<number | "">("");
  const { showToast, showConfirm } = useUI(); 

  const handleUpdate = (type: "DIJUAL_KEMBALI" | "SCRAP") => {
    const confirmMsg = type === "DIJUAL_KEMBALI" 
      ? "Yakin barang ini akan masuk stok DIJUAL KEMBALI?" 
      : "Yakin barang ini akan di-SCRAP / DIBUANG?";
      
    showConfirm(confirmMsg, () => {
      startTransition(async () => {
        try {
          const res = await updateResolutionAction(returnItemId, type);
          if (res.success) {
            showToast("Status berhasil diperbarui!", 'success');
            setShowPartialForm(false);
          } else {
            showToast(res.error || "Gagal memperbarui status", 'error');
          }
        } catch (error: unknown) {
          console.error(error);
          showToast("Terjadi kesalahan jaringan, silakan coba lagi.", 'error');
        }
      });
    });
  };

  const handlePartialSubmit = () => {
    const sQty = Number(soldQty) || 0;
    const cQty = Number(scrapQty) || 0;

    if (sQty === 0 && cQty === 0) {
      return showToast("Silakan isi minimal salah satu Qty (Dijual atau Scrap)!", 'error');
    }
    
    // Kalkulasi sisa barang berdasarkan data yang sudah ada di database
    const existingSold = currentSoldQty || 0;
    const existingScrap = currentScrapQty || 0;
    const remainingQty = qtyOrder - (existingSold + existingScrap);

    if (sQty + cQty > remainingQty) {
      return showToast(`Gagal! Input kamu (${sQty + cQty}) melebihi sisa barang yang belum diresolusi (${remainingQty} pcs)!`, 'error');
    }

    showConfirm("Yakin simpan resolusi partial ini?", () => {
      startTransition(async () => {
        try {
          const res = await updateResolutionAction(returnItemId, "PARTIAL_SOLD", sQty, cQty);
          if (res.success) {
            showToast("Resolusi partial berhasil disimpan!", 'success');
            setShowPartialForm(false);
          } else {
            showToast(res.error || "Gagal memperbarui status", 'error');
          }
        } catch (error: unknown) {
          console.error(error);
          showToast("Terjadi kesalahan jaringan, silakan coba lagi.", 'error');
        }
      });
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Button 
          type="button"
          variant="secondary"
          onClick={() => { setShowPartialForm(false); handleUpdate("DIJUAL_KEMBALI"); }}
          disabled={isPending || currentResolution === "DIJUAL_KEMBALI"}
          className={`flex-1 flex justify-center items-center gap-2 py-3 ${
            currentResolution === "DIJUAL_KEMBALI" 
            ? "bg-blue-600 text-white cursor-default" 
            : "bg-white text-blue-700 border-2 border-blue-600 hover:bg-blue-50"
          }`}
        >
          {isPending ? "Proses..." : "♻️ Dijual Kembali"}
        </Button>

      <Button 
          type="button" 
          variant="secondary"
          onClick={() => { setShowPartialForm(false); handleUpdate("SCRAP"); }}
          disabled={isPending || currentResolution === "SCRAP"}
          className={`flex-1 flex justify-center items-center gap-2 py-3 ${
            currentResolution === "SCRAP" 
            ? "bg-gray-600 text-white cursor-default" 
            : "bg-white text-gray-700 border-2 border-gray-600 hover:bg-gray-50"
          }`}
        >
          {isPending ? "Proses..." : "🗑️ Scrape / Buang"}
        </Button>
        
        <Button 
          type="button" 
          variant="secondary"
          onClick={() => setShowPartialForm(!showPartialForm)}
          disabled={isPending}
          className={`flex-1 flex justify-center items-center gap-2 py-3 ${(currentResolution === "PARTIAL_SOLD" || currentResolution === "PARTIAL_SCRAP") ? "bg-purple-600 text-white border-2 border-purple-600 hover:bg-purple-700" : "bg-white text-purple-700 border-2 border-purple-600 hover:bg-purple-50"}`}
        >
          ⚖️ Partial / Bagi
        </Button>
      </div>

      {/* Form Input Manual untuk Partial Resolution */}
      {showPartialForm && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-md flex flex-col gap-3 animate-fade-in">
          <p className="text-sm font-semibold text-purple-800 mb-1">Tambah Resolusi Partial (Sisa Belum Diresolusi: {qtyOrder - ((currentSoldQty || 0) + (currentScrapQty || 0))} pcs)</p>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Tambahan Qty Dijual</label>
              <input type="number" min="0" value={soldQty} onChange={(e) => setSoldQty(e.target.value ? Number(e.target.value) : "")} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500" placeholder="0" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Tambahan Qty Scrap</label>
              <input type="number" min="0" value={scrapQty} onChange={(e) => setScrapQty(e.target.value ? Number(e.target.value) : "")} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500" placeholder="0" />
            </div>
          </div>
          <Button variant="primary" onClick={handlePartialSubmit} disabled={isPending} className="mt-2 w-full bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 text-sm">
            {isPending ? "Menyimpan..." : "Simpan Resolusi Partial"}
          </Button>
        </div>
      )}
    </div>
  );
};