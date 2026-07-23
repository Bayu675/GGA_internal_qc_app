"use client";

import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "./Button";

interface BarcodeScannerProps {
  onScan: (result: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        // 1. Inisialisasi dengan Format Eksplisit (Wajib buat baca garis)
        scannerRef.current = new Html5Qrcode("reader", {
        verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128, // Ini format SO kita
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          experimentalFeatures: {
            // Fitur sakti: Pake scanner bawaan OS Android/iOS kalau ada (10x lebih cepat)
            useBarCodeDetectorIfSupported: true
          }
        });
        
        scannerRef.current.start(
          // 2. Paksa pake resolusi tinggi biar garis tipis nggak ngeblur
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 300, height: 120 },
            aspectRatio: 1.0 // Bantu fokus lensa HP
          },
          (decodedText) => {
            // JIKA BERHASIL SCAN
            if (scannerRef.current) {
              // Bikin bunyi Beep (opsional, UX biar staf tau kalo berhasil)
              try { navigator.vibrate(200); } catch(e){} 

              scannerRef.current.stop().then(() => {
                setIsScanning(false);
                onScan(decodedText);
              }).catch((err) => console.error("Gagal stop:", err));
            }
          },
          (errorMessage) => {
            // Ignore error per-frame (normal)
          }
        ).catch((err) => {
          setError("Gagal akses kamera! Pastikan pakai HTTPS (Ngrok) dan izinkan akses kamera.");
        });
      }, 200);

      return () => clearTimeout(timer);
    }

    // Cleanup
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning, onScan]);

  const handleStop = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => setIsScanning(false));
    } else {
      setIsScanning(false);
    }
  };

  return (
    <>
      <Button 
        type="button" 
        variant="primary" 
        onClick={() => {
          setError(null);
          setIsScanning(true);
        }}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 w-full lg:w-auto justify-center"
      >
        📷 Scan Barcode
      </Button>

      {isScanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 p-4">
          <div className="bg-white p-4 rounded-lg w-full max-w-md flex flex-col gap-4 shadow-2xl">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800">Scan Barcode SO</h3>
              <p className="text-xs text-gray-500">Posisikan garis sejajar dengan kotak</p>
            </div>
            
            {error ? (
              <div className="p-3 bg-red-100 text-red-700 rounded text-sm text-center">
                {error}
              </div>
            ) : (
              // Bikin background item biar fokus kamera ke tengah
              <div className="relative w-full overflow-hidden bg-black rounded-md border-2 border-dashed border-gray-300">
                <div id="reader" className="w-full min-h-[250px]"></div>
              </div>
            )}
            
            <Button type="button" variant="danger" onClick={handleStop} className="w-full font-bold">
              Tutup Kamera
            </Button>
          </div>
        </div>
      )}
    </>
  );
};