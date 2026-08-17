'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Modal({ isOpen, onClose, title, children, size = 'md', isBottomSheet = false, className, description }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const sizes = { sm: 'sm:max-w-[380px]', md: 'sm:max-w-[500px]', lg: 'sm:max-w-[640px]', xl: 'sm:max-w-[780px]', full: 'sm:max-w-[960px]' };
  return <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#10233E]/45 backdrop-blur-[3px] p-0 sm:p-6 animate-in fade-in duration-200" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
    <div role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined} className={cn('w-full max-h-[92dvh] overflow-hidden bg-white shadow-2xl flex flex-col rounded-t-[24px] sm:rounded-[22px] animate-in slide-in-from-bottom-3 sm:zoom-in-95 duration-200', sizes[size], isBottomSheet && 'sm:max-w-[560px]', className)}>
      <div className="sm:hidden w-10 h-1 rounded-full bg-gray-200 mx-auto mt-3 shrink-0" />
      {(title || onClose) && <header className="flex items-start gap-3 px-5 py-4 border-b border-gray-100 shrink-0"><div className="min-w-0 flex-1"><h2 id="modal-title" className="text-[15px] font-semibold text-[#10233E]">{title}</h2>{description && <p className="text-[11px] text-[#68758A] mt-1 leading-4">{description}</p>}</div>{onClose && <button type="button" onClick={onClose} aria-label="Tutup" className="p-2 -mr-1 rounded-xl text-[#68758A] hover:bg-gray-100"><X className="w-4 h-4" /></button>}</header>}
      <div className="overflow-y-auto p-5 sm:p-6">{children}</div>
    </div>
  </div>;
}
