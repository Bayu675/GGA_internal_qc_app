"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmState {
  message: string;
  onConfirm: () => void;
}

interface UIContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    // Toast akan hilang otomatis setelah 3 detik
    setTimeout(() => setToast(null), 3000);
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirm({ message, onConfirm });
  };

  return (
    <UIContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* Komponen Toast UI */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-fade-in transition-all duration-300">
          <div className={`px-4 py-3 rounded-md shadow-lg text-white font-medium ${
            toast.type === 'success' ? 'bg-green-700' : 
            toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Komponen Confirm Modal UI */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Konfirmasi</h3>
            <p className="text-gray-700 mb-6">{confirm.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirm(null)}
                className="px-4 py-2 rounded-md font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  confirm.onConfirm();
                  setConfirm(null);
                }}
                className="px-4 py-2 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};