
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
  
  const [searchText, setSearchText] = useState(initialSearch);
  const [dateValue, setDateValue] = useState(initialDate);
  const [customerValue, setCustomerValue] = useState(initialCustomer); // Untuk filter tabel (Single)

  // State Modal Export
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [expStartDate, setExpStartDate] = useState("");
  const [expEndDate, setExpEndDate] = useState("");
  const [expSelectedCustomers, setExpSelectedCustomers] = useState<string[]>([]);
  const [expSearchToko, setExpSearchToko] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('tab', tab);
      if (searchText) params.set('search', searchText);
      if (dateValue) params.set('date', dateValue);
      if (customerValue) params.set('customer', customerValue);
      router.replace(`/?${params.toString()}`);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, dateValue, customerValue, tab, router]);

  const filteredCustomerList = customerList.filter(c => c.toLowerCase().includes(expSearchToko.toLowerCase()));

  // Logic Toggle Checkbox Toko
  const handleToggleCustomer = (custName: string) => {
    setExpSelectedCustomers(prev => 
      prev.includes(custName) 
        ? prev.filter(c => c !== custName) 
        : [...prev, custName]
    );
  };

  const handleSelectAll = () => setExpSelectedCustomers(customerList);
  const handleClearAll = () => setExpSelectedCustomers([]);

  // Buka tab baru buat download
  const handleDownloadExcel = () => {
    const params = new URLSearchParams();
    if (expStartDate) params.set('startDate', expStartDate);
    if (expEndDate) params.set('endDate', expEndDate);
    
    // Gabungin array nama toko pake tanda | (Pipa)
    if (expSelectedCustomers.length > 0) {
      params.set('customers', expSelectedCustomers.join('|'));
    }
    
    window.open(`/api/export?${params.toString()}`, '_blank');
    setIsExportOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-end items-center gap-2 w-full border-b pb-4">
        <Button variant="secondary" className="w-full sm:w-auto text-sm" onClick={() => setIsExportOpen(true)}>
          📥 Export Excel (Filter Khusus)
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-end">
        <div className="w-full lg:w-auto">
          <BarcodeScanner onScan={(text) => setSearchText(text)} />
        </div>
        <div className="flex-1 w-full flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-500">Pencarian Otomatis</span>
          <Input placeholder="Ketik SO, Barang, atau arahkan Barcode..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>
        <div className="w-full lg:w-1/4 flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-500">Filter Toko (Tabel)</span>
          <select value={customerValue} onChange={(e) => setCustomerValue(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 w-full bg-white h-[42px]">
            <option value="">Semua Toko</option>
            {customerList.map((cust, idx) => (<option key={idx} value={cust}>{cust}</option>))}
          </select>
        </div>
        <div className="w-full lg:w-1/4 flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-500">Tanggal Masuk (Harian)</span>
          <Input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
        </div>
      </div>

      {/* --- MODAL EXPORT MULTI TOKO --- */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Export Excel Multi-Toko</h3>
            
            <div className="flex flex-col gap-4 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Dari Tanggal</label>
                  <Input type="date" value={expStartDate} onChange={(e) => setExpStartDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">Sampai Tanggal</label>
                  <Input type="date" value={expEndDate} onChange={(e) => setExpEndDate(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-gray-700">Pilih Toko yang di-Export</label>
                  <div className="flex gap-2">
                    <button onClick={handleSelectAll} className="text-xs text-blue-600 font-bold hover:underline">Pilih Semua</button>
                    <button onClick={handleClearAll} className="text-xs text-red-600 font-bold hover:underline">Hapus Semua</button>
                  </div>
                </div>
                
                {/* Checkbox List Scrollable */}
                <Input 
              placeholder="Cari nama toko..." 
              value={expSearchToko} 
              onChange={(e) => setExpSearchToko(e.target.value)} 
              className="mb-2 text-sm py-1"
            />
                <div className="border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50 flex flex-col gap-2">
                  {filteredCustomerList.length === 0 ? (
                <span className="text-sm text-gray-500 italic">Toko tidak ditemukan.</span>
                  ) : (
                     filteredCustomerList.map((cust, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                          checked={expSelectedCustomers.includes(cust)}
                          onChange={() => handleToggleCustomer(cust)}
                        />
                        <span className="text-sm text-gray-800">{cust}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-[-4px]">
                  *Jika tidak ada toko yang dicentang, maka SEMUA TOKO akan di-export.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={() => setIsExportOpen(false)}>Batal</Button>
              <Button variant="primary" onClick={handleDownloadExcel}>📥 Download Excel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};