'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ScanBarcode, X, Camera, CheckCircle, XCircle } from 'lucide-react';

export default function BarcodeScannerModal({ isOpen, onClose, onDetected, title = 'Scan Barcode' }) {
  const [scannedCode, setScannedCode] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [detectorSupported, setDetectorSupported] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let stream = null;
    let timer = null;

    if (isOpen) {
      setScannedCode('');
      setNotFound(false);
      setManualInput('');

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        }).then(s => {
          stream = s;
          setCameraActive(true);
          if (videoRef.current) videoRef.current.srcObject = s;
        }).catch(() => setCameraActive(false));
      }

      setDetectorSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window);

      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        timer = setInterval(() => {
          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
          });
          if (videoRef.current && videoRef.current.readyState === 4) {
            detector.detect(videoRef.current).then(results => {
              if (results.length > 0) {
                const code = results[0].rawValue;
                setScannedCode(code);
                setNotFound(false);
                onDetected(code);
                handleClose();
              }
            }).catch(() => {});
          }
        }, 400);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
      if (stream) stream.getTracks().forEach(t => t.stop());
      setCameraActive(false);
    };
  }, [isOpen]);

  const handleClose = () => {
    setScannedCode('');
    setManualInput('');
    setNotFound(false);
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = (manualInput || '').trim();
    if (!code) return;
    setScannedCode(code);
    onDetected(code);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ScanBarcode className="w-4 h-4 text-emerald-400" /> {title}
          </h3>
          <button onClick={handleClose} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
          {cameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <Camera className="w-8 h-8 mb-2 text-slate-600" />
              <span className="text-[10px]">Kamera tidak tersedia</span>
            </div>
          )}

          {/* Bounding box */}
          <div className="absolute inset-4 border-2 border-emerald-400/50 rounded-2xl pointer-events-none" />

          {/* Status pill */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 backdrop-blur rounded-full text-[10px] font-semibold text-white flex items-center gap-1.5">
            {detectorSupported === false ? (
              <><XCircle className="w-3 h-3 text-rose-400" /> Browser tidak support deteksi otomatis</>
            ) : cameraActive ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Mendeteksi...</>
            ) : (
              <><Camera className="w-3 h-3 text-amber-400" /> Menunggu kamera</>
            )}
          </div>

          {/* Scanned code pill */}
          {scannedCode && !notFound && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 backdrop-blur border border-emerald-500/30 rounded-xl text-[10px] font-semibold text-white flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span className="font-mono text-emerald-400">{scannedCode}</span>
            </div>
          )}
        </div>

        {/* Manual Input Fallback */}
        <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
          <input
            value={manualInput}
            onChange={(e) => { setManualInput(e.target.value); setNotFound(false); }}
            placeholder="Ketik kode barcode…"
            inputMode="numeric"
            className="flex-1 min-w-0 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          <button type="submit" className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-500/30 transition-colors shrink-0">
            Pilih
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center">
          Arahkan kamera ke barcode atau ketik manual
        </p>
      </div>
    </div>
  );
}
