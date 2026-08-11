import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable Input Field Component Template
 * Supports automatic Eye toggle for type="password"
 */
export default function Input({
  label,
  error,
  icon: Icon,
  prefix,
  suffix,
  className,
  id,
  type = 'text',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const isPasswordInput = type === 'password';
  const effectiveType = isPasswordInput ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-700 select-none">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-gray-500 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        {prefix && (
          <span className="absolute left-3.5 text-xs font-bold text-gray-500 pointer-events-none z-10">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          type={effectiveType}
          className={cn(
            'w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl transition-colors duration-150 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#ECFDF5] placeholder:text-gray-500 text-gray-900',
            Icon && 'pl-9',
            prefix && 'pl-10',
            (suffix || isPasswordInput) && 'pr-10',
            error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-red-100',
            className
          )}
          {...props}
        />
        {isPasswordInput ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 p-1 text-gray-500 hover:text-gray-600 rounded-lg transition-colors focus:outline-none"
            title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
          </button>
        ) : (
          suffix && (
            <span className="absolute right-3 text-xs text-gray-500 pointer-events-none">
              {suffix}
            </span>
          )
        )}
      </div>
      {error && <p className="text-xs font-medium text-[#EF4444]">{error}</p>}
    </div>
  );
}
