'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Modal({ isOpen, onClose, title, description, children, size = 'md', className }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-[384px]', md: 'max-w-[440px]', lg: 'max-w-[560px]', xl: 'max-w-[680px]' };
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#10233E]/50 backdrop-blur-[3px] animate-in fade-in duration-200"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn('w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200', sizes[size], className)}
      >
        {(title || onClose) && (
          <header className="flex items-start gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
            <div className="min-w-0 flex-1">
              {title && <h2 id="modal-title" className="text-[15px] font-semibold text-[#10233E]">{title}</h2>}
              {description && <p className="text-[11px] text-[#68758A] mt-1 leading-4">{description}</p>}
            </div>
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Tutup" className="p-2 -mr-1 rounded-xl text-[#68758A] hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            )}
          </header>
        )}
        <div className="overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
