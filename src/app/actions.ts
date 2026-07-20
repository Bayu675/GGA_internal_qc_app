"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export async function bulkDeleteReturnItems(ids: string[]) {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, error: "Tidak ada data yang dipilih" };
    }

    // Hapus data anak (QCResult) terlebih dahulu untuk menghindari constraint error
    await prisma.qCResult.deleteMany({
      where: { returnItemId: { in: ids } },
    });

    // 1. Ambil data yang mau dihapus buat ngecek fotonya
    const itemsToDelete = await prisma.returnItem.findMany({
      where: { id: { in: ids } },
      include: { qcResult: true }
    });

    // 2. Hapus semua foto fisik dari hardisk biar gak menuh-menuhin
    for (const item of itemsToDelete) {
      if (item.qcResult) {
        if (item.qcResult.generalPhotoUrl) await deleteLocalFile(item.qcResult.generalPhotoUrl);
        if (item.qcResult.damagePhotoUrl) {
          let oldUrls: string[] = [];
          try { oldUrls = JSON.parse(item.qcResult.damagePhotoUrl); } 
          catch { oldUrls = [item.qcResult.damagePhotoUrl]; }
          for (const u of oldUrls) await deleteLocalFile(u);
        }
      }
    }

    // 3. Hapus data QCResult dulu (mencegah error foreign key)
    await prisma.qCResult.deleteMany({
      where: { returnItemId: { in: ids } }
    });

    const result = await prisma.returnItem.deleteMany({
      where: { id: { in: ids } },
    });

    // Otomatis refresh data di Dashboard
    revalidatePath("/");
    
    return { success: true, count: result.count };
  } catch (error: unknown) {
    console.error("Bulk Delete Action Error:", error);
    return { success: false, error: "Internal Server Error saat menghapus data" };
  }
}

// Interface for QC Form payload
interface QCSubmitPayload {
  returnItemId: string;
  status: "GOOD" | "BAD" | "PARTIAL_GOOD";
  generalPhotoBase64: string;
  damagePhotosBase64?: string[];
  damageNotes?: string;
}

// Helper to save base64 image to local filesystem
async function saveBase64Image(base64String: string, prefix: string): Promise<string> {
  // Remove the data:image/jpeg;base64, part
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const fileName = `${prefix}-${crypto.randomBytes(4).toString("hex")}-${Date.now()}.jpg`;
  
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadDir, fileName);
  
  // Ensure directory exists, just in case
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, buffer);
  
  return `/uploads/${fileName}`; // Return relative URL for frontend
}

// Helper to delete physical file from local filesystem
async function deleteLocalFile(fileUrl: string) {
  if (!fileUrl) return;
  try {
    const filePath = path.join(process.cwd(), "public", fileUrl);
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Gagal menghapus file lama (mungkin sudah terhapus):", fileUrl);
  }
}

export async function submitQCAction(payload: QCSubmitPayload) {
  try {
    // 1. Save general photo
    const generalPhotoUrl = await saveBase64Image(payload.generalPhotoBase64, "general");
    
    // 2. Save damage photo if exists and status is not GOOD
    let damagePhotoUrl = null;
        if (payload.status !== "GOOD" && payload.damagePhotosBase64 && payload.damagePhotosBase64.length > 0) {
      // Save all photos concurrently and stringify the array of paths
      const savedUrls = await Promise.all(
        payload.damagePhotosBase64.map((base64) => saveBase64Image(base64, "damage"))
      );
      damagePhotoUrl = JSON.stringify(savedUrls);
    }

    // 3. Save to database using Prisma Transaction
    await prisma.$transaction([
      prisma.qCResult.create({
        data: {
          returnItemId: payload.returnItemId,
          finalStatus: payload.status,
          generalPhotoUrl,
          damagePhotoUrl,
          damageNotes: payload.status !== "GOOD" ? payload.damageNotes : null,
        },
      }),
      prisma.returnItem.update({
        where: { id: payload.returnItemId },
        data: { qcStatus: payload.status },
      })
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("Submit QC Action Error:", error);
    return { success: false, error: "Gagal menyimpan data QC" };
  }
}


// Interface for Edit Form payload
export interface EditItemPayload {
  id: string;
  soNumber: string;
  customerName: string;
  itemCode: string;
  itemName: string;
  width: number;
  height: number;
  qtyOrder: number;
  status: "PENDING" | "GOOD" | "BAD" | "PARTIAL_GOOD";
  newGeneralPhotoBase64?: string;
  keptDamagePhotoUrls: string[];
  newDamagePhotosBase64: string[];
  damageNotes: string;
}

export async function editItemAction(payload: EditItemPayload) {
  try {
    // 1. Fetch existing data to compare photos
    const existing = await prisma.returnItem.findUnique({
      where: { id: payload.id },
      include: { qcResult: true }
    });

    if (!existing) return { success: false, error: "Data tidak ditemukan" };

    // 2. Update Master Data (Teks)
    await prisma.returnItem.update({
      where: { id: payload.id },
      data: {
        soNumber: payload.soNumber,
        customerName: payload.customerName,
        itemCode: payload.itemCode,
        itemName: payload.itemName,
        width: payload.width,
        height: payload.height,
        qtyOrder: payload.qtyOrder,
        qcStatus: payload.status,
      }
    });

    // 3. Update QC Data (Jika status bukan PENDING)
    if (payload.status !== "PENDING") {
      let finalGeneralUrl = existing.qcResult?.generalPhotoUrl || "";
      
      // Jika ada foto fisik baru, hapus yang lama, simpan yang baru
      if (payload.newGeneralPhotoBase64) {
        if (existing.qcResult?.generalPhotoUrl) await deleteLocalFile(existing.qcResult.generalPhotoUrl);
        finalGeneralUrl = await saveBase64Image(payload.newGeneralPhotoBase64, "general");
      }

      let finalDamageUrls = [...payload.keptDamagePhotoUrls];
      
      // Hapus foto damage lama yang tidak di-keep (dihapus user dari UI)
      if (existing.qcResult?.damagePhotoUrl) {
        let oldUrls: string[] = [];
        try {
          oldUrls = JSON.parse(existing.qcResult.damagePhotoUrl);
        } catch {
          oldUrls = [existing.qcResult.damagePhotoUrl];
        }
        for (const oldUrl of oldUrls) {
          if (!payload.keptDamagePhotoUrls.includes(oldUrl)) {
            await deleteLocalFile(oldUrl);
          }
        }
      }

      // Simpan foto damage baru jika ada
      if (payload.newDamagePhotosBase64.length > 0) {
        const newUrls = await Promise.all(
          payload.newDamagePhotosBase64.map((b64) => saveBase64Image(b64, "damage"))
        );
        finalDamageUrls = [...finalDamageUrls, ...newUrls];
      }

      const damageNotes = payload.status === "GOOD" ? null : payload.damageNotes;
      const damagePhotoUrl = payload.status === "GOOD" || finalDamageUrls.length === 0 
        ? null 
        : JSON.stringify(finalDamageUrls);

      // Update atau Create (Upsert) QC Result
      await prisma.qCResult.upsert({
        where: { returnItemId: payload.id },
        update: { finalStatus: payload.status, generalPhotoUrl: finalGeneralUrl, damagePhotoUrl, damageNotes },
        create: { returnItemId: payload.id, finalStatus: payload.status as "GOOD" | "BAD" | "PARTIAL_GOOD", generalPhotoUrl: finalGeneralUrl, damagePhotoUrl, damageNotes }
      });
    }

    // Refresh tampilan
    revalidatePath("/");
    revalidatePath(`/qc/${payload.id}`);
    revalidatePath(`/edit/${payload.id}`);
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Edit Action Error:", error);
    return { success: false, error: "Gagal menyimpan perubahan data" };
  }
}