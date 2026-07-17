"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "./CameraCapture";
import { Button } from "./Button";
import { Input } from "./Input";
import { TableItem } from "./ReturnItemTable";
import { submitQCAction } from "@/app/actions";

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

    startTransition(async () => {
      const res = await submitQCAction({
        returnItemId: item.id,
        status: status as "GOOD" | "BAD" | "PARTIAL_GOOD",
        generalPhotoBase64: generalPhoto,
        damagePhotosBase64: status !== "GOOD" ? damagePhotos : undefined,
        damageNotes: status !== "GOOD" ? damageNotes : undefined,
      });

      if (res.success) {
        alert("Mantap! Data QC berhasil disimpan.");
        router.push("/?tab=completed");
      } else {
        setError(res.error || "Gagal menyimpan data");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-6">
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
          onChange={(e) => setStatus(e.target.value as any)}
          className="border border-gray-300 rounded-md px-3 py-3 w-full bg-white text-gray-800 focus:ring-green-500"
        >
          <option value="" disabled>-- Pilih Status --</option>
          <option value="GOOD">✅ GOOD (Bagus)</option>
          <option value="PARTIAL_GOOD">⚠️ PARTIAL GOOD (Bagus Sebagian)</option>
          <option value="BAD">❌ BAD (Rusak Parah)</option>
        </select>
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

      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" className="flex-1" onClick={() => router.push("/")} disabled={isPending}>
          Batal
        </Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan QC"}
        </Button>
      </div>
    </form>
  );
};