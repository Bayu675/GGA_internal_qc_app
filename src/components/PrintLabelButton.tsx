"use client";

import React from 'react';
import { Button } from './Button';

// Struktur dasar satu item label
interface LabelItem {
  customerName: string;
  soNumber: string;
  itemCode: string;
  width: number;
  height: number;
}

// Menyatukan tipe: Bisa menerima props satuan (seperti cara lama lo) ATAU props massal (pake array data)
interface PrintLabelProps {
  customerName?: string;
  soNumber?: string;
  itemCode?: string;
  width?: number;
  height?: number;
  data?: LabelItem[]; // Untuk cetak massal jika diisi array
}

export const PrintLabelButton: React.FC<PrintLabelProps> = ({ 
  customerName, 
  soNumber, 
  itemCode, 
  width, 
  height,
  data 
}) => {
  
  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Menentukan daftar item yang mau dicetak
    let itemsToPrint: LabelItem[] = [];

    if (data && Array.isArray(data)) {
      // Jika dikirim data array (Massal)
      itemsToPrint = data;
    } else if (customerName && soNumber && itemCode && width !== undefined && height !== undefined) {
      // Jika dikirim eceran/satuan via props individual (Cara lama lo)
      itemsToPrint = [{ customerName, soNumber, itemCode, width, height }];
    }

    if (itemsToPrint.length === 0) return;

    // Generate konten HTML untuk semua label yang masuk daftar cetak
    const labelsHTML = itemsToPrint.map((item) => {
      const formattedSO = `SO/${item.soNumber.split('/').slice(1).join('/')}`;
      return `
        <div class="print-page">
          <div class="title">${item.customerName.toUpperCase()}</div>
          <div class="so">${formattedSO}</div>
          <div class="footer-row">
            <div class="sku">${item.itemCode}</div>
            <div class="dimension">${item.width}x${item.height}</div>
          </div>
        </div>
      `;
    }).join('');

    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page {
              size: 80mm 50mm;
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              color: #000000;
              font-family: Arial, sans-serif;
            }
            .print-page {
              width: 80mm;
              height: 50mm;
              padding: 5mm 6mm 4mm 6mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              page-break-after: always;
              page-break-inside: avoid;
            }
            .print-page:last-child {
              page-break-after: auto;
            }
            .title {
              font-size: 8pt;
              font-weight: bold;
              margin-bottom: 2px;
              line-height: 1.2;
            }
            .so {
              font-size: 16pt;
              font-weight: bold;
              margin-bottom: 6px;
              line-height: 1.1;
            }
            .footer-row {
              border-top: 3px solid #000000;
              padding-top: 5px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .sku {
              font-size: 11pt;
              font-weight: bold;
              line-height: 1.2;
              word-break: break-all;
              padding-right: 6px;
            }
            .dimension {
              font-size: 11pt;
              font-weight: bold;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          ${labelsHTML}
        </body>
      </html>
    `);
    
    iframeDoc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  // Menentukan jumlah total item untuk label teks tombol
  const totalItems = data ? data.length : 1;

  return (
    <Button 
      variant="secondary" 
      onClick={handlePrint}
      className="w-full text-sm py-1 md:py-2 border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center gap-2"
    >
      🖨️ {data ? `Cetak Massal (${totalItems} Label)` : 'Cetak Label 80x50mm'}
    </Button>
  );
};