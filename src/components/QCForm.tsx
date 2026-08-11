"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "./CameraCapture";
import { Button } from "./Button";
import { Input } from "./Input";
import { TableItem } from "./ReturnItemTable";
import { submitQCAction } from "@/app/actions";
import { useUI } from "./UIProvider";

interface QCFormProps {
  item: TableItem; // We reuse the TableItem interface for simplicity
}

export const QCForm: React.FC<QCFormProps> = ({ item }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [status, setStatus] = useState<"GOOD" | "BAD" | "PARTIAL_GOOD" | "">("");
  const [generalPhoto, setGeneralPhoto] = useState<string>("");
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);
  const [damageNotes, setDamageNotes] = useState<string>("");
  const [goodQty, setGoodQty] = useState<number | "">("");
  const { showToast } = useUI();

    // Handlers for multiple damage photos
  const handleAddDamagePhoto = (base64: string) => {
    setDamagePhotos((prev) => [...prev, base64]);
  };
  const handleRemoveDamagePhoto = (index: number) => {
    setDamagePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!status) return setError("Pilih status barang bro!");
    if (!generalPhoto) return setError("Foto fisik wajib ada!");
    if (status !== "GOOD" && damagePhotos.length === 0) return setError("Minimal 1 foto bukti rusak wajib disertakan!");
    if (status !== "GOOD" && !damageNotes) return setError("Tulis keterangan minusnya bro!");
        if (status === "PARTIAL_GOOD") {
      if (goodQty === "" || goodQty < 1 || goodQty >= item.qtyOrder) {
        return setError(`Jumlah Good harus minimal 1 dan kurang dari total order (${item.qtyOrder}).`);
      }
    }

    startTransition(async () => {
      try {
        const finalGoodQty = status === "GOOD" ? item.qtyOrder : status === "BAD" ? 0 : Number(goodQty);
        const finalBadQty = status === "BAD" ? item.qtyOrder : status === "GOOD" ? 0 : item.qtyOrder - Number(goodQty);

        const res = await submitQCAction({
          returnItemId: item.id,
          status: status as "GOOD" | "BAD" | "PARTIAL_GOOD",
          generalPhotoBase64: generalPhoto,
          damagePhotosBase64: status !== "GOOD" ? damagePhotos : undefined,
          damageNotes: status !== "GOOD" ? damageNotes : undefined,
          goodQty: finalGoodQty,
          badQty: finalBadQty,
        });

        if (res.success) {
          showToast("Mantap! Data QC berhasil disimpan.", 'success');
          router.push("/?tab=completed");
        } else {
          setError(res.error || "Gagal menyimpan data");
        }
      } catch (err: unknown) {
        console.error("Gagal melakukan aksi:", err);
        setError("Koneksi terputus atau terjadi kesalahan sistem. Silakan periksa jaringan Anda dan coba lagi.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-6 pb-24">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {/* 1. Capture General Photo */}
      <CameraCapture label="1. Foto Fisik Keseluruhan" onCapture={setGeneralPhoto} />

      {/* 2. Select Status */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">2. Status Barang</label>
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value as "GOOD" | "BAD" | "PARTIAL_GOOD" | "")}
          className={`border border-gray-300 rounded-md px-3 py-3 w-full focus:ring-green-500 font-bold ${
            status === 'GOOD' ? 'bg-green-100 text-green-800' : 
            status === 'BAD' ? 'bg-red-100 text-red-800' : 
            status === 'PARTIAL_GOOD' ? 'bg-orange-100 text-orange-800' : 'bg-white text-gray-800'
          }`}
        >
          <option value="" disabled>-- Pilih Status --</option>
          <option value="GOOD">✅ GOOD (Bagus)</option>
          <option value="PARTIAL_GOOD">⚠️ PARTIAL GOOD (Bagus Sebagian)</option>
          <option value="BAD">❌ BAD (Rusak Parah)</option>
        </select>
        {/* Input Qty Khusus PARTIAL_GOOD */}
        {status === "PARTIAL_GOOD" && (
          <div className="flex gap-4 p-4 border border-orange-200 bg-orange-50 rounded-lg mt-2">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Jumlah Bagus (Good)</label>
              <input 
                type="number" 
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 w-full"
                value={goodQty} 
                onChange={(e) => setGoodQty(e.target.value ? Number(e.target.value) : "")}
                min="1"
                max={item.qtyOrder - 1}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Jumlah Rusak (Bad)</label>
              <input 
                type="number" 
                readOnly 
                className="border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 font-bold w-full cursor-not-allowed"
                value={typeof goodQty === 'number' ? item.qtyOrder - goodQty : ""}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Conditional: Damage Photo & Notes */}
      {(status === "BAD" || status === "PARTIAL_GOOD") && (
        <div className="flex flex-col gap-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">3a. Foto Bukti Rusak ({damagePhotos.length} Foto)</label>
            
            {/* List of captured damage photos */}
            <div className="grid grid-cols-2 gap-2">
              {damagePhotos.map((photo, idx) => (
                <div key={idx} className="relative aspect-[4/3] bg-black rounded-md overflow-hidden">
                  <img src={photo} alt={`Minus ${idx + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleRemoveDamagePhoto(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs w-6 h-6 flex items-center justify-center">
                    X
                  </button>
                </div>
              ))}
            </div>
            
            {/* Capture new damage photo component */}
            <CameraCapture label={damagePhotos.length === 0 ? "Ambil Foto Rusak Pertama" : "+ Tambah Foto Rusak Lagi"} onCapture={handleAddDamagePhoto} />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">3b. Keterangan Minus</label>
            <textarea
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-orange-500 min-h-[100px]"
              placeholder="Contoh: Lecet di bagian kanan atas, sekrup hilang..."
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 flex justify-center">
        <div className="w-full max-w-2xl flex gap-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => router.push("/")} disabled={isPending}>
            Batal
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan QC"}
          </Button>
        </div>
      </div>
    </form>
  );
};