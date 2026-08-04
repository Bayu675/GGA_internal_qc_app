"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { bulkDeleteReturnItems } from '@/app/actions';

// Strict interface matching Prisma's generated type for the subset we need
export interface TableItem {
  id: string;
  soNumber: string;
  customerName: string;
  itemCode: string;
  itemName: string;
  width: number;
  height: number;
  qtyOrder: number;
  qcStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReturnItemTableProps {
  items: TableItem[];
  tab: 'pending' | 'completed';
}

export const ReturnItemTable: React.FC<ReturnItemTableProps> = ({ items, tab }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(items.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    const confirmDelete = window.confirm(`Yakin mau hapus ${selectedIds.length} data ini?`);
    if (!confirmDelete) return;

    startTransition(async () => {
      const res = await bulkDeleteReturnItems(selectedIds);
      if (res.success) {
        alert(`Berhasil menghapus ${res.count} data!`);
        setSelectedIds([]); // Reset selection setelah berhasil hapus
      } else {
        alert(res.error || "Gagal menghapus data");
      }
    });
  };

  // --- LOGIC TERBARU FIX CETAK MASSAL MENGGUNAKAN IFRAME TERISOLASI ---
  const handleBulkPrint = () => {
    const selectedItemsData = items.filter(item => selectedIds.includes(item.id));
    if (selectedItemsData.length === 0) return;

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

    // Generate HTML dengan Barcode untuk cetak massal
    const labelsHTML = selectedItemsData.map((item) => {
      const cleanSO = item.soNumber; 
      const formattedSO = `SO/${item.soNumber.split('/').slice(1).join('/')}`;
      
      return `
        <div class="print-page">
          <div class="title">${item.customerName.toUpperCase()}</div>
          <div class="so">${formattedSO}</div>
          
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

    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="/js/JsBarcode.all.min.js"></script>
          <style>
            @page { size: 80mm 50mm; margin: 0; }
            html, body { margin: 0; padding: 0; background-color: #ffffff; color: #000000; font-family: Arial, sans-serif; }
            .print-page {
              width: 80mm; height: 50mm; padding: 3mm 6mm 3mm 6mm;
              box-sizing: border-box; display: flex; flex-direction: column;
              justify-content: flex-start; page-break-after: always; page-break-inside: avoid;
            }
            .print-page:last-child { page-break-after: auto; }
            .title { font-size: 8pt; font-weight: bold; margin-bottom: 2px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .so { font-size: 13pt; font-weight: bold; margin-bottom: 2px; line-height: 1.1; }
            .barcode-container { flex-grow: 1; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; width: 100%; overflow: hidden; }
            .barcode-container svg { width: 100%; max-height: 100%; }
            .footer-row { border-top: 2px solid #000000; padding-top: 3px; display: flex; justify-content: space-between; align-items: flex-start; }
            .sku { font-size: 10pt; font-weight: bold; line-height: 1.2; word-break: break-all; padding-right: 6px; }
            .dimension { font-size: 10pt; font-weight: bold; white-space: nowrap; }
          </style>
        </head>
        <body>
          ${labelsHTML}
          <script>
            window.onload = function() {
              JsBarcode(".barcode").init();
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

    setTimeout(() => {
    try { document.body.removeChild(iframe); } catch(e){}
    }, 3000);
  };


  return (
    <div className="flex flex-col gap-4">
      {/* Action Bar muncul cuma kalo ada yang di-select */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedIds.length > 0 ? 'max-h-20 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
        <div className="bg-red-50 border border-red-200 p-3 rounded-md flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-bold text-red-800 text-sm">{selectedIds.length} Data Dipilih</span>
            {selectedIds.length === items.length && items.length > 0 && (
              <span className="text-[10px] text-red-600">*(Hanya data di halaman ini)</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleBulkPrint} className="bg-white hover:bg-gray-100 text-gray-800 text-xs py-1 px-3 border border-gray-300">
              🖨️ Cetak Massal
            </Button>
            <Button variant="danger" onClick={handleBulkDelete} disabled={isPending} className="text-xs py-1 px-3">
              {isPending ? '...' : 'Hapus Massal'}
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto border rounded-lg">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-white uppercase bg-green-700">
            <tr>
              <th className="px-4 py-3 text-center w-10"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === items.length && items.length > 0} /></th>
              <th className="px-4 py-3">Tgl Masuk</th>
              <th className="px-4 py-3">No. SO</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Kode / Nama Barang</th>
              <th className="px-4 py-3 text-center">Ukuran (L x T)</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3">Tgl Edit</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  Tidak ada data barang ditemukan.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className={`border-b hover:bg-gray-50 ${selectedIds.includes(item.id) ? 'bg-green-50' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', ':')}
                  </td>
                 <td className="px-4 py-3 font-medium text-gray-900">
                    {item.soNumber}
                    {item.soNumber.includes('- R') && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        ⚠️ RETURN BERULANG
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.customerName}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{item.itemCode}</div>
                    <div className="text-xs">{item.itemName}</div>
                  </td>
                  <td className="px-4 py-3 text-center">{item.width} x {item.height}</td>
                  <td className="px-4 py-3 text-center font-bold">{item.qtyOrder}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.qcStatus === 'PENDING' ? 'bg-gray-200' : item.qcStatus === 'GOOD' ? 'bg-green-100' : item.qcStatus === 'BAD' ? 'bg-red-100' : 'bg-orange-100'}`}>{item.qcStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(item.updatedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', ':')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <Link href={`/qc/${item.id}`}><Button variant={tab === 'pending' ? 'primary' : 'secondary'} className="text-xs py-1 px-2">{tab === 'pending' ? 'Cek' : 'Detail'}</Button></Link>
                      <Link href={`/edit/${item.id}`}><Button className="text-xs py-1 px-2 bg-yellow-500 hover:bg-yellow-600 text-white">Edit</Button></Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE CARD VIEW (Hidden on Desktop) --- */}
      <div className="md:hidden flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className={`p-4 border rounded-lg shadow-sm bg-white ${selectedIds.includes(item.id) ? 'border-green-500 bg-green-50' : ''}`}>
            <div className="flex items-start justify-between">
              <label className="flex items-center gap-3 cursor-pointer w-full">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-green-600" checked={selectedIds.includes(item.id)} onChange={(e) => handleSelectItem(item.id, e.target.checked)} />
                <div>
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    {item.soNumber}
                    {item.soNumber.includes('- R') && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-800 border border-red-200">R2</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{item.customerName}</div>
                </div>
              </label>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.qcStatus === 'GOOD' ? 'bg-green-100 text-green-700' : item.qcStatus === 'BAD' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                {item.qcStatus}
              </span>
            </div>
            
            <div className="mt-3 text-xs text-gray-600 border-t pt-2 grid grid-cols-2 gap-2">
              <div><span className="font-bold">Barang:</span> {item.itemName}</div>
              <div><span className="font-bold">Qty:</span> {item.qtyOrder}</div>
              <div className="col-span-2 mt-1 border-t border-dashed pt-1 flex justify-between text-[10px] text-gray-400">
                <span>Masuk: {new Date(item.createdAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', ':')}</span>
                <span>Edit: {new Date(item.updatedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace('.', ':')}</span>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Link href={`/qc/${item.id}`} className="flex-1">
                <Button variant={tab === 'pending' ? 'primary' : 'secondary'} className="w-full py-1 text-xs">
                  {tab === 'pending' ? 'Cek QC' : 'Detail'}
                </Button>
              </Link>
              <Link href={`/edit/${item.id}`} className="flex-1">
                <Button className="w-full py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white">Edit</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};