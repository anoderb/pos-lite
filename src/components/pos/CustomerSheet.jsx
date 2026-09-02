'use client';

import { cn } from '@/lib/utils';
import { Search, User, UserPlus, ArrowRight } from 'lucide-react';
import Sheet from '@/components/ui/Sheet';

/**
 * Bottom sheet pilih pelanggan. Komponen presentasional — menerima state & handler dari parent.
 */
export default function CustomerSheet({
  open,
  pelangganList,
  selectedCustomer,
  onSelect,
  onClose,
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Pilih Pelanggan" className="pb-24">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input placeholder="Cari pelanggan" className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#16A34A]" />
      </div>

      <div className="space-y-1.5">
        {pelangganList.map((c, idx) => (
          <button
            key={c.id || `cust-${idx}`}
            onClick={() => onSelect(c)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
              selectedCustomer?.id === c.id ? 'bg-[#ECFDF5] border border-[#16A34A]/20' : 'hover:bg-gray-50'
            )}
          >
            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{c.nama}</p>
              {c.no_hp && <p className="text-[11px] text-gray-500">{c.no_hp}</p>}
            </div>
          </button>
        ))}
      </div>

      <button className="w-full mt-4 flex items-center justify-between py-3 px-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-sm font-semibold text-gray-500 hover:border-[#16A34A] hover:text-[#16A34A] transition-colors">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          <span>Pelanggan Baru</span>
        </div>
        <ArrowRight className="w-4 h-4" />
      </button>
    </Sheet>
  );
}
