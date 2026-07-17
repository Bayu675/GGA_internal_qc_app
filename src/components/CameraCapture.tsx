"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "./Button";

interface CameraCaptureProps {
  label: string;
  onCapture: (base64Image: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ label, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setHasPermissionError(false);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prioritize back camera on mobile
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setHasPermissionError(true);
    }
  }, []);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video source
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Compress to JPEG with 80% quality to save space
        const base64Image = canvas.toDataURL("image/jpeg", 0.8);
        setPhotoPreview(base64Image);
        onCapture(base64Image);
        
        // Stop stream after capture to save battery
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  };

  const retakePhoto = () => {
    setPhotoPreview(null);
    onCapture(""); // Clear parent state
    startCamera();
  };

  return (
    <div className="flex flex-col gap-2 border border-gray-300 p-4 rounded-lg bg-gray-50">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      
      {hasPermissionError ? (
        <div className="p-4 bg-red-100 text-red-800 text-sm rounded-md text-center">
          Gagal akses kamera! Pastikan browser diizinkan atau pakai HTTPS/ngrok.
          <Button variant="secondary" className="mt-2 w-full" onClick={startCamera}>Coba Lagi</Button>
        </div>
      ) : (
        <div className="relative w-full aspect-[4/3] bg-black rounded-md overflow-hidden flex items-center justify-center">
          {!photoPreview ? (
            <>
              {/* playsInline is required for iOS Safari to not go fullscreen */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
                onLoadedMetadata={() => videoRef.current?.play()}
              />
              {!stream && (
                <Button variant="primary" onClick={startCamera} className="absolute">
                  Nyalakan Kamera
                </Button>
              )}
            </>
          ) : (
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
          )}
          
          {/* Hidden Canvas to handle the image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {stream && !photoPreview && (
        <Button variant="primary" onClick={capturePhoto} className="w-full mt-2">
          📸 Jepret Foto
        </Button>
      )}

      {photoPreview && (
        <Button variant="secondary" onClick={retakePhoto} className="w-full mt-2">
          🔄 Foto Ulang
        </Button>
      )}
    </div>
  );
};