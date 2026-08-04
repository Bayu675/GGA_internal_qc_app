"use client";
import React, { useState } from 'react';

export const PhotoViewer = ({ url, alt, className }: { url: string, alt: string, className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <img 
        src={url} 
        alt={alt} 
        className={`cursor-pointer hover:opacity-90 transition-opacity ${className}`} 
        onClick={() => setIsOpen(true)} 
      />
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <button className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300">&times;</button>
          <img src={url} alt={alt} className="max-w-full max-h-full object-contain rounded-md" />
          <p className="absolute bottom-4 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">Klik di mana saja untuk menutup</p>
        </div>
      )}
    </>
  );
}