'use client';

import { formatRupiah } from '@/lib/utils';
import { CheckCircle, Share2, ArrowRight, X } from 'lucide-react';

/**
 * Modal/overlay struk setelah transaksi selesai. Presentasional — data & handler dari parent.
 */
export default function ReceiptModal({
  open,
  tx,
  subtotal,
  diskon,
  metodeLabel,
  onShare,
  onNewTransaction,
}) {
  if (!open || !tx) return null;
  return (
    <>
      {/* Backdrop (desktop) — mobile full overlay tanpa backdrop terpisah */}
      <div onClick={onNewTransaction} className="hidden lg:block fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div className="fixed inset-0 z-50 bg-[#F8FAF9] flex flex-col overflow-y-auto animate-fade-in lg:bg-transparent lg:items-center lg:justify-center lg:overflow-hidden">
        <div className="w-full max-w-[430px] mx-auto px-4 py-6 pb-10 lg:max-w-md lg:bg-white lg:rounded-2xl lg:shadow-2xl lg:p-5 lg:max-h-[92vh] lg:overflow-y-auto lg:relative">
          {/* Close × (desktop only) */}
          <button
            onClick={onNewTransaction}
            className="hidden lg:flex absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 text-[#68758A] items-center justify-center hover:bg-gray-200 transition-colors z-10"
            title="Tutup struk"
          >
            <X className="w-4 h-4" />
          </button>
          {/* Success Header */}
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-[#E8FAF0] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-[#0CAF60]" />
            </div>
            <h2 className="text-[17px] font-semibold text-[#10233E] mt-2">Pembayaran Berhasil</h2>
            <p className="text-[11px] font-normal text-[#68758A] mt-0.5">Transaksi telah tersimpan</p>
          </div>

          {/* Struk Paper */}
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-50 p-4 font-mono text-[11px] text-[#10233E] leading-5">
            {/* Header Toko */}
            <div className="text-center pb-3">
              <p className="text-[13px] font-semibold font-sans tracking-wide">{tx.toko}</p>
              {tx.toko_alamat && <p className="text-[10px] font-sans font-normal text-[#68758A]">{tx.toko_alamat}</p>}
              <p className="text-[10px] font-sans font-medium text-[#0CAF60] mt-1">STRUK PEMBELIAN</p>
            </div>

            <div className="border-t border-dashed border-gray-200 my-1" />

            {/* Info Transaksi */}
            <div className="py-1">
              <div className="flex justify-between"><span className="text-[#68758A]">No. Struk</span><span>{tx.nomor_transaksi}</span></div>
              <div className="flex justify-between"><span className="text-[#68758A]">Tanggal</span><span>{tx.tanggal}</span></div>
              <div className="flex justify-between"><span className="text-[#68758A]">Waktu</span><span>{tx.waktu}</span></div>
              <div className="flex justify-between"><span className="text-[#68758A]">Kasir</span><span>{tx.kasir}</span></div>
              <div className="flex justify-between"><span className="text-[#68758A]">Pelanggan</span><span>{tx.pelanggan}</span></div>
              <div className="flex justify-between"><span className="text-[#68758A]">Metode</span><span>{metodeLabel}</span></div>
              {tx.status_qris === 'pending' && <div className="flex justify-between"><span className="text-[#68758A]">Status</span><span className="text-amber-600">Pending</span></div>}
              {tx.alasan_batal && <div className="flex justify-between"><span className="text-[#68758A]">Catatan</span><span className="text-[#D94850]">{tx.alasan_batal}</span></div>}
            </div>

            <div className="border-t border-dashed border-gray-200 my-1" />

            {/* Items */}
            <div className="py-1 space-y-1.5">
              {(tx.items || []).map((i, idx) => (
                <div key={idx}>
                  <p className="font-sans font-medium">{i.nama}</p>
                  <div className="flex justify-between text-[10px] text-[#68758A]">
                    <span>{i.qty} x {formatRupiah(i.harga)}</span>
                    <span className="text-[#10233E]">{formatRupiah(i.harga * i.qty)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-200 my-1" />

            {/* Totals */}
            <div className="py-1 space-y-0.5">
              <div className="flex justify-between"><span className="text-[#68758A]">Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-[#68758A]">Diskon</span><span className="text-[#D94850]">-{formatRupiah(diskon)}</span></div>
              <div className="flex justify-between text-[13px] font-bold text-[#0CAF60] pt-1"><span>TOTAL</span><span>{formatRupiah(tx.total)}</span></div>
              <div className="flex justify-between"><span className="text-[#68758A]">{metodeLabel}</span><span>{formatRupiah(tx.uang_diterima)}</span></div>
              <div className="flex justify-between"><span className="text-[#68758A]">Kembalian</span><span>{formatRupiah(tx.kembalian)}</span></div>
            </div>

            <div className="border-t border-dashed border-gray-200 my-1" />

            <p className="text-center text-[10px] text-[#68758A] font-sans pt-1">Terima kasih telah berbelanja! 🙏</p>
          </div>

          {/* Actions */}
          <div className="space-y-2 mt-4">
            <button
              onClick={onShare}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-100 rounded-2xl text-[13px] font-medium text-[#10233E] hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              Bagikan Struk
            </button>
            <button
              onClick={onNewTransaction}
              className="w-full flex items-center justify-center gap-2 bg-[#0CAF60] hover:bg-[#087A4B] text-white font-medium py-3.5 rounded-2xl transition-all shadow-sm"
            >
              Transaksi Baru
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNewTransaction}
              className="w-full text-[11px] font-normal text-[#68758A] hover:text-[#10233E] transition-colors py-1"
            >
              Kembali ke Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
