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

  return (
    <div className="flex flex-col gap-4">
      {/* Action Bar muncul cuma kalo ada yang di-select */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-md flex justify-between items-center">
          <span className="font-bold text-red-800 text-sm">{selectedIds.length} Data Dipilih</span>
          <Button variant="danger" onClick={handleBulkDelete} disabled={isPending}>
            {isPending ? '...' : 'Hapus Massal'}
          </Button>
        </div>
      )}

      <div className="hidden md:block overflow-x-auto border rounded-lg">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-white uppercase bg-green-700">
            <tr>
              <th className="px-4 py-3 text-center w-10"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === items.length && items.length > 0} /></th>
              <th className="px-4 py-3">No. SO</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Kode / Nama Barang</th>
              <th className="px-4 py-3 text-center">Ukuran (L x T)</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-center">Status</th>
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