import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

/**
 * Reusable Empty State Component Template
 */
export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'Belum ada data',
  description = 'Data yang Anda cari tidak tersedia atau belum ditambahkan.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
      <div className="p-4 bg-emerald-50 text-[#16A34A] rounded-2xl mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-500 max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
