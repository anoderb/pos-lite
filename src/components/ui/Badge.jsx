import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable Badge Component Template
 * @param {string} status - 'success' | 'warning' | 'danger' | 'info' | 'neutral'
 */
export default function Badge({
  children,
  status = 'neutral',
  size = 'md',
  className,
  ...props
}) {
  const statuses = {
    success: 'bg-[#ECFDF5] text-[#16A34A] border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-[#EF4444] border border-red-200',
    info: 'bg-sky-50 text-sky-700 border border-sky-200',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        statuses[status],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
