import { NextRequest, NextResponse } from "next/server";
import { read, utils } from "xlsx";
import { prisma } from "@/lib/prisma";
import { AppError, asyncHandler } from "@/lib/api-utils";

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

// Interface for the sanitized data ready for database insertion
interface CreateReturnItemInput {
  soNumber: string;
  customerName: string;
  itemCode: string;
  itemName: string;
  width: number;
  height: number;
  qtyOrder: number;
}

const importExcelHandler = async (req: NextRequest): Promise<NextResponse> => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new AppError("No file uploaded", 400);
  }

  // Convert File to Buffer for xlsx parser
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Parse the workbook
  const workbook = read(buffer, { type: "buffer" });
  if (workbook.SheetNames.length === 0) {
    throw new AppError("Excel file is empty", 400);
  }

  // Read the first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to JSON array
  const rawData = utils.sheet_to_json<RawExcelRow>(worksheet, { defval: "" });

  if (rawData.length === 0) {
    throw new AppError("No data found in the Excel sheet", 400);
  }

  // Sanitize and map data
  const sanitizedData: CreateReturnItemInput[] = [];

  for (const row of rawData) {
    // Skip empty rows by checking primary identifier
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
    throw new AppError("No valid rows found to import", 400);
  }

  // Batch insert into SQLite using Prisma
  const result = await prisma.returnItem.createMany({
    data: sanitizedData,
  });

  return NextResponse.json({
    success: true,
    message: `Successfully imported ${result.count} items`,
    data: { count: result.count },
  }, { status: 201 });
};

// Export the wrapped handler for the POST method
export async function POST(request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  return asyncHandler(importExcelHandler)(request, context);  
}