// src/app/tarik-so/page.tsx
"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import Link from "next/link";
import { DraftItem, saveTarikSOAction, fetchSOFromETL, checkEtlConnection } from "./actions";

export default function TarikSOPage() {
  const router = useRouter();
  const [soInput, setSoInput] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  // State untuk Cek Koneksi
  const [connStatus, setConnStatus] = useState<{success: boolean, text: string}>({ success: false, text: "Mengecek koneksi..." });

  // Cek koneksi otomatis pas halaman dibuka
  useEffect(() => {
    pingServer();
  }, []);

  const pingServer = async () => {
    setConnStatus({ success: false, text: "Mengecek koneksi..." });
    const res = await checkEtlConnection();
    setConnStatus({ success: res.success, text: res.message });
  };

  const handleFetchSO = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSO = soInput.trim();
    if (!cleanSO) return;

    setIsFetching(true);
    setError(null);
    setDraftItems([]); // Reset tabel lama

    const resData = await fetchSOFromETL(cleanSO);

    // Skenario 1: Error Koneksi / Server Mati / Error API 500
    if (!resData.success) {
      setError(`KONEKSI / SERVER ERROR: ${resData.error}`);
      setIsFetching(false);
      pingServer(); // Refresh status indikator
      return;
    }

    // Skenario 2: Konek sukses, tapi data SO emang nggak ada di Postgres
    if (resData.success && resData.data.length === 0) {
      setError(`DATA KOSONG: Nomor SO "${cleanSO}" tidak ditemukan di database Postgres. Pastikan nomor sudah benar dan ETL sudah di-sync untuk tanggal tersebut.`);
      setIsFetching(false);
      return;
    }

    // Skenario 3: Sukses & Data Ketemu
    const newItems: DraftItem[] = resData.data.flatMap((order: any) =>
      order.items.map((item: any) => ({
        soNumber: order.soNumber,
        customerName: order.customer?.name || order.customerCode,
        itemCode: item.productCode,
        itemName: item.product?.name || "UNKNOWN",
        width: Number(item.width) || 0,
        height: Number(item.height) || 0,
        qtyOrder: Number(item.qty) || 0,
      }))
    );

    setDraftItems(newItems);
    setIsFetching(false);
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setDraftItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveToQC = () => {
    if (draftItems.length === 0) return;
    startTransition(async () => {
      const res = await saveTarikSOAction(draftItems);
      if (res.success) {
        alert(`Berhasil menyimpan ${res.count} item!`);
        router.push("/");
      } else setError(`GAGAL SIMPAN: ${res.error}`);
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-start justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        
        {/* HEADER & INDIKATOR KONEKSI */}
        <div className="mb-6 border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tarik Data SO Cepat</h1>
            <p className="text-sm text-gray-500 mt-1">Ambil data langsung dari server VFP.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors" onClick={pingServer} title="Klik untuk cek ulang koneksi">
            <span className="text-xs font-semibold text-gray-600">Status API VFP:</span>
            <span className={`text-xs font-bold ${connStatus.success ? 'text-green-600' : 'text-red-600'}`}>
              {connStatus.text}
            </span>
            <span className="text-xs ml-1">🔄</span>
          </div>
        </div>

        {/* AREA ERROR */}
        {error && (
          <div className="mb-6 p-4 text-sm text-red-800 bg-red-100 border border-red-300 rounded-md font-medium shadow-sm">
            ⚠️ {error}
          </div>
        )}

        {/* FORM CARI */}
        <form onSubmit={handleFetchSO} className="flex gap-2 mb-6">
          <Input 
            placeholder="Masukkan Nomor SO Persis Sesuai VFP (Contoh: SO/2607/3883)" 
            value={soInput}
            onChange={(e) => setSoInput(e.target.value)}
            className="flex-1 font-mono"
            required
          />
          <Button type="submit" disabled={isFetching || !connStatus.success} className={`${!connStatus.success ? 'bg-gray-400' : ''}`}>
            {isFetching ? "Mencari..." : "🔍 Cari SO"}
          </Button>
        </form>

        {/* TABEL PREVIEW */}
        {draftItems.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-white uppercase bg-blue-700">
                  <tr>
                    <th className="px-4 py-3">No. SO</th>
                    <th className="px-4 py-3">Barang</th>
                    <th className="px-4 py-3 text-center">Ukuran</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {draftItems.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.soNumber}</td>
                      <td className="px-4 py-3 font-semibold">{item.itemName} <br/><span className="text-xs font-normal text-gray-500">{item.itemCode}</span></td>
                      <td className="px-4 py-3 text-center">{item.width} x {item.height}</td>
                      <td className="px-4 py-3 text-center font-bold">{item.qtyOrder}</td>
                      <td className="px-4 py-3 text-center">
                        <Button type="button" variant="danger" className="text-xs py-1 px-2" onClick={() => handleRemoveItem(idx)}>❌ Hapus</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="secondary" onClick={() => setDraftItems([])} disabled={isPending}>Reset</Button>
              <Button type="button" variant="primary" onClick={handleSaveToQC} disabled={isPending}>
                {isPending ? "Menyimpan..." : "💾 Simpan ke Data Return"}
              </Button>
            </div>
          </div>
        )}

        {draftItems.length === 0 && (
          <div className="mt-4">
            <Link href="/">
              <Button variant="secondary" className="w-full sm:w-auto">Kembali ke Dashboard</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}