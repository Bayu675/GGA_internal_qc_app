// src/components/DashboardFilters.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from './Input';
import { Button } from './Button';
import { BarcodeScanner } from './BarcodeScanner';

interface DashboardFiltersProps {
  tab: 'pending' | 'completed';
  initialSearch: string;
  initialDate: string;
  initialCustomer: string;
  customerList: string[];
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  tab, initialSearch, initialDate, initialCustomer, customerList
}) => {
  const router = useRouter();
  
  // State untuk Real-time Search
  const [searchText, setSearchText] = useState(initialSearch);
  const [dateValue, setDateValue] = useState(initialDate);
  const [customerValue, setCustomerValue] = useState(initialCustomer);

  // State untuk Modal Export
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [expStartDate, setExpStartDate] = useState("");
  const [expEndDate, setExpEndDate] = useState("");
  const [expCustomer, setExpCustomer] = useState("");

  // EFEK DEBOUNCE: Otomatis mencari data 500ms setelah user berhenti mengetik/merubah opsi
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('tab', tab);
      if (searchText) params.set('search', searchText);
      if (dateValue) params.set('date', dateValue);
      if (customerValue) params.set('customer', customerValue);

      // Update URL tanpa reload halaman (Otomatis memicu Prisma di page.tsx buat nge-fetch)
      router.push(`/?${params.toString()}`);
    }, 500); // 500ms jeda

    return () => clearTimeout(timer);
  }, [searchText, dateValue, customerValue, tab, router]);

  // Eksekusi Export
  const handleDownloadExcel = () => {
    const params = new URLSearchParams();
    if (expStartDate) params.set('startDate', expStartDate);
    if (expEndDate) params.set('endDate', expEndDate);
    if (expCustomer) params.set('customerName', expCustomer);
    
    window.open(`/api/export?${params.toString()}`, '_blank');
    setIsExportOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      
      {/* BARIS 1: Tombol Export & Action */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-2 w-full border-b pb-4">
        <Button variant="secondary" className="w-full sm:w-auto text-sm" onClick={() => setIsExportOpen(true)}>
          📥 Export Excel (Filter)
        </Button>
      </div>

      {/* BARIS 2: Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-end">
        
        {/* Tombol Scanner Keren */}
        <div className="w-full lg:w-auto">
          <BarcodeScanner onScan={(text) => setSearchText(text)} />
        </div>

        <div className="flex-1 w-full flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-500">Pencarian Otomatis</span>
          <Input 
            placeholder="Ketik SO, Barang, atau arahkan Barcode..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="w-full lg:w-1/4 flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-500">Filter Toko / Customer</span>
          <select
            value={customerValue}
            onChange={(e) => setCustomerValue(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 w-full bg-white h-[42px]"
          >
            <option value="">Semua Toko</option>
            {customerList.map((cust, idx) => (
              <option key={idx} value={cust}>{cust}</option>
            ))}
          </select>
        </div>

        <div className="w-full lg:w-1/4 flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-500">Tanggal Masuk (Harian)</span>
          <Input 
            type="date" 
            value={dateValue} 
            onChange={(e) => setDateValue(e.target.value)} 
          />
        </div>
      </div>

      {/* --- MODAL EXPORT --- */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Export Data Laporan</h3>
            
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Dari Tanggal</label>
                  <Input type="date" value={expStartDate} onChange={(e) => setExpStartDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Sampai Tanggal</label>
                  <Input type="date" value={expEndDate} onChange={(e) => setExpEndDate(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Pilih Toko Tertentu (Opsional)</label>
                <select
                  value={expCustomer}
                  onChange={(e) => setExpCustomer(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">Semua Toko</option>
                  {customerList.map((cust, idx) => (
                    <option key={idx} value={cust}>{cust}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="secondary" onClick={() => setIsExportOpen(false)}>Batal</Button>
                <Button variant="primary" onClick={handleDownloadExcel}>Download Excel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};