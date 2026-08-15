// src/app/report/ReportFilter.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/Input";

export default function ReportFilter({ 
  initialDate, 
  currentType 
}: { 
  initialDate: string;
  currentType: string;
}) {
  const router = useRouter();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate) {
      router.push(`/report?date=${newDate}&type=${currentType}`);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto">
      <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
        📅 Pilih Tanggal:
      </label>
      <Input 
        type="date" 
        value={initialDate} 
        onChange={handleDateChange} 
        className="w-full md:w-48"
      />
    </div>
  );
}