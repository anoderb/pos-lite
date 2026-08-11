import { Sliders, Check, CheckCircle2, AlertTriangle, UploadCloud, Cpu } from 'lucide-react';

export default function ModelBanner({ model, classes, threshold, setThreshold, onSaveThreshold, inferenceMs, inferenceFps, modelLoaded, modelLoading, onRegister }) {
  if (!model) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-100">Belum Ada Model AI Aktif</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Upload berkas <strong>model.json + .bin</strong> atau <strong>.ZIP</strong> hasil ekspor Kaggle.
        </p>
        <button onClick={onRegister} className="px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
          <UploadCloud className="w-4 h-4" /> Upload Model Pertama
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LIVE PRODUCTION
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold">
              {model.versi}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-100">{model.nama}</h1>
          <p className="text-xs text-slate-400 max-w-xl">
            {model.deskripsi || 'Model klasifikasi gambar untuk deteksi otomatis di mesin kasir POS.'}
          </p>
        </div>

        {/* Threshold Slider */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3 min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" /> Sensitivity Threshold
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">{(threshold * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min="0.40" max="0.95" step="0.05" value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Low (40%)</span><span>Default (65%)</span><span>High (95%)</span>
          </div>
          <button onClick={onSaveThreshold}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Simpan Threshold
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 relative z-10 border-t border-slate-800/80">
        {[
          { label: 'Validation Accuracy', value: `${((model.akurasi || 0.95) * 100).toFixed(1)}%`, color: 'text-emerald-400' },
          { label: 'Database Classes', value: `${classes.length} Labels`, color: 'text-slate-100' },
          { label: 'Inference Latency', value: inferenceMs > 0 ? `${inferenceMs} ms` : '— ms', color: 'text-amber-400' },
          { label: 'TFJS Engine', value: modelLoading ? 'Loading...' : modelLoaded ? 'Loaded ✓' : 'Ready', color: 'text-slate-100' },
        ].map((m, i) => (
          <div key={i} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <p className="text-[10px] uppercase font-semibold text-slate-400">{m.label}</p>
            <p className={`text-lg font-bold mt-0.5 font-mono ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
