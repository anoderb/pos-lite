'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Bottom sheet basis — mirror perilaku ui/Modal (Escape, scroll-lock,
 *  backdrop mousedown-close), anchored bottom. */
export default function Sheet({ open, onClose, title, children, className }) {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div onMouseDown={onClose} className="fixed inset-0 z-[90] bg-[#10233E]/50 backdrop-blur-[3px] animate-in fade-in duration-200" />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed left-0 right-0 bottom-0 z-[95] bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 p-5 pb-8 animate-slide-up max-h-[88vh] overflow-y-auto',
          className
        )}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#10233E]">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Tutup" className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-[#68758A]" />
            </button>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
