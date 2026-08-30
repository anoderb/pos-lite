'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  X,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Loader2,
  ArrowRight,
  ReceiptText,
  ChevronLeft,
} from 'lucide-react';
import { useShiftStore } from '@/store/shiftStore';
import { useAuthStore } from '@/store/authStore';
import { formatRupiah } from '@/lib/utils';

// ── Helper format ──
const fmtWaktu = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// Modal utama: Buka Shift / Guard Navigasi / Tutup Shift + Rekap
export default function ShiftGuardModal() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    shift, isShiftLoading,
    guardOpen, pendingNav, pendingLogout,
    tutupOpen, rekap, rekapLoading, rekapError, kasAktual, catatan,
    fetchShift, bukaShift, jedaShift, lanjutShift, tutupShift, openTutup,
    batalNav, selesaikanGuard, setTutupOpen, setKasAktual, setCatatan,
  } = useShiftStore();
  const logout = useAuthStore((s) => s.logout);

  const [modalAwal, setModalAwal] = useState('');
  const [bukaLoading, setBukaLoading] = useState(false);
  const [jedaLoading, setJedaLoading] = useState(false);
  const [tutupLoading, setTutupLoading] = useState(false);
  const [err, setErr] = useState('');

  // Fetch shift sekali saat mount
  useEffect(() => {
    fetchShift();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeGuard = () => {
    if (pendingLogout || tutupOpen) return; // gak bisa tutup paksa saat wajib tutup
    batalNav();
  };

  // ── Aksi: Buka Shift ──
  const doBuka = async () => {
    setErr('');
    const val = Number(modalAwal);
    if (!val || val <= 0) {
      setErr('Modal awal wajib diisi dan lebih dari 0');
      return;
    }
    setBukaLoading(true);
    try {
      await bukaShift(val);
      setModalAwal('');
      setBukaLoading(false);
    } catch (e) {
      setErr(e?.message || 'Gagal membuka shift');
      setBukaLoading(false);
    }
  };

  // ── Aksi: Jeda (lalu lanjut ke pendingNav) ──
  const doJeda = async () => {
    setErr('');
    setJedaLoading(true);
    try {
      await jedaShift();
      setJedaLoading(false);
      selesaikanGuard(pendingNav?.href);
    } catch (e) {
      setErr(e?.message || 'Gagal menjeda shift');
      setJedaLoading(false);
    }
  };

  // ── Submit tutup shift (dari guard logout) ──
  const doTutup = async () => {
    setErr('');
    if (!shift) return;
    setTutupLoading(true);
    try {
      await tutupShift({ kasAktual, catatan });
      setTutupLoading(false);
      setTutupOpen(false);
      // Selesai tutup → lanjut sesuai konteks
      if (pendingLogout) {
        await logout();
        router.replace('/login');
      } else if (pendingNav?.href) {
        selesaikanGuard(pendingNav.href);
      } else {
        // tutup manual dari tombol di POS — refresh halaman biar bersih
        window.location.reload();
      }
    } catch (e) {
      setErr(e?.message || 'Gagal menutup shift');
      setTutupLoading(false);
    }
  };

  // Hitung selisih live
  // Rekap live dihitung backend dari transaksi pada shift yang sedang dipreview.
  const allTxs = rekap?.transaksi || [];
  const totalPenjualanLive = Number(rekap?.total_penjualan ?? 0);
  const totalQrisLive = Number(rekap?.total_qris ?? 0);
  const totalCash = Number(rekap?.total_cash ?? 0);
  const modalAwalShift = Number(shift?.modal_awal || 0);
  const expectedKas = modalAwalShift + totalCash;
  const kasAktualNum = Number(kasAktual) || 0;
  const selisihLive = kasAktualNum ? kasAktualNum - expectedKas : 0;

  // ── Tampilan loading ──
  if (isShiftLoading) return null;

  // ═══════════ CASE A: Belum ada shift → Modal Buka Shift (wajib) ═══════════
  if (!shift && pathname === '/owner/pos') {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => router.replace('/owner/dashboard')}
            className="absolute right-4 top-4 p-1.5 text-[#68758A] hover:text-[#10233E] rounded-lg transition-colors"
            title="Tutup dan kembali ke dashboard"
            aria-label="Tutup modal buka shift"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#10233E]">Buka Shift Dulu</h2>
            <p className="text-xs text-[#68758A] mt-1">
              Shift harus aktif sebelum transaksi. Isi modal awal (uang cash yang disiapkan).
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#68758A] block mb-1">Modal Awal (Rp)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#0CAF60]">Rp</span>
                <input
                  type="number"
                  value={modalAwal}
                  onChange={(e) => { setModalAwal(e.target.value); setErr(''); }}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-base font-medium text-[#10233E] outline-none focus:border-[#0CAF60]"
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-[#68758A] mt-1">Harus lebih dari 0.</p>
            </div>
            {err && <p className="text-[11px] text-[#D94850] font-medium">{err}</p>}
            <button
              onClick={doBuka}
              disabled={bukaLoading}
              className="w-full py-3 bg-[#0CAF60] text-white font-medium rounded-xl hover:bg-[#087A4B] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {bukaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Buka Shift
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════ CASE B: Shift JEDA → Modal Lanjutkan (HANYA di halaman POS) ═══════════
  // Di halaman lain cukup badge navbar — jangan ganggu akses dashboard/produk/dll
  // !tutupOpen: biarkan modal Tutup Shift (CASE di bawah) render saat tombol tutup diklik
  if (shift?.status === 'jeda' && !guardOpen && !tutupOpen && pathname === '/owner/pos') {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center mx-auto mb-3">
              <Play className="w-7 h-7 ml-0.5" />
            </div>
            <h2 className="text-lg font-bold text-[#10233E]">Shift Dijeda</h2>
            <p className="text-xs text-[#68758A] mt-1">
              Shift sedang jeda sejak {fmtWaktu(shift.waktu_jeda)}. Lanjutkan untuk kembali transaksi.
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={async () => { setErr(''); try { await lanjutShift(); } catch (e) { setErr(e?.message || 'Gagal melanjutkan shift'); } }}
              className="w-full py-3 bg-[#0CAF60] text-white font-medium rounded-xl hover:bg-[#087A4B] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" /> Lanjutkan Jualan
            </button>
            <button
              onClick={() => openTutup()}
              className="w-full py-2.5 text-xs font-medium text-[#68758A] hover:text-[#D94850] transition-colors"
            >
              Tutup Shift...
            </button>
          </div>
          {err && <p className="text-[11px] text-[#D94850] font-medium mt-2">{err}</p>}
        </div>
      </div>
    );
  }

  // ═══════════ CASE C: Modal Guard Navigasi/Logout ═══════════
  if (guardOpen) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="text-center flex-1">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#10233E]">
                {pendingLogout ? 'Shift Masih Aktif' : 'Shift Masih Aktif'}
              </h2>
              <p className="text-xs text-[#68758A] mt-1">
                {pendingLogout
                  ? 'Untuk logout, shift harus ditutup dulu (rekap kas).'
                  : 'Jeda dulu shift sebelum pindah halaman, atau tutup langsung.'}
              </p>
            </div>
            {!pendingLogout && (
              <button onClick={closeGuard} className="p-1.5 text-[#68758A] hover:text-[#10233E] rounded-lg transition-colors" title="Batal">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            <button
              onClick={doJeda}
              disabled={jedaLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#0CAF60] text-white font-medium rounded-xl hover:bg-[#087A4B] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {jedaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              {pendingLogout ? 'Jeda Dulu, Logout Nanti' : 'Jeda Shift'} 
            </button>
            <button
              onClick={() => openTutup()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-100 text-[#10233E] font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-[#0CAF60]" /> Tutup Shift + Rekap
            </button>
            {!pendingLogout && (
              <button
                onClick={closeGuard}
                className="w-full py-2.5 text-xs font-medium text-[#68758A] hover:text-[#10233E] transition-colors"
              >
                Batal — tetap di POS
              </button>
            )}
          </div>
          {err && <p className="text-[11px] text-[#D94850] font-medium mt-2">{err}</p>}
        </div>
      </div>
    );
  }

  // ═══════════ CASE D: Modal Tutup Shift + Rekap ═══════════
  if (tutupOpen) {
    if (rekapLoading) {
      return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center">
            <Loader2 className="w-7 h-7 text-[#0CAF60] animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#10233E]">Memuat rekap shift...</p>
            <p className="text-xs text-[#68758A] mt-1">Mengambil transaksi terbaru dari server.</p>
          </div>
        </div>
      );
    }
    if (rekapError || !rekap) {
      return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center">
            <AlertTriangle className="w-7 h-7 text-[#D94850] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#10233E]">Rekap belum bisa dimuat</p>
            <p className="text-xs text-[#68758A] mt-1">{rekapError || 'Data rekap shift tidak tersedia.'}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setTutupOpen(false)} className="flex-1 py-2.5 text-xs font-medium text-[#68758A] rounded-xl border border-gray-100">Batal</button>
              <button onClick={() => openTutup(shift.id)} className="flex-1 py-2.5 text-xs font-medium text-white bg-[#0CAF60] rounded-xl">Coba Lagi</button>
            </div>
          </div>
        </div>
      );
    }
    const txList = rekap?.transaksi || [];
    const totalPenjualan = totalPenjualanLive;
    const totalQris = totalQrisLive;
    const totalVoid = Number(rekap?.total_void ?? 0);

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <h2 className="text-base font-bold text-[#10233E]">Tutup Shift</h2>
              <p className="text-[10px] text-[#68758A] mt-0.5">Buka {fmtWaktu(shift.waktu_buka)}</p>
            </div>
            <button
              onClick={() => setTutupOpen(false)}
              disabled={pendingLogout}
              className="p-1.5 text-[#68758A] hover:text-[#10233E] rounded-lg transition-colors"
              title="Batal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Rekap Kas */}
            <div className="bg-[#FAFBFC] border border-gray-50 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-semibold text-[#68758A] uppercase tracking-wide">Rekap Kas</p>
              <Row label="Modal Awal" value={formatRupiah(modalAwalShift)} />
              <Row label="Total Penjualan" value={formatRupiah(totalPenjualan)} />
              <Row label="– Tunai" value={formatRupiah(totalCash)} />
              <Row label="– QRIS" value={formatRupiah(totalQris)} />

              {totalVoid > 0 && <Row label="Void" value={formatRupiah(totalVoid)} red />}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs font-semibold text-[#10233E]">Kas Seharusnya</span>
                <span className="text-sm font-bold text-[#10233E]">{formatRupiah(expectedKas)}</span>
              </div>
            </div>

            {/* Input Kas Aktual */}
            <div>
              <label className="text-xs font-semibold text-[#68758A] block mb-1">Kas Aktual (hitung uang fisik)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#0CAF60]">Rp</span>
                <input
                  type="number"
                  value={kasAktual}
                  onChange={(e) => setKasAktual(e.target.value)}
                  placeholder={String(expectedKas)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-base font-medium text-[#10233E] outline-none focus:border-[#0CAF60]"
                  autoFocus
                />
              </div>
              {kasAktual !== '' && (
                <div className={`flex items-center gap-2 mt-2 text-xs font-medium ${selisihLive >= 0 ? 'text-[#0CAF60]' : 'text-[#D94850]'}`}>
                  Selisih:
                  {selisihLive >= 0 ? (
                    <span>Lebih {formatRupiah(selisihLive)}</span>
                  ) : (
                    <span>Kurang {formatRupiah(Math.abs(selisihLive))}</span>
                  )}
                </div>
              )}
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan (opsional)"
                className="w-full mt-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs text-[#10233E] outline-none focus:border-[#0CAF60]"
              />
            </div>

            {/* Rekap Transaksi */}
            <div>
              <p className="text-[10px] font-semibold text-[#68758A] uppercase tracking-wide mb-2">Transaksi ({txList.length})</p>
              {txList.length === 0 ? (
                <p className="text-xs text-[#68758A]">Belum ada transaksi di shift ini.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {txList.slice().reverse().map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between bg-white border border-gray-50 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-[11px] font-semibold text-[#10233E]">{tx.nomor_transaksi}</p>
                        <p className="text-[9px] text-[#68758A]">{fmtWaktu(tx.created_at)}</p>
                      </div>
                      <span className={`text-[11px] font-semibold ${tx.metode_bayar === 'cash' ? 'text-[#0CAF60]' : tx.metode_bayar === 'qris' ? 'text-violet-600' : 'text-sky-600'}`}>
                        {formatRupiah(tx.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {err && <p className="text-[11px] text-[#D94850] font-medium">{err}</p>}
          </div>

          {/* Footer CTA */}
          <div className="px-5 py-4 border-t border-gray-50 bg-[#FAFBFC]">
            <button
              onClick={doTutup}
              disabled={tutupLoading || Number(kasAktual) < 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0CAF60] text-white font-medium rounded-2xl hover:bg-[#087A4B] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {tutupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {tutupLoading ? 'Menyimpan...' : pendingLogout ? 'Tutup & Logout' : 'Tutup & Simpan Rekap'}
              {!tutupLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function Row({ label, value, red }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[#68758A]">{label}</span>
      <span className={`font-medium ${red ? 'text-[#D94850]' : 'text-[#10233E]'}`}>{value}</span>
    </div>
  );
}
