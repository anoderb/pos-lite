import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable Select Dropdown Component Template
 */
export default function Select({
  label,
  options = [],
  error,
  placeholder = 'Pilih opsi...',
  className,
  id,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-xl transition-colors duration-150 focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#ECFDF5] text-gray-900',
          error && 'border-[#EF4444] focus:border-[#EF4444]',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs font-medium text-[#EF4444]">{error}</p>}
    </div>
  );
}
