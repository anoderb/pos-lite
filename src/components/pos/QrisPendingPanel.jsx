'use client';

import { formatRupiah } from '@/lib/utils';
import {
  QrCode,
  XCircle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';

/**
 * Panel "Menunggu Pembayaran QRIS" + modal QR besar + modal alasan batal.
 * Presentasional — seluruh state & handler dari parent.
 */
export default function QrisPendingPanel({
  open,
  tx,
  merchantNama,
  qrSrc,
  qrisImageError,
  showQrisImageModal,
  onOpenQrisImage,
  onCloseQrisImage,
  showQrisCancelModal,
  qrisActionLoading,
  qrisCancelReason,
  onSetQrisCancelReason,
  qrisCancelError,
  onOpenCancelModal,
  onCloseCancelModal,
  onApprove,
  onCancel,
  onBackHome,
}) {
  if (!open || !tx) return null;
  return (
    <>
      <div className="hidden lg:block fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div className="fixed inset-0 z-50 bg-[#F8FAF9] flex flex-col items-center justify-center overflow-y-auto animate-fade-in lg:bg-transparent">
        <div className="w-full max-w-[430px] mx-auto px-4 py-6 lg:max-w-md lg:bg-white lg:rounded-2xl lg:shadow-2xl lg:p-5 lg:max-h-[92vh] lg:overflow-y-auto">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-[#FFF8D9] rounded-full flex items-center justify-center mx-auto">
              <QrCode className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-[17px] font-semibold text-[#10233E] mt-2">Menunggu Pembayaran QRIS</h2>
            <p className="text-[11px] font-normal text-[#68758A] mt-0.5">Pindai QR dengan aplikasi QRIS pelanggan, lalu konfirmasi di sini.</p>
          </div>

          <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-4">
            {/* QR */}
            <div className="flex justify-center mb-3">
              {qrSrc ? (
                <button
                  type="button"
                  onClick={onOpenQrisImage}
                  className="group rounded-2xl bg-white p-2 border border-gray-100 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-[#0CAF60]/40"
                  aria-label="Buka QR pembayaran"
                  title="Klik untuk memperbesar QR pembayaran"
                >
                  <img
                    src={qrSrc}
                    alt="QR pembayaran QRIS"
                    className="w-56 h-56 rounded-xl bg-white object-contain"
                  />
                  <span className="block text-[9px] text-[#68758A] mt-1 group-hover:text-[#0CAF60]">Klik QR untuk memperbesar</span>
                </button>
              ) : qrisImageError ? (
                <div className="w-56 min-h-56 rounded-xl bg-[#FFF0F0] border border-[#F5C6C9] flex items-center justify-center text-center p-4 text-[10px] text-[#D94850]">
                  {qrisImageError}
                </div>
              ) : (
                <div className="w-56 h-56 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-[10px] text-[#68758A]">
                  Menyiapkan QR pembayaran...
                </div>
              )}
            </div>

            {/* Merchant + total */}
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-[#10233E]">{merchantNama}</p>
              <p className="text-[10px] font-normal text-[#68758A]">{tx.nomor_transaksi}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-normal text-[#68758A]">Total Bayar</span>
              <span className="text-xl font-semibold text-[#0CAF60]">{formatRupiah(tx.total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 mt-4">
            <button
              onClick={onApprove}
              disabled={qrisActionLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#0CAF60] hover:bg-[#087A4B] text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
            >
              {qrisActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {qrisActionLoading ? 'Memproses...' : 'Approve Pembayaran'}
            </button>
            <button
              onClick={onOpenCancelModal}
              disabled={qrisActionLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#FFF0F0] border border-[#F5C6C9] text-[#D94850] font-medium py-3 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Batalkan Transaksi
            </button>
            <button
              onClick={onBackHome}
              className="w-full text-[11px] font-normal text-[#68758A] hover:text-[#10233E] transition-colors py-1"
            >
              Kembali ke Home (abaikan QR)
            </button>
          </div>
        </div>
      </div>

      {/* Modal QR besar — hanya QR + tombol tutup */}
      {showQrisImageModal && qrSrc && (
        <div
          className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in"
          onClick={onCloseQrisImage}
          role="dialog"
          aria-modal="true"
          aria-label="QR pembayaran"
        >
          <div
            className="relative bg-white rounded-2xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onCloseQrisImage}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-[#10233E] hover:bg-gray-100"
              aria-label="Tutup QR pembayaran"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={qrSrc}
              alt="QR pembayaran QRIS ukuran besar"
              className="w-[min(80vw,360px)] h-[min(80vw,360px)] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Modal alasan batal (alasan wajib) */}
      {showQrisCancelModal && (
        <>
          <div onClick={() => !qrisActionLoading && onCloseCancelModal()} className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div className="fixed left-0 right-0 top-1/2 -translate-y-1/2 z-[70] mx-auto max-w-sm bg-white rounded-2xl shadow-2xl p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#10233E]">Alasan Pembatalan</h3>
              <button onClick={() => !qrisActionLoading && onCloseCancelModal()} className="p-1"><X className="w-4 h-4 text-[#68758A]" /></button>
            </div>
            <p className="text-[10px] font-normal text-[#68758A] mb-2">Alasan wajib diisi sebelum transaksi QRIS dibatalkan.</p>
            <textarea
              value={qrisCancelReason}
              onChange={(e) => onSetQrisCancelReason(e.target.value)}
              placeholder="Contoh: pelanggan membatalkan pembayaran..."
              rows={3}
              className="w-full px-3 py-2.5 bg-[#FAFBFC] border border-gray-100 rounded-xl text-xs text-[#10233E] outline-none focus:border-[#D94850] resize-none"
            />
            {qrisCancelError && (
              <p className="text-[10px] font-normal text-[#D94850] mt-1.5">{qrisCancelError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={onCloseCancelModal}
                disabled={qrisActionLoading}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium text-[#68758A] bg-white border border-gray-100 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Tutup
              </button>
              <button
                onClick={onCancel}
                disabled={qrisActionLoading}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium text-white bg-[#D94850] hover:bg-[#c13f46] transition-colors disabled:opacity-50"
              >
                {qrisActionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
