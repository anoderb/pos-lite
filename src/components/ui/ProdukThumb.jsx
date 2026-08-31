'use client';

import { cn } from '@/lib/utils';

/**
 * Thumbnail produk reusable — menampilkan foto bila ada, fallback inisial nama.
 * Deduplikasi dari pos-engine.jsx & produk/page.jsx (sebelumnya duplikat).
 */
export default function ProdukThumb({ nama, img, className }) {
  if (img) {
    return (
      <div className={cn('overflow-hidden rounded-xl border border-gray-200 shrink-0 bg-gray-100', className)}>
        <img src={img} alt={nama} className="w-full h-full object-cover" />
      </div>
    );
  }
  const initials = (nama || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={cn('bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-[#16A34A] font-bold text-xs select-none shrink-0', className)}>
      {initials}
    </div>
  );
}
