"use server";

import { read, utils } from "xlsx";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Interface representing the expected raw Excel row
interface RawExcelRow {
  "No. SO"?: string;
  Customer?: string;
  "Kode Barang"?: string;
  "Nama Barang"?: string;
  Lebar?: string | number;
  Tinggi?: string | number;
  "Qty Order"?: string | number;
}

// Interface for predictable Server Action return types
interface ImportActionResponse {
  success: boolean;
  count?: number;
  error?: string;
  requireConfirmation?: boolean;
  message?: string;
}

export async function importExcelAction(formData: FormData): Promise<ImportActionResponse> {
  try {
    const file = formData.get("file") as File | null;

    if (!file) {
      return { success: false, error: "No file uploaded" };
    }

    const force = formData.get("force") === "true";

    // Convert File to Buffer for xlsx parser
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the workbook
    const workbook = read(buffer, { type: "buffer" });
    if (workbook.SheetNames.length === 0) {
      return { success: false, error: "Excel file is empty" };
    }

    // Read the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert sheet to JSON array
    const rawData = utils.sheet_to_json<RawExcelRow>(worksheet, { defval: "" });

    if (rawData.length === 0) {
      return { success: false, error: "No data found in the Excel sheet" };
    }

    // Sanitize and map data
    const sanitizedData = [];

    for (const row of rawData) {
      if (!row["No. SO"]) continue;

      sanitizedData.push({
        soNumber: String(row["No. SO"]).trim(),
        customerName: String(row["Customer"] || "-").trim(),
        itemCode: String(row["Kode Barang"] || "-").trim(),
        itemName: String(row["Nama Barang"] || "-").trim(),
        width: Number(row["Lebar"]) || 0,
        height: Number(row["Tinggi"]) || 0,
        qtyOrder: Number(row["Qty Order"]) || 1,
      });
    }

    if (sanitizedData.length === 0) {
      return { success: false, error: "No valid rows found to import" };
    }

    // --- BLOK VALIDASI DUPLIKAT ---
    if (!force) {
      const soNumbers = sanitizedData.map(d => d.soNumber);
      const existingItems = await prisma.returnItem.findMany({
        where: { soNumber: { in: soNumbers } },
        select: { soNumber: true, itemCode: true }
      });

      if (existingItems.length > 0) {
        const duplicates = sanitizedData.filter(d =>
          existingItems.some(e => e.soNumber === d.soNumber && e.itemCode === d.itemCode)
        );

        if (duplicates.length > 0) {
          return {
            success: false,
            requireConfirmation: true,
            message: `⚠️ Peringatan: Ada ${duplicates.length} data yang sudah ada di sistem (Contoh: SO ${duplicates[0].soNumber} - ${duplicates[0].itemCode}).\n\nYakin ingin tetap memaksakan input data ini?`
          };
        }
      }
    }

    // Batch insert into SQLite using Prisma
    const result = await prisma.returnItem.createMany({
      data: sanitizedData,
    });

    // Otomatis refresh data di Dashboard tanpa perlu router.refresh() di client
    revalidatePath("/");

    return { success: true, count: result.count };

  } catch (error: unknown) {
    console.error("Import Action Error:", error);
    return { success: false, error: "Internal Server Error saat memproses Excel" };
  }
}