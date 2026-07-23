"use client";

import React from 'react';
import { Button } from './Button';

interface LabelItem {
  customerName: string;
  soNumber: string;
  itemCode: string;
  width: number;
  height: number;
}

interface PrintLabelProps {
  customerName?: string;
  soNumber?: string;
  itemCode?: string;
  width?: number;
  height?: number;
  data?: LabelItem[]; 
}

export const PrintLabelButton: React.FC<PrintLabelProps> = ({ 
  customerName, soNumber, itemCode, width, height, data 
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

    let itemsToPrint: LabelItem[] = [];

    if (data && Array.isArray(data)) {
      itemsToPrint = data;
    } else if (customerName && soNumber && itemCode && width !== undefined && height !== undefined) {
      itemsToPrint = [{ customerName, soNumber, itemCode, width, height }];
    }

    if (itemsToPrint.length === 0) return;

    // Generate HTML dengan tag SVG khusus untuk Barcode
    const labelsHTML = itemsToPrint.map((item) => {
      // Kita pakai SO Number sebagai value Barcode
      // Hapus karakter slash (/) sementara untuk barcode jika perlu, atau biarkan. Code128 support karakter /
      const cleanSO = item.soNumber; 
      const formattedSO = `SO/${item.soNumber.split('/').slice(1).join('/')}`;
      
      return `
        <div class="print-page">
          <div class="title">${item.customerName.toUpperCase()}</div>
          <div class="so">${formattedSO}</div>
          
          <!-- INI AREA UNTUK GARIS BARCODE -->
          <div class="barcode-container">
             <svg class="barcode"
                jsbarcode-value="${cleanSO}"
                jsbarcode-format="CODE128"
                jsbarcode-height="40"
                jsbarcode-width="1.5"
                jsbarcode-displayvalue="false"
                jsbarcode-margin="0">
             </svg>
          </div>

          <div class="footer-row">
            <div class="sku">${item.itemCode}</div>
            <div class="dimension">${item.width}x${item.height}</div>
          </div>
        </div>
      `;
    }).join('');

    // Kita inject JsBarcode via CDN dan jalankan otomatis pas iframe diload
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
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
              padding: 3mm 6mm 3mm 6mm;
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
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .so {
              font-size: 13pt;
              font-weight: bold;
              margin-bottom: 2px;
              line-height: 1.1;
            }
            .barcode-container {
              flex-grow: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 2px;
              width: 100%;
              overflow: hidden;
            }
            .barcode-container svg {
              width: 100%;
              max-height: 100%;
            }
            .footer-row {
              border-top: 2px solid #000000;
              padding-top: 3px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .sku {
              font-size: 10pt;
              font-weight: bold;
              line-height: 1.2;
              word-break: break-all;
              padding-right: 6px;
            }
            .dimension {
              font-size: 10pt;
              font-weight: bold;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          ${labelsHTML}
          
          <script>
            // Begitu script JsBarcode selesai dimuat, kita init garisnya lalu otomatis print
            window.onload = function() {
              JsBarcode(".barcode").init();
              
              // Kasih jeda dikit biar render SVG nya sempurna sebelum dialog print kebuka
              setTimeout(() => {
                window.focus();
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
    
    iframeDoc.close();

    // Hapus iframe setelah dialog print selesai (estimasi 2 detik)
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch(e){}
    }, 2000);
  };

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