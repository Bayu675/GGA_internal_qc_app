// src/app/tarik-so/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface DraftItem {
  soNumber: string;
  customerName: string;
  itemCode: string;
  itemName: string;
  width: number;
  height: number;
  qtyOrder: number;
}

// FUNGSI BARU: Buat nge-ping server ETL (Cek Koneksi)
export async function checkEtlConnection() {
  try {
    // Tembak endpoint GET biasa buat mancing respon server
    const res = await fetch("http://localhost:3001/api/sales-orders?startDate=2000-01-01&endDate=2000-01-01", { 
      cache: 'no-store',
      // Timeout 3 detik biar nggak gantung kalau server mati
      signal: AbortSignal.timeout(3000) 
    });
    
    if (res.ok) {
      return { success: true, message: "🟢 TERHUBUNG (Port 3001 Aktif)" };
    } else {
      return { success: false, message: `🔴 SERVER ERROR (Status: ${res.status})` };
    }
  } catch (error: any) {
    return { success: false, message: `🔴 OFFLINE / MATI (${error.message})` };
  }
}

// Fungsi narik data
export async function fetchSOFromETL(soNumber: string) {
  const targetUrl = "http://localhost:3001/api/sales-orders/bulk";
  console.log(`[TARIK SO] -------------------------------------`);
  console.log(`[TARIK SO] Mencari SO: "${soNumber}" ke ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soNumbers: [soNumber] }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[TARIK SO] ❌ GAGAL! HTTP Status: ${response.status}`);
      console.error(`[TARIK SO] Detail Error API:`, errText);
      return { success: false, error: `Error dari server API: ${response.status} - ${errText}` };
    }

    const resData = await response.json();
    console.log(`[TARIK SO] ✅ BERHASIL! Ditemukan ${resData.data?.length || 0} SO.`);
    
    return resData;
  } catch (error: any) {
    console.error(`[TARIK SO] ❌ KONEKSI TERPUTUS:`, error.message);
    return { success: false, error: `Gagal terhubung ke Port 3001. Detail: ${error.message}` };
  }
}

// Fungsi simpan ke SQLite
export async function saveTarikSOAction(items: DraftItem[]) {
  try {
    if (items.length === 0) return { success: false, error: "Tidak ada data" };
    const result = await prisma.returnItem.createMany({ data: items });
    revalidatePath("/");
    return { success: true, count: result.count };
  } catch (error: any) {
    console.error(`[TARIK SO] ❌ GAGAL SIMPAN KE SQLITE:`, error.message);
    return { success: false, error: `Gagal simpan ke database QC: ${error.message}` };
  }
}