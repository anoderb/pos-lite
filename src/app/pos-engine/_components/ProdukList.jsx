'use client';

import { Package } from 'lucide-react';
import ProdukCard from './ProdukCard';

/** Wrapper daftar produk POS — grid/list + empty state.
 *  Satu sumber map (hapus duplikat grid & list di pos-engine). */
export default function ProdukList({ produk, onAdd, variant = 'grid', emptyText = 'Produk tidak ditemukan', onResetSearch }) {
  if (!produk || produk.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-[#E8FAF0] flex items-center justify-center mx-auto mb-2 text-[#0CAF60]">
          <Package className="w-5 h-5" />
        </div>
        <p className="text-[11px] font-medium text-[#10233E]">{emptyText}</p>
        {onResetSearch && (
          <button onClick={onResetSearch} className="mt-1.5 text-[11px] font-medium text-[#0CAF60] hover:underline">
            Reset pencarian
          </button>
        )}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-2">
        {produk.map((p, idx) => (
          <ProdukCard key={p.id || `list-${idx}`} produk={p} onAdd={onAdd} variant="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
      {produk.map((p, idx) => (
        <ProdukCard key={p.id || `fav-${idx}`} produk={p} onAdd={onAdd} variant="grid" />
      ))}
    </div>
  );
}
