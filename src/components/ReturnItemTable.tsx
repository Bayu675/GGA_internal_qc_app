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

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return;
    window.print();
  };

  const selectedItemsData = items.filter(item => selectedIds.includes(item.id));


  return (
    <div className="flex flex-col gap-4">
      {/* Action Bar muncul cuma kalo ada yang di-select */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-md flex justify-between items-center">
          <span className="font-bold text-red-800 text-sm">{selectedIds.length} Data Dipilih</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleBulkPrint} className="bg-white hover:bg-gray-100 text-gray-800 text-xs py-1 px-3 border border-gray-300">
              🖨️ Cetak Massal
            </Button>
            <Button variant="danger" onClick={handleBulkDelete} disabled={isPending} className="text-xs py-1 px-3">
              {isPending ? '...' : 'Hapus Massal'}
            </Button>
          </div>
        </div>
      )}

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
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
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
                    {new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.soNumber}</td>
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
                    {new Date(item.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <div className="flex justify-center gap-2">
                      <Link href={`/qc/${item.id}`}><Button variant={tab === 'pending' ? 'primary' : 'secondary'} className="text-xs py-1 px-2">{tab === 'pending' ? 'Cek' : 'Detail'}</Button></Link>
                      <Link href={`/edit/${item.id}`}><Button className="text-xs py-1 px-2 bg-yellow-500 hover:bg-yellow-600 text-white">Edit</Button></Link>
                    </div>
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
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-green-600" checked={selectedIds.includes(item.id)} onChange={(e) => handleSelectItem(item.id, e.target.checked)} />
                <div>
                  <div className="font-bold text-gray-900">{item.soNumber}</div>
                  <div className="text-xs text-gray-500">{item.customerName}</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.qcStatus === 'GOOD' ? 'bg-green-100 text-green-700' : item.qcStatus === 'BAD' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                {item.qcStatus}
              </span>
            </div>
            
            <div className="mt-3 text-xs text-gray-600 border-t pt-2 grid grid-cols-2 gap-2">
              <div><span className="font-bold">Barang:</span> {item.itemName}</div>
              <div><span className="font-bold">Qty:</span> {item.qtyOrder}</div>
              <div className="col-span-2 mt-1 border-t border-dashed pt-1 flex justify-between text-[10px] text-gray-400">
                <span>Masuk: {new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                <span>Edit: {new Date(item.updatedAt).toLocaleDateString('id-ID')}</span>
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
      {/* --- HIDDEN CONTAINER FOR BULK PRINT --- */}
      <div id="printable-label-container" className="hidden">
        {selectedItemsData.map((item) => (
          <div key={`print-${item.id}`} className="print-page">
            <div style={{ fontFamily: 'sans-serif', color: '#000000', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 'clamp(18px, 6vw, 30px)', fontWeight: '900', marginBottom: '4px', lineHeight: '1.1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.customerName}
              </div>
              <div style={{ fontSize: 'clamp(16px, 5vw, 26px)', fontWeight: '500', marginBottom: '8px' }}>
                SO/{item.soNumber.split('/').slice(1).join('/')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '3px solid #000000', paddingTop: '6px' }}>
                <span style={{ fontWeight: '700', fontSize: 'clamp(16px, 4.5vw, 24px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }}>
                  {item.itemCode}
                </span>
                <span style={{ fontWeight: '900', fontSize: 'clamp(18px, 6vw, 30px)' }}>
                  {item.width}x{item.height}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};