'use client';

import { X, HardDrive, FileArchive, Globe, FileCode } from 'lucide-react';

/** Modal Upload / Register Model TFJS — pindahan murni dari admin/model/page.jsx. */
export default function RegisterModelModal({
  isOpen, onClose,
  uploadMethod, setUploadMethod,
  versi, setVersi, namaModel, setNamaModel,
  akurasi, setAkurasi, uploadedFileSizeMb, setUploadedFileSizeMb,
  deskripsi, setDeskripsi,
  selectedFiles, handleDirectFilesChange,
  selectedZipFile, handleZipFileChange,
  modelJsonUrl, setModelJsonUrl, weightsUrl, setWeightsUrl,
  handleRegisterModel,
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100">Upload / Register Model TFJS</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
          {[
            { key: 'direct_file', icon: HardDrive, label: 'Upload File' },
            { key: 'zip', icon: FileArchive, label: 'Upload ZIP' },
            { key: 'url', icon: Globe, label: 'Remote URL' },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} type="button" onClick={() => setUploadMethod(key)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${uploadMethod === key ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleRegisterModel} className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Versi Model Tag</label>
            <input type="text" required value={versi} onChange={(e) => setVersi(e.target.value)} placeholder="v2.0-mobilenetv3-cbam"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Model</label>
            <input type="text" required value={namaModel} onChange={(e) => setNamaModel(e.target.value)} placeholder="MobileNetV3Large + CBAM"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Val Accuracy (%)</label>
              <input type="number" step="0.1" value={akurasi} onChange={(e) => setAkurasi(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ukuran (MB)</label>
              <input type="text" value={uploadedFileSizeMb} onChange={(e) => setUploadedFileSizeMb(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
            </div>
          </div>

          {uploadMethod === 'direct_file' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-700 text-center space-y-2 relative hover:border-emerald-500 cursor-pointer">
              <FileCode className="w-8 h-8 text-emerald-400 mx-auto" />
              {selectedFiles.length > 0 ? (
                <p className="text-xs font-bold text-emerald-400 font-mono">{selectedFiles.length} File ({uploadedFileSizeMb} MB)</p>
              ) : (
                <p className="text-xs font-bold text-slate-200">Klik / Drag file model.json & .bin</p>
              )}
              <input type="file" multiple onChange={handleDirectFilesChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          )}

          {uploadMethod === 'zip' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-700 text-center space-y-2 relative hover:border-emerald-500 cursor-pointer">
              <FileArchive className="w-8 h-8 text-emerald-400 mx-auto" />
              {selectedZipFile ? (
                <p className="text-xs font-bold text-emerald-400 font-mono">{selectedZipFile.name} ({uploadedFileSizeMb} MB)</p>
              ) : (
                <p className="text-xs font-bold text-slate-200">Klik / Drag file .ZIP bundle model</p>
              )}
              <input type="file" accept=".zip,.rar,.tar.gz" onChange={handleZipFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          )}

          {uploadMethod === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">URL model.json</label>
                <input type="url" value={modelJsonUrl} onChange={(e) => setModelJsonUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">URL weights (.bin)</label>
                <input type="url" value={weightsUrl} onChange={(e) => setWeightsUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Batal</button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20">Upload & Sinkronkan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
