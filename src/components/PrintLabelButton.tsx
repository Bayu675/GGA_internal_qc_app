"use client";

import React from 'react';
import { Button } from './Button';

interface PrintLabelProps {
  customerName: string;
  soNumber: string;
  itemCode: string;
  width: number;
  height: number;
}

export const PrintLabelButton: React.FC<PrintLabelProps> = ({ 
  customerName, 
  soNumber, 
  itemCode, 
  width, 
  height 
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

    const formattedSO = `SO/${soNumber.split('/').slice(1).join('/')}`;

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
              width: 80mm;
              height: 50mm;
              font-family: Arial, sans-serif;
              background-color: #ffffff;
              color: #000000;
              box-sizing: border-box;
            }
            .label-box {
              width: 80mm;
              height: 50mm;
              padding: 5mm 6mm 4mm 6mm; /* Jarak padding atas disesuaikan biar proporsional */
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: flex-start; /* Mengubah posisi konten agar mulai dari atas kertas, bukan di tengah */
            }
            .title {
              font-size: 8pt;
              font-weight: bold;
              margin-bottom: 2px;
              line-height: 1.2;
              text-transform: uppercase;
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
          <div class="label-box">
            <div class="title">${customerName}</div>
            <div class="so">${formattedSO}</div>
            <div class="footer-row">
              <div class="sku">${itemCode}</div>
              <div class="dimension">${width}x${height}</div>
            </div>
          </div>
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

  return (
    <Button 
      variant="secondary" 
      onClick={handlePrint}
      className="w-full text-sm py-1 md:py-2 border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center gap-2"
    >
      🖨️ Cetak Label 80x50mm
    </Button>
  );
};