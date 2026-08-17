'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Check, Info, TriangleAlert, X, Loader2 } from 'lucide-react';

const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

function Decor({ type }) {
  const map = {
    success: (
      <svg className="absolute right-2 bottom-0 opacity-15" width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path d="M8 56C20 36 40 36 56 20" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
        <circle cx="14" cy="20" r="4" fill="#16A34A" />
        <path d="M30 44C34 36 42 34 48 26" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    info: (
      <svg className="absolute right-2 bottom-0 opacity-15" width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path d="M4 48C16 36 28 44 40 34C50 26 56 30 62 20" stroke="#0EA5E9" strokeWidth="4" strokeLinecap="round" />
        <path d="M8 56C22 46 36 52 52 40" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    warning: (
      <svg className="absolute right-2 bottom-0 opacity-15" width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="14" y="24" width="36" height="28" rx="4" fill="#F59E0B" />
        <path d="M24 24V16C24 12 28 8 32 8C36 8 40 12 40 16V24" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
        <path d="M8 52H56" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
    error: (
      <svg className="absolute right-2 bottom-0 opacity-15" width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="20" stroke="#D94850" strokeWidth="4" />
        <circle cx="32" cy="32" r="10" stroke="#D94850" strokeWidth="3" />
        <path d="M4 56C20 48 44 48 60 56" stroke="#D94850" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
    processing: (
      <div className="absolute right-3 bottom-3 opacity-20 flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce delay-100" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce delay-200" />
      </div>
    ),
  };
  return map[type] || null;
}

export default function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const remove = useCallback((id) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message, options = {}) => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((xs) => [ { id, type, message, title: options.title }, ...xs ].slice(0, 4));
    if (options.duration !== 0) setTimeout(() => remove(id), options.duration || 4000);
    return id;
  }, [remove]);
  const api = useMemo(() => ({
    success: (m, o) => push('success', m, o),
    error: (m, o) => push('error', m, o),
    warning: (m, o) => push('warning', m, o),
    info: (m, o) => push('info', m, o),
    processing: (m, o) => push('processing', m, { ...o, duration: 0 }),
    dismiss: remove,
  }), [push, remove]);
  useEffect(() => {
    const onToast = (e) => {
      const d = e.detail || {};
      push(d.type || 'info', d.message || '', d);
    };
    window.addEventListener('tokiva-toast', onToast);
    return () => window.removeEventListener('tokiva-toast', onToast);
  }, [push]);
  const config = {
    success: { bg: 'bg-emerald-50 border-emerald-200', circle: 'bg-[#16A34A]', Icon: Check, title: 'Berhasil' },
    info: { bg: 'bg-sky-50 border-sky-200', circle: 'bg-[#0EA5E9]', Icon: Info, title: 'Informasi' },
    warning: { bg: 'bg-amber-50 border-amber-200', circle: 'bg-[#F59E0B]', Icon: TriangleAlert, title: 'Peringatan' },
    error: { bg: 'bg-rose-50 border-red-200', circle: 'bg-[#D94850]', Icon: X, title: 'Gagal' },
    processing: { bg: 'bg-gray-50 border-gray-200', circle: 'bg-[#64748B]', Icon: Loader2, title: 'Memproses' },
  };
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-32px)] pointer-events-none" aria-live="polite">
        {items.map((item) => {
          const c = config[item.type] || config.info;
          const Icon = c.Icon;
          return (
            <div key={item.id} role="status" className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${c.bg} px-3.5 py-3 shadow-lg flex items-start gap-2.5 animate-in slide-in-from-right-2 duration-200`}>
              <span className={`w-7 h-7 shrink-0 rounded-full ${c.circle} text-white flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${item.type === 'processing' ? 'animate-spin' : ''}`} strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1 pr-6">
                <p className="text-[12px] font-semibold text-[#10233E]">{item.title || c.title}</p>
                <p className="text-[11px] leading-4 text-[#68758A] mt-0.5">{item.message}</p>
              </div>
              <Decor type={item.type} />
              <button onClick={() => remove(item.id)} aria-label="Tutup notifikasi" className="absolute top-2 right-2 p-1 rounded-lg text-[#68758A] hover:bg-black/5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const notify = (type, message, options) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('tokiva-toast', { detail: { type, message, ...options } }));
};
export const toast = {
  success: (m, o) => notify('success', m, o),
  error: (m, o) => notify('error', m, o),
  warning: (m, o) => notify('warning', m, o),
  info: (m, o) => notify('info', m, o),
  processing: (m, o) => notify('processing', m, o),
};
