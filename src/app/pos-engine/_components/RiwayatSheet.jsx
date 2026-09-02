'use client';

import { ReceiptText, Banknote, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import { METODE_ICON_BG } from '@/lib/constants';

/** Badge status transaksi (pending=kuning, dibatalkan=merah, selesai=hijau) */
export function statusBadgeRiwayat(t) {
  const sq = String(t.status_qris || '').toLowerCase();
  const st = String(t.status || '').toLowerCase();
  if (sq === 'pending' || st === 'pending') return { label: 'Pending', cls: 'bg-[#FFF8D9] text-amber-600' };
  if (['cancelled', 'cancel', 'dibatalkan', 'void', 'batal'].some((k) => sq === k || st === k)) return { label: 'Batal', cls: 'bg-[#FFF0F0] text-[#D94850]' };
  return { label: 'Sukses', cls: 'bg-[#E8FAF0] text-[#087A4B]' };
}

export function formatRiwayatWaktu(iso) {
  if (!iso) return '—';
  const dt = new Date(iso);
  return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' · ' +
    dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

/** Panel "History Transaksi" — pindahan murni dari pos-engine.jsx (section 838–934). */
export default function RiwayatSheet({
  riwayat, riwayatFilter, riwayatPendingTotal, isRiwayatLoading,
  riwayatPage, riwayatPages,
  switchRiwayatFilter, reloadRiwayatPage, openStrukRiwayat,
}) {
  return (
    <section className="bg-white border border-gray-50 rounded-[18px] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-[#FAFBFC]">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center"><ReceiptText className="w-3.5 h-3.5" /></span>
          <span className="text-[13px] font-medium text-[#10233E]">History Transaksi</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => switchRiwayatFilter('semua')}
            className={cn('px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors', riwayatFilter === 'semua' ? 'bg-[#0CAF60] text-white' : 'bg-gray-100 text-[#68758A] hover:bg-gray-200')}
          >
            Semua
          </button>
          <button
            onClick={() => switchRiwayatFilter('pending')}
            className={cn('px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1', riwayatFilter === 'pending' ? 'bg-[#0CAF60] text-white' : 'bg-gray-100 text-[#68758A] hover:bg-gray-200')}
          >
            Pending
            {riwayatPendingTotal > 0 && (
              <span className={cn('w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center', riwayatFilter === 'pending' ? 'bg-white/25' : 'bg-[#F59E0B] text-white')}>{riwayatPendingTotal}</span>
            )}
          </button>
        </div>
      </div>

      {isRiwayatLoading ? (
        <div className="px-4 py-2 space-y-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-gray-100 animate-pulse rounded" />
                <div className="h-2.5 w-20 bg-gray-100 animate-pulse rounded" />
              </div>
              <div className="h-4 w-14 bg-gray-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : riwayat.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#E8FAF0] flex items-center justify-center mx-auto mb-2 text-[#0CAF60]"><ReceiptText className="w-5 h-5" /></div>
          <p className="text-[11px] font-medium text-[#10233E]">Belum Ada Transaksi</p>
          <p className="text-[10px] font-normal text-[#68758A] mt-0.5">{riwayatFilter === 'pending' ? 'Tidak ada transaksi QRIS yang menunggu persetujuan.' : 'Transaksi yang selesai akan tampil di sini.'}</p>
        </div>
      ) : (
        <>
          <div className="px-4 py-1 divide-y divide-gray-50">
            {riwayat.map(t => (
              <button
                key={t.id}
                onClick={() => openStrukRiwayat(t)}
                className="w-full flex items-center gap-2.5 py-2.5 text-left hover:bg-gray-50/70 transition-colors rounded-lg"
              >
                <span className={cn('w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0', METODE_ICON_BG[t.metode_bayar] || METODE_ICON_BG.cash)}>
                  <Banknote className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#10233E] font-mono truncate">{t.nomor_transaksi}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[9px] font-normal text-[#68758A]">{formatRiwayatWaktu(t.created_at)}</span>
                    {(() => { const b = statusBadgeRiwayat(t); return b ? <span className={cn('text-[8px] font-medium px-1.5 py-px rounded-full', b.cls)}>{b.label}</span> : null; })()}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-semibold text-[#10233E]">{formatRupiah(t.total)}</p>
                  {t.diskon_total > 0 && (
                    <p className="text-[8px] font-normal text-[#F59E0B]">Diskon {formatRupiah(t.diskon_total)}</p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {riwayatPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-50 bg-[#FAFBFC]">
              <button
                onClick={() => reloadRiwayatPage(riwayatPage - 1)}
                disabled={riwayatPage <= 1 || isRiwayatLoading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-100 text-[10px] font-medium text-[#68758A] shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-3 h-3" /> Sebelumnya
              </button>
              <span className="text-[10px] font-normal text-[#68758A]">Halaman {riwayatPage} dari {riwayatPages}</span>
              <button
                onClick={() => reloadRiwayatPage(riwayatPage + 1)}
                disabled={riwayatPage >= riwayatPages || isRiwayatLoading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-100 text-[10px] font-medium text-[#68758A] shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Berikutnya <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
