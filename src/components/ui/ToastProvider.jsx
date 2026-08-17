'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, TriangleAlert, X } from 'lucide-react';

const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

export default function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const remove = useCallback((id) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message, options = {}) => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((xs) => [...xs.slice(-2), { id, type, message, title: options.title }]);
    if (options.duration !== 0) setTimeout(() => remove(id), options.duration || 4000);
    return id;
  }, [remove]);
  const api = useMemo(() => ({
    success: (m, o) => push('success', m, o), error: (m, o) => push('error', m, o),
    warning: (m, o) => push('warning', m, o), info: (m, o) => push('info', m, o), dismiss: remove,
  }), [push, remove]);
  useEffect(() => {
    const onToast = (e) => push(e.detail?.type || 'info', e.detail?.message || '', e.detail);
    window.addEventListener('tokiva-toast', onToast);
    return () => window.removeEventListener('tokiva-toast', onToast);
  }, [push]);
  const icons = { success: CheckCircle2, error: AlertCircle, warning: TriangleAlert, info: Info };
  const colors = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800', error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800', info: 'border-sky-200 bg-sky-50 text-sky-800',
  };
  return <ToastContext.Provider value={api}>
    {children}
    <div className="fixed inset-x-3 bottom-4 z-[200] flex flex-col items-center gap-2 pointer-events-none sm:left-auto sm:right-5 sm:inset-x-auto sm:w-[360px]" aria-live="polite">
      {items.map((item) => { const Icon = icons[item.type] || Info; return <div key={item.id} role="status" className={`pointer-events-auto w-full rounded-2xl border px-3 py-3 shadow-lg flex items-start gap-2.5 animate-in slide-in-from-bottom-2 ${colors[item.type]}`}>
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold">{item.title || ({ success: 'Berhasil', error: 'Gagal', warning: 'Perhatian', info: 'Informasi' }[item.type])}</p><p className="text-[11px] leading-4 mt-0.5">{item.message}</p></div>
        <button onClick={() => remove(item.id)} aria-label="Tutup" className="p-1 rounded-lg hover:bg-black/5"><X className="w-4 h-4" /></button>
      </div>; })}
    </div>
  </ToastContext.Provider>;
}

export const notify = (type, message, options) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('tokiva-toast', { detail: { type, message, ...options } }));
};
export const toast = {
  success: (m, o) => notify('success', m, o), error: (m, o) => notify('error', m, o),
  warning: (m, o) => notify('warning', m, o), info: (m, o) => notify('info', m, o),
};
