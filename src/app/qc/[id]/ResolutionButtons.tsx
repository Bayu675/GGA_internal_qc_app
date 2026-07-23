// src/app/qc/[id]/ResolutionButtons.tsx
"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/Button";
import { updateResolutionAction } from "@/app/actions";

export const ResolutionButtons = ({ returnItemId, currentResolution }: { returnItemId: string, currentResolution: string | null }) => {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (type: "DIJUAL_KEMBALI" | "SCRAP") => {
    const confirmMsg = type === "DIJUAL_KEMBALI" 
      ? "Yakin barang ini akan masuk stok DIJUAL KEMBALI?" 
      : "Yakin barang ini akan di-SCRAP / DIBUANG?";
      
    if (!window.confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await updateResolutionAction(returnItemId, type);
      if (res.success) {
        alert("Status berhasil diperbarui!");
      } else {
        alert(res.error || "Gagal memperbarui status");
      }
    });
  };

  return (
    <div className="flex gap-3">
      <Button 
        type="button" 
        onClick={() => handleUpdate("DIJUAL_KEMBALI")}
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
        onClick={() => handleUpdate("SCRAP")}
        disabled={isPending || currentResolution === "SCRAP"}
        className={`flex-1 flex justify-center items-center gap-2 py-3 ${
          currentResolution === "SCRAP" 
          ? "bg-gray-600 text-white cursor-default" 
          : "bg-white text-gray-700 border-2 border-gray-600 hover:bg-gray-50"
        }`}
      >
        {isPending ? "Proses..." : "🗑️ Scrape / Buang"}
      </Button>
    </div>
  );
};