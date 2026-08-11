import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable Button Component Template
 * @param {string} variant - 'primary' | 'secondary' | 'danger' | 'ghost' | 'mint'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} isLoading - Spinner loading state
 * @param {boolean} fullWidth - Takes 100% width
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon: Icon,
  className,
  disabled,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm focus:ring-[#16A34A]',
    secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm focus:ring-gray-300',
    danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm focus:ring-[#EF4444]',
    mint: 'bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#16A34A] font-semibold focus:ring-[#16A34A]',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}
