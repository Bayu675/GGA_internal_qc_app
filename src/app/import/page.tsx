"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import Link from 'next/link';
import { importExcelAction } from './actions';

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Pilih file Excel-nya dulu bro!");
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.append("file", file);

        startTransition(async () => {
      const result = await importExcelAction(formData);
      
      if (!result.success) {
        setError(result.error || "Gagal upload file Excel");
        return;
      }

      alert(`Berhasil import ${result.count} data barang return!`);
      router.push('/');
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Import Data Master</h1>
        
        <form onSubmit={handleUpload} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
              Upload File Excel (.xlsx, .xls)
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100 cursor-pointer"
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Link href="/" className="flex-1">
              <Button type="button" variant="secondary" className="w-full" disabled={isPending}>
                Batal
              </Button>
            </Link>
            <Button type="submit" variant="primary" className="flex-1" disabled={isPending}>
              {isPending ? 'Memproses...' : 'Upload Data'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}