import React, { useState } from 'react';
import { Play, Upload, Camera, Video, VideoOff, UploadCloud, Zap, CheckCircle2, FlaskConical } from 'lucide-react';

export default function TestingSandbox({ testingModel, videoRef, webcamActive, onToggleWebcam, prediction, threshold, inferenceMs, onFileUpload, testImagePreview }) {
  const [mode, setMode] = useState('camera');

  const handleModeChange = (m) => {
    if (m === 'upload' && webcamActive) onToggleWebcam();
    setMode(m);
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" /> Realtime Testing Sandbox
            </h3>
            {testingModel ? (
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <FlaskConical className="w-3 h-3" /> {testingModel.versi}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                BELUM ADA MODEL
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {testingModel ? 'Uji via Kamera (Loop 300ms) atau Upload Foto' : 'Upload model AI terlebih dahulu'}
          </p>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button onClick={() => handleModeChange('upload')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${mode === 'upload' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
            <Upload className="w-3.5 h-3.5" /> Upload Foto
          </button>
          <button onClick={() => handleModeChange('camera')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${mode === 'camera' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
            <Camera className="w-3.5 h-3.5" /> Kamera Live
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video / Image */}
        <div className="lg:col-span-7 space-y-3">
          {mode === 'camera' ? (
            <div className="w-full aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative flex items-center justify-center">
              <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${webcamActive ? 'block' : 'hidden'}`} />
              {!webcamActive && (
                <div className="text-center p-6 space-y-3">
                  <VideoOff className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">Klik tombol di bawah untuk mulai scanning.</p>
                </div>
              )}
              {webcamActive && prediction && (
                <div className="absolute top-3 left-3 right-3 p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${prediction.isDetected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                    <span className="text-xs font-bold text-slate-100 font-mono truncate max-w-[240px]">{prediction.topLabel}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold ${prediction.isDetected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {(prediction.topConfidence * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative flex items-center justify-center p-4">
              {testImagePreview ? (
                <img src={testImagePreview} alt="Test" className="w-full h-full object-contain" />
              ) : (
                <label className="cursor-pointer text-center space-y-2 p-6">
                  <UploadCloud className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">Pilih foto kemasan produk</p>
                  <p className="text-[10px] text-slate-500 font-mono">JPG, PNG, WEBP (Max 5MB)</p>
                  <input type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
                </label>
              )}
            </div>
          )}

          {mode === 'camera' ? (
            <button onClick={onToggleWebcam}
              className={`w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 ${webcamActive ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' : 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'}`}>
              {webcamActive ? <><VideoOff className="w-4 h-4" /> Stop Scanning</> : <><Video className="w-4 h-4" /> Mulai Scanning</>}
            </button>
          ) : testImagePreview && (
            <label className="block text-center py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-xs font-semibold cursor-pointer">
              Ganti Foto
              <input type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-3">
              <Zap className="w-4 h-4 text-emerald-400" /> Hasil Inferensi TFJS
            </h4>

            {prediction ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border ${prediction.isDetected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider">Hasil Klasifikasi:</p>
                  <p className="text-sm font-extrabold font-mono mt-0.5">{prediction.topLabel}</p>
                  {!prediction.isDetected && (
                    <p className="text-[10px] text-amber-400 mt-1">
                      Probabilitas ({(prediction.topConfidence * 100).toFixed(1)}%) dibawah threshold ({(threshold * 100).toFixed(0)}%)
                    </p>
                  )}
                </div>

                {prediction.topClasses.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-300 font-mono truncate">{item.label}</span>
                      <span className="font-bold text-emerald-400 font-mono">{(item.score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300" style={{ width: `${item.score * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Aktifkan kamera atau unggah foto untuk inferensi.
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Inference Latency:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {inferenceMs > 0 ? `${inferenceMs}ms` : '— ms'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
