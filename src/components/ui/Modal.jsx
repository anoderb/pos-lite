import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable Modal Component Template (Supports Mobile Bottom Sheet & Centered Dialog)
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  isBottomSheet = false,
  className,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className={cn(
          'w-full bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden transition-all transform',
          isBottomSheet && 'rounded-b-none sm:rounded-3xl self-end sm:self-center',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6 pb-32 sm:pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
