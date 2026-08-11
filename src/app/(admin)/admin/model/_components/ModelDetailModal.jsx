'use client';

// Modal detail model AI — klik model di registri → tampilkan deskripsi + metrik + error summary
import { X, Cpu, Layers, Target, Zap, Clock, AlertTriangle, Info } from 'lucide-react';

function parseNotes(notes) {
  if (!notes) return null;
  if (typeof notes === 'object') return notes;
  try { return JSON.parse(notes); } catch { return null; }
}

function formatMetric(val, digits = 2) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${(val * 100).toFixed(digits)}%`;
}

export default function ModelDetailModal({ model, onClose }) {
  if (!model) return null;
  const notes = parseNotes(model.notes);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{model.nama}</h3>
              <p className="text-xs font-mono text-slate-400">{model.versi}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        {/* Body scrollable */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Status + badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-xl text-[11px] font-bold border ${
              model.status === 'aktif'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {model.status === 'aktif' ? '● LIVE' : '○ STAGING'}
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700">
              {model.jumlah_class || '?'} Classes
            </span>
          </div>

          {/* Deskripsi */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-slate-400">
              <Info className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wide">Deskripsi</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
              {model.deskripsi || 'Tidak ada deskripsi'}
            </p>
          </div>

          {/* Metrik utama */}
          <div className="grid grid-cols-4 gap-3">
            <MetricCard icon={<Target className="w-4 h-4" />} label="Val Accuracy" value={formatMetric(model.akurasi)} accent="text-emerald-400" />
            <MetricCard icon={<Target className="w-4 h-4" />} label="F1-Macro" value={formatMetric(notes?.f1_macro)} accent="text-teal-400" />
            <MetricCard icon={<Zap className="w-4 h-4" />} label="Inference" value={notes?.inference_ms != null ? `${notes.inference_ms.toFixed(1)} ms` : '—'} accent="text-amber-400" />
            <MetricCard icon={<Clock className="w-4 h-4" />} label="Training" value={notes?.training_time_s != null ? `${(notes.training_time_s / 60).toFixed(0)} mnt` : '—'} accent="text-sky-400" />
          </div>

          {/* Detail training */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <DetailItem label="Best Epoch" value={notes?.best_epoch ?? '—'} />
            <DetailItem label="Test Images" value={notes?.num_test_images?.toLocaleString() ?? '—'} />
            <DetailItem label="Misclassified" value={notes?.num_misclassified ?? '—'} />
            <DetailItem label="Threshold" value={`${((model.confidence_threshold ?? 0.65) * 100).toFixed(0)}%`} />
          </div>

          {/* Status deploy */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              {model.status === 'aktif' ? '🟢 Live Deployment' : '⚪ Staging — Belum di-deploy'}
            </div>
            {model.status === 'aktif' && (
              <div className="text-xs text-slate-400 space-y-0.5">
                <p>Diaktifkan: {model.activated_at ? new Date(model.activated_at).toLocaleString('id-ID') : '—'}</p>
                <p>Dibuat: {model.created_at ? new Date(model.created_at).toLocaleString('id-ID') : '—'}</p>
              </div>
            )}
          </div>

          {/* Error summary */}
          {notes?.error_summary && notes.error_summary.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wide">Kesalahan Prediksi Model</span>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wide text-[10px]">
                    <tr>
                      <th className="px-3 py-2">True Label</th>
                      <th className="px-3 py-2">Errors</th>
                      <th className="px-3 py-2">Salah Dikenali Sebagai</th>
                      <th className="px-3 py-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {notes.error_summary.map((e, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-mono">{e.true_label}</td>
                        <td className="px-3 py-2 text-amber-400 font-bold">{e.total_errors}</td>
                        <td className="px-3 py-2 font-mono">{e.most_confused_with}</td>
                        <td className="px-3 py-2">{(e.avg_confidence * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Model source */}
          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
            <p className="font-mono break-all">model: {model.model_json_url}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, accent }) {
  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">{icon} <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span></div>
      <div className={`text-base font-bold font-mono ${accent}`}>{value}</div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/60">
      <div className="text-[10px] text-slate-500 font-semibold uppercase">{label}</div>
      <div className="text-xs font-bold font-mono text-slate-200 mt-0.5">{value}</div>
    </div>
  );
}