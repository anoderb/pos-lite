'use client';

import { Trash2 } from 'lucide-react';

/** Modal Deploy + Delete — pindahan murni dari admin/model/page.jsx. */
export default function ModelConfirmModals({
  deployModelTarget, setDeployModelTarget,
  versiOverride, setVersiOverride,
  handleDeployToPOS,
  deleteModelTarget, setDeleteModelTarget,
  handleDeleteModel,
}) {
  return (
    <>
      {/* Modal: Deploy */}
      {deployModelTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Konfirmasi Deploy ke Sistem POS</h3>
            <p className="text-xs text-slate-400">
              Terapkan <strong className="text-slate-200">{deployModelTarget.nama} ({deployModelTarget.versi})</strong> secara live ke seluruh kasir?
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Override Versi (opsional)</label>
              <input
                type="text"
                value={versiOverride}
                onChange={(e) => setVersiOverride(e.target.value)}
                placeholder={`Auto: ${deployModelTarget.versi} — kosongkan untuk default`}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500">Contoh: v2 (major bump), v1.2 (minor update). Format: v{major}.{minor}.{tanggal}</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setDeployModelTarget(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Batal</button>
              <button onClick={handleDeployToPOS} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20">Ya, Deploy</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete */}
      {deleteModelTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Hapus Model</h3>
            <p className="text-xs text-slate-400">
              Hapus <strong className="text-slate-200">{deleteModelTarget.nama} ({deleteModelTarget.versi})</strong> dari database?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setDeleteModelTarget(null)} className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Batal</button>
              <button onClick={handleDeleteModel} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
