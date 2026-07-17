"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CameraCapture } from "./CameraCapture";
import { Button } from "./Button";
import { Input } from "./Input";
import { editItemAction } from "@/app/actions";

interface EditFormProps {
  item: any; // We receive the joined Prisma model (ReturnItem + QCResult)
}

export const EditForm: React.FC<EditFormProps> = ({ item }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 1. Master Data State
  const [soNumber, setSoNumber] = useState(item.soNumber);
  const [customerName, setCustomerName] = useState(item.customerName);
  const [itemCode, setItemCode] = useState(item.itemCode);
  const [itemName, setItemName] = useState(item.itemName);
  const [width, setWidth] = useState(item.width);
  const [height, setHeight] = useState(item.height);
  const [qtyOrder, setQtyOrder] = useState(item.qtyOrder);

  // 2. QC Data State
  const [status, setStatus] = useState<"PENDING" | "GOOD" | "BAD" | "PARTIAL_GOOD">(item.qcStatus);
  const [damageNotes, setDamageNotes] = useState(item.qcResult?.damageNotes || "");
  
  // General Photo
  const [existingGeneralPhoto, setExistingGeneralPhoto] = useState<string | null>(item.qcResult?.generalPhotoUrl || null);
  const [newGeneralPhotoBase64, setNewGeneralPhotoBase64] = useState<string>("");

  // Damage Photos
  const parseOldDamageUrls = () => {
    if (!item.qcResult?.damagePhotoUrl) return [];
    try { return JSON.parse(item.qcResult.damagePhotoUrl); } 
    catch { return [item.qcResult.damagePhotoUrl]; }
  };
  const [keptDamagePhotos, setKeptDamagePhotos] = useState<string[]>(parseOldDamageUrls());
  const [newDamagePhotosBase64, setNewDamagePhotosBase64] = useState<string[]>([]);

  // Handlers for photos
  const handleRemoveKeptPhoto = (urlToRemove: string) => {
    setKeptDamagePhotos((prev) => prev.filter((url) => url !== urlToRemove));
  };
  const handleRemoveNewPhoto = (index: number) => {
    setNewDamagePhotosBase64((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!soNumber || !itemName || !itemCode) return setError("Data master (SO, Kode, Nama) wajib diisi!");
    if (status !== "PENDING") {
      if (!existingGeneralPhoto && !newGeneralPhotoBase64) return setError("Foto fisik wajib ada!");
      if (status !== "GOOD" && keptDamagePhotos.length === 0 && newDamagePhotosBase64.length === 0) {
        return setError("Minimal 1 foto bukti rusak wajib disertakan!");
      }
      if (status !== "GOOD" && !damageNotes) return setError("Keterangan minus wajib diisi!");
    }

    startTransition(async () => {
      const res = await editItemAction({
        id: item.id,
        soNumber, customerName, itemCode, itemName,
        width: Number(width), height: Number(height), qtyOrder: Number(qtyOrder),
        status,
        newGeneralPhotoBase64: newGeneralPhotoBase64 || undefined,
        keptDamagePhotoUrls: keptDamagePhotos,
        newDamagePhotosBase64,
        damageNotes,
      });

      if (res.success) {
        alert("Data berhasil diperbarui!");
        router.push(status === "PENDING" ? "/?tab=pending" : "/?tab=completed");
      } else {
        setError(res.error || "Gagal menyimpan data");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}

      {/* --- MASTER DATA SECTION --- */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col gap-4">
        <h2 className="font-bold text-gray-800 border-b pb-2">Master Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="No. SO" value={soNumber} onChange={(e) => setSoNumber(e.target.value)} required />
          <Input label="Customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          <Input label="Kode Barang" value={itemCode} onChange={(e) => setItemCode(e.target.value)} required />
          <Input label="Nama Barang" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Lebar" type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
            <Input label="Tinggi" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
          <Input label="Qty Order" type="number" value={qtyOrder} onChange={(e) => setQtyOrder(e.target.value)} required />
        </div>
      </div>

      {/* --- QC DATA SECTION --- */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col gap-4">
        <h2 className="font-bold text-gray-800 border-b pb-2">Data Quality Control</h2>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Status Barang</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-3 w-full bg-white text-gray-800 focus:ring-green-500"
          >
            <option value="PENDING">Belum Dicek (PENDING)</option>
            <option value="GOOD">✅ GOOD (Bagus)</option>
            <option value="PARTIAL_GOOD">⚠️ PARTIAL GOOD (Bagus Sebagian)</option>
            <option value="BAD">❌ BAD (Rusak Parah)</option>
          </select>
        </div>

        {status !== "PENDING" && (
          <>
            {/* General Photo Edit */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-sm font-semibold text-gray-700">Foto Fisik Keseluruhan</label>
              {!newGeneralPhotoBase64 && existingGeneralPhoto ? (
                <div className="relative aspect-[4/3] w-full max-w-sm bg-black rounded-md overflow-hidden">
                  <img src={existingGeneralPhoto} alt="Existing Fisik" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setExistingGeneralPhoto(null)} className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-md">
                    Hapus & Ganti Foto
                  </button>
                </div>
              ) : (
                <CameraCapture label="Ambil Foto Fisik Baru" onCapture={setNewGeneralPhotoBase64} />
              )}
            </div>

            {/* Damage Photos & Notes Edit */}
            {(status === "BAD" || status === "PARTIAL_GOOD") && (
              <div className="flex flex-col gap-4 mt-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">Foto Bukti Rusak / Minus</label>
                  
                  {/* Grid for Kept & New Photos */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {/* Kept Photos from DB */}
                    {keptDamagePhotos.map((url, idx) => (
                      <div key={`kept-${idx}`} className="relative aspect-[4/3] bg-black rounded-md overflow-hidden">
                        <img src={url} alt={`Lama ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 bg-black bg-opacity-50 text-white text-[10px] w-full text-center">Foto Lama</span>
                        <button type="button" onClick={() => handleRemoveKeptPhoto(url)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs w-6 h-6 flex items-center justify-center">X</button>
                      </div>
                    ))}
                    
                    {/* Newly Captured Photos */}
                    {newDamagePhotosBase64.map((photo, idx) => (
                      <div key={`new-${idx}`} className="relative aspect-[4/3] bg-black rounded-md overflow-hidden border-2 border-green-500">
                        <img src={photo} alt={`Baru ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 bg-green-600 text-white text-[10px] w-full text-center font-bold">Baru</span>
                        <button type="button" onClick={() => handleRemoveNewPhoto(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs w-6 h-6 flex items-center justify-center">X</button>
                      </div>
                    ))}
                  </div>
                  
                  <CameraCapture label="+ Tambah Foto Rusak" onCapture={(b64) => setNewDamagePhotosBase64(p => [...p, b64])} />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Keterangan Minus</label>
                  <textarea
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-orange-500 min-h-[100px]"
                    placeholder="Contoh: Lecet di bagian kanan atas..."
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()} disabled={isPending}>
          Batal
        </Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
};