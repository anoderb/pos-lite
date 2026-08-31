'use client';

import { cn, formatRupiah } from '@/lib/utils';
import { X, XCircle, Loader2, ArrowRight } from 'lucide-react';

/**
 * Bottom sheet pembayaran (mobile < lg). Presentasional — semua state & handler dari parent.
 */
export default function PaymentSheet({
  open,
  isDesktop,
  subtotal,
  diskon,
  total,
  metodeTersedia,
  metodeBayar,
  onSetMetode,
  uangDiterima,
  onSetUang,
  uangNum,
  kembalian,
  payError,
  isPaying,
  onBayar,
  onClose,
}) {
  if (!open || isDesktop) return null;
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 p-5 pb-28 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#10233E]">Pembayaran</h2>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-[#68758A]" /></button>
        </div>

        {/* Ringkasan Belanja */}
        <div className="bg-[#FAFBFC] border border-gray-50 rounded-[18px] p-4 space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="font-normal text-[#68758A]">Subtotal</span>
            <span className="font-medium text-[#10233E]">{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-normal text-[#68758A]">Diskon</span>
            <span className="font-medium text-[#EF4444]">- {formatRupiah(diskon)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-xs font-medium text-[#10233E]">Total</span>
            <span className="text-lg font-semibold text-[#0CAF60]">{formatRupiah(total)}</span>
          </div>
        </div>

        {/* Metode Pembayaran */}
        <div className="mb-4">
          <p className="text-[11px] font-medium text-[#68758A] mb-1.5">Metode Pembayaran</p>
          <div className={cn('grid gap-2', metodeTersedia.length === 1 ? 'grid-cols-1' : metodeTersedia.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {metodeTersedia.map(m => {
              const Icon = m.icon;
              const active = metodeBayar === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSetMetode(m.id)}
                  className={cn(
                    'flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium border transition-all justify-center',
                    active ? 'bg-[#0CAF60] text-white border-[#0CAF60] shadow-sm' : 'bg-white text-[#68758A] border-gray-100 hover:bg-[#E8FAF0]'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Uang Diterima & Quick Chips (Tunai only) */}
        {metodeBayar === 'cash' && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-[11px] font-medium text-[#68758A] mb-1 block">Uang Diterima</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#0CAF60]">Rp</span>
                <input
                  type="number"
                  value={uangDiterima}
                  onChange={e => onSetUang(e.target.value)}
                  placeholder={String(total)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-lg font-medium text-[#0CAF60] outline-none focus:border-[#0CAF60]"
                />
              </div>
            </div>

            {/* Quick Nominal Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onSetUang(String(total))}
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[#E8FAF0] text-[#087A4B] hover:bg-emerald-100 transition-colors"
              >
                Uang Pas
              </button>
              {[10000, 20000, 50000, 100000].map((nominal) => (
                <button
                  key={nominal}
                  type="button"
                  onClick={() => onSetUang(String(nominal))}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-gray-50 text-[#68758A] hover:bg-gray-100 transition-colors"
                >
                  {nominal >= 1000 ? `${nominal / 1000}rb` : nominal}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-gray-100">
              <span className="text-xs font-normal text-[#68758A]">Kembalian</span>
              <span className="text-lg font-semibold text-[#0CAF60]">{formatRupiah(kembalian)}</span>
            </div>
          </div>
        )}

        {/* Error Banner Gagal Bayar */}
        {payError && (
          <div className="mb-4 p-3 rounded-xl bg-[#FFF0F0] border border-[#F5C6C9] flex items-start gap-2 animate-fade-in">
            <XCircle className="w-4 h-4 text-[#D94850] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-[#D94850]">Pembayaran Gagal</p>
              <p className="text-[10px] font-normal text-[#68758A] mt-0.5">{payError}</p>
            </div>
          </div>
        )}

        {/* CTA Bayar */}
        <button
          onClick={() => { onBayar(); }}
          disabled={isPaying || (metodeBayar === 'cash' && uangNum < total)}
          className="w-full flex items-center justify-center gap-2 bg-[#0CAF60] hover:bg-[#087A4B] text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isPaying ? 'Memproses Pembayaran...' : payError ? 'Coba Lagi' : 'Bayar Sekarang'}
          {!isPaying && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
}
