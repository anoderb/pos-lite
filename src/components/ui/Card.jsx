import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable Card Component Template
 * @param {string} variant - 'default' | 'stat' | 'interactive'
 */
export default function Card({
  children,
  variant = 'default',
  title,
  subtitle,
  icon: Icon,
  className,
  ...props
}) {
  const variants = {
    default: 'bg-white border border-gray-100 shadow-sm rounded-2xl p-4',
    stat: 'bg-gradient-to-br from-white to-[#F8FAF9] border border-gray-100 shadow-sm rounded-2xl p-5',
    interactive: 'bg-white border border-gray-100 shadow-sm rounded-2xl p-4 hover:border-[#16A34A] hover:shadow-md transition-all cursor-pointer',
  };

  return (
    <div className={cn(variants[variant], className)} {...props}>
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          {Icon && (
            <div className="p-2.5 bg-[#ECFDF5] text-[#16A34A] rounded-xl">
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
