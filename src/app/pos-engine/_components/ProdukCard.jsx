'use client';

import { Plus } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import ProdukThumb from '@/components/ui/ProdukThumb';

/** SATU kartu produk — dipakai grid (varian 'grid') & list (varian 'list').
 *  Pindahan murni dari pos-engine.jsx (grid: line 508–536, list: 540–560). */
export default function ProdukCard({ produk: p, onAdd, variant = 'grid' }) {
  const habis = Number(p.stok ?? 0) <= 0;

  const addBtn = (
    <button
      onClick={() => onAdd(p)}
      disabled={habis}
      className="w-6 h-6 rounded-lg bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center active:scale-90 transition-all disabled:opacity-50 shrink-0"
      title="Tambah ke keranjang"
    >
      <Plus className="w-3.5 h-3.5" />
    </button>
  );

  if (variant === 'list') {
    return (
      <div className={cn('flex items-center gap-3 bg-white border rounded-xl px-3 py-2 shadow-sm transition-all',
        habis ? 'border-gray-100 opacity-60' : 'border-gray-50 hover:border-[#0CAF60]')}>
        <ProdukThumb nama={p.nama} img={p.foto_url} className="w-10 h-10 rounded-lg shrink-0 text-[10px]" />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-[#10233E] truncate">{p.nama}</h4>
          <p className="text-[10px] font-normal text-[#68758A]">Stok: {Number(p.stok ?? 0)}</p>
        </div>
        <p className={cn('text-xs font-medium shrink-0', habis ? 'text-[#D94850]' : 'text-[#087A4B]')}>{formatRupiah(p.harga)}</p>
        {addBtn}
      </div>
    );
  }

  return (
    <div className={cn('bg-white border rounded-[16px] p-2.5 shadow-sm transition-all relative flex flex-col',
      habis ? 'border-gray-100 opacity-60' : 'border-gray-50 hover:border-[#0CAF60]')}>
      {habis && (
        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-[#FFF0F0] text-[#D94850] text-[8px] font-medium rounded-md">
          HABIS
        </span>
      )}
      <ProdukThumb nama={p.nama} img={p.foto_url} className="w-full h-16 rounded-lg mb-2 text-sm" />
      <h4 className="text-[11px] font-medium text-[#10233E] truncate">{p.nama}</h4>
      <p className={cn('text-[11px] font-medium mt-0.5', habis ? 'text-[#D94850]' : 'text-[#087A4B]')}>{formatRupiah(p.harga)}</p>
      <p className="text-[9px] font-normal text-[#68758A] mt-0.5">Stok: {Number(p.stok ?? 0)}</p>
      <div className="mt-1.5 pt-1.5 border-t border-gray-50 flex items-center justify-end">{addBtn}</div>
    </div>
  );
}
