'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { METODE_LABEL } from '@/lib/constants';
import { toast } from '@/components/ui/ToastProvider';
import QRCode from 'qrcode';

/**
 * useCheckout — kapsulkan alur pembayaran / checkout dari pos-engine.jsx:
 * handleBayar (cash / QRIS pending), handleNewTransaction, approve/cancel QRIS,
 * generate QR lokal, dan share struk.
 *
 * Deps (di-pass dari screen):
 *   cart, subtotal, diskon, total, cartCount,
 *   selectedCustomer, setSelectedCustomer, pelangganList,
 *   user, toko, shift,
 *   fetchProduk, fetchTodayStats, fetchRiwayat,
 *   resetCart, setDiskon,
 *   setView (opsional — dipanggil handleNewTransaction utk kembali ke 'home'),
 *   showFeedback (opsional — default ke toast)
 *
 * Semua state + handler punya nama identik dengan yang dipakai pos-engine.jsx.
 * uangNum & kembalian dihitung di dalam hook.
 */
export function useCheckout({
  cart,
  subtotal,
  diskon,
  total,
  cartCount,
  selectedCustomer,
  setSelectedCustomer,
  pelangganList,
  user,
  toko,
  shift,
  fetchProduk,
  fetchTodayStats,
  fetchRiwayat,
  resetCart,
  setDiskon,
  setView,
  showFeedback,
}) {
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [metodeBayar, setMetodeBayar] = useState('cash');
  const [uangDiterima, setUangDiterima] = useState('');
  const [completedTx, setCompletedTx] = useState(null);

  // QRIS pending (dynamic QR + approval manual)
  const [qrisPendingTx, setQrisPendingTx] = useState(null);
  const [showQrisPending, setShowQrisPending] = useState(false);
  const [showQrisCancelModal, setShowQrisCancelModal] = useState(false);
  const [qrisCancelReason, setQrisCancelReason] = useState('');
  const [qrisCancelError, setQrisCancelError] = useState('');
  const [qrisActionLoading, setQrisActionLoading] = useState(false);
  const [qrisImageSrc, setQrisImageSrc] = useState('');
  const [qrisImageError, setQrisImageError] = useState('');
  const [showQrisImageModal, setShowQrisImageModal] = useState(false);

  // Payment modal / step
  const [showPay, setShowPay] = useState(false);
  const [payStep, setPayStep] = useState('cart'); // 'cart' | 'pay'
  const [showReceipt, setShowReceipt] = useState(false);

  const feedback = useCallback(
    showFeedback || ((type, title, message) => toast[type](message, { title })),
    [showFeedback]
  );

  const uangNum = uangDiterima === '' ? total : (Number(uangDiterima) || 0);
  const kembalian = Math.max(0, uangNum - total);

  // Generate QR lokal dari payload transaksi pending (tidak depend API gambar eksternal)
  useEffect(() => {
    let active = true;
    const payload = qrisPendingTx?.qris_payload;
    setQrisImageError('');
    setShowQrisImageModal(false);
    if (!payload) {
      setQrisImageSrc('');
      return undefined;
    }
    setQrisImageSrc('');
    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#10233E', light: '#FFFFFF' },
    })
      .then((src) => {
        if (active) setQrisImageSrc(src);
      })
      .catch(() => {
        if (active) setQrisImageError('QR pembayaran gagal dibuat. Silakan coba transaksi lagi.');
      });
    return () => { active = false; };
  }, [qrisPendingTx?.qris_payload]);

  const handleBayar = useCallback(async () => {
    if (isPaying || (metodeBayar === 'cash' && uangNum < total)) return;
    setIsPaying(true);

    try {
      const payload = {
        shift_id: shift?.id || undefined,
        subtotal,
        total,
        pelanggan_id: selectedCustomer?.id !== 'umum' ? selectedCustomer?.id : null,
        metode_bayar: metodeBayar,
        nominal_bayar: metodeBayar === 'cash' ? uangNum : total,
        diskon_total: diskon,
        items: cart.map(item => ({
          produk_id: item.id,
          produk_satuan_jual_id: item.satuan_jual?.[0]?.id || null,
          nama_produk: item.nama,
          satuan: item.satuan_dasar?.nama || 'Pcs',
          konversi: item.satuan_jual?.[0]?.konversi || 1,
          qty: item.qty,
          harga_satuan: item.harga,
          diskon: 0,
          subtotal: item.harga * item.qty,
        })),
      };

      const res = await api.post('/kasir/transaksi', payload);
      const data = res?.data || {};

      const tx = {
        id: data.id,
        nomor_transaksi: data.nomor_transaksi || `#TRK-${Date.now().toString().slice(-6)}`,
        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        total,
        uang_diterima: metodeBayar === 'cash' ? uangNum : total,
        kembalian: metodeBayar === 'cash' ? kembalian : 0,
        items: cart.map(item => ({ ...item })),
        kasir: user?.nama || 'Kasir',
        toko: toko?.nama || 'Toko',
        toko_alamat: toko?.alamat || '',
        pelanggan: selectedCustomer?.nama || 'Pelanggan Umum',
        metode_bayar: metodeBayar,
        status_qris: data.status_qris || null,
      };

      // QRIS → backend buat transaksi pending (dynamic QR). Tampilkan panel QR dulu.
      if (metodeBayar === 'qris' && (data.status === 'pending' || data.status_qris === 'pending')) {
        setQrisPendingTx({ ...tx, qris_payload: data.qris_payload || '' });
        setShowPay(false);
        setPayStep('cart');
        setPayError(null);
        setUangDiterima('');
        setShowQrisPending(true);
        fetchProduk();
        fetchTodayStats();
        fetchRiwayat(1);
        return;
      }

      setCompletedTx(tx);
      setShowPay(false);
      setPayStep('cart');
      setShowReceipt(true);
      setPayError(null);
      setUangDiterima('');
      fetchProduk();
      fetchTodayStats();
      fetchRiwayat(1);
    } catch (err) {
      setPayError(err.response?.data?.pesan || err.message || 'Terjadi kesalahan saat memproses pembayaran.');
      feedback('error', 'Gagal Transaksi', err.response?.data?.pesan || err.message);
    } finally {
      setIsPaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaying, metodeBayar, uangNum, total, subtotal, diskon, cart, selectedCustomer, shift, fetchProduk, fetchTodayStats, fetchRiwayat, feedback]);

  const handleNewTransaction = useCallback(() => {
    resetCart();
    setDiskon(0);
    setUangDiterima('');
    setMetodeBayar('cash');
    setSelectedCustomer?.(pelangganList[0] || { id: 'umum', nama: 'Pelanggan Umum', no_hp: '' });
    setShowReceipt(false);
    setShowPay(false);
    setPayStep('cart');
    setShowQrisPending(false);
    setQrisPendingTx(null);
    setShowQrisCancelModal(false);
    setQrisCancelReason('');
    setQrisCancelError('');
    setView?.('home');
  }, [resetCart, setDiskon, pelangganList, setSelectedCustomer, setView]);

  // Bagikan struk (Web Share / clipboard)
  const shareStruk = useCallback(async () => {
    const tx = completedTx;
    if (!tx) return;
    const metodeLabel = METODE_LABEL[tx.metode_bayar] || 'Tunai';
    const lines = [
      tx.toko,
      tx.toko_alamat,
      '--------------------------------',
      `No.     : ${tx.nomor_transaksi}`,
      `Tanggal : ${tx.tanggal}`,
      `Waktu   : ${tx.waktu}`,
      `Kasir   : ${tx.kasir}`,
      `Pelanggan: ${tx.pelanggan}`,
      `Metode  : ${metodeLabel}`,
      '--------------------------------',
      ...(tx.items || []).map(i => `${i.nama}\n  ${i.qty} x ${formatRupiah(i.harga)} = ${formatRupiah(i.harga * i.qty)}`),
      '--------------------------------',
      `Subtotal : ${formatRupiah(subtotal)}`,
      `Diskon   : -${formatRupiah(diskon)}`,
      `TOTAL    : ${formatRupiah(tx.total)}`,
      `${metodeLabel}  : ${formatRupiah(tx.uang_diterima)}`,
      `Kembalian: ${formatRupiah(tx.kembalian)}`,
      '--------------------------------',
      'Terima kasih telah berbelanja!',
    ];
    const text = lines.join('\n');
    if (navigator.share) {
      try { await navigator.share({ title: 'Struk ' + tx.nomor_transaksi, text }); return; } catch { /* batal share */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      feedback('success', 'Struk Disalin', 'Teks struk telah disalin ke clipboard.');
    } catch {
      feedback('info', 'Struk', text.slice(0, 200));
    }
  }, [completedTx, subtotal, diskon, feedback]);

  // QRIS pending: setujui bayar → tampilkan struk (+ refresh riwayat)
  const handleApproveQris = useCallback(async () => {
    if (!qrisPendingTx?.id || qrisActionLoading) return;
    setQrisActionLoading(true);
    try {
      await api.post(`/kasir/transaksi/${qrisPendingTx.id}/qris/approve`, { alasan: 'dibayar' });
      setCompletedTx(qrisPendingTx);
      setShowQrisPending(false);
      setQrisPendingTx(null);
      resetCart();
      setDiskon(0);
      setShowReceipt(true);
      fetchProduk();
      fetchTodayStats();
      fetchRiwayat(1);
      feedback('success', 'Pembayaran Dikonfirmasi', 'Transaksi QRIS telah disetujui.');
    } catch (err) {
      feedback('error', 'Gagal Menyetujui', err.response?.data?.pesan || err.message || 'Terjadi kesalahan.');
    } finally {
      setQrisActionLoading(false);
    }
  }, [qrisPendingTx, qrisActionLoading, resetCart, setDiskon, fetchProduk, fetchTodayStats, fetchRiwayat, feedback]);

  // QRIS pending: batalkan transaksi (alasan wajib)
  const handleCancelQris = useCallback(async () => {
    const alasan = (qrisCancelReason || '').trim();
    if (!alasan) {
      setQrisCancelError('Alasan pembatalan wajib diisi.');
      return;
    }
    if (!qrisPendingTx?.id || qrisActionLoading) return;
    setQrisActionLoading(true);
    try {
      await api.post(`/kasir/transaksi/${qrisPendingTx.id}/qris/cancel`, { alasan });
      setShowQrisCancelModal(false);
      setShowQrisPending(false);
      setQrisPendingTx(null);
      setQrisCancelReason('');
      setQrisCancelError('');
      resetCart();
      setDiskon(0);
      setUangDiterima('');
      fetchProduk();
      fetchTodayStats();
      fetchRiwayat(1);
      feedback('info', 'Transaksi Dibatalkan', 'Transaksi QRIS telah dibatalkan.');
    } catch (err) {
      setQrisCancelError(err.response?.data?.pesan || err.message || 'Terjadi kesalahan.');
    } finally {
      setQrisActionLoading(false);
    }
  }, [qrisCancelReason, qrisPendingTx, qrisActionLoading, resetCart, setDiskon, fetchProduk, fetchTodayStats, fetchRiwayat, feedback]);

  // Desktop: ganti isi panel ke step 'pay' (uang pas); mobile: buka bottom sheet
  const openPayment = useCallback((isDesktop) => {
    setPayError(null);
    if (isDesktop) {
      setPayStep('pay');
      setUangDiterima(String(total));
    } else {
      setShowPay(true);
    }
  }, [total]);

  return {
    isPaying, setIsPaying,
    payError, setPayError,
    metodeBayar, setMetodeBayar,
    uangDiterima, setUangDiterima,
    completedTx, setCompletedTx,
    qrisPendingTx, setQrisPendingTx,
    showQrisPending, setShowQrisPending,
    showQrisCancelModal, setShowQrisCancelModal,
    qrisCancelReason, setQrisCancelReason,
    qrisCancelError, setQrisCancelError,
    qrisActionLoading, setQrisActionLoading,
    qrisImageSrc, setQrisImageSrc,
    qrisImageError, setQrisImageError,
    showQrisImageModal, setShowQrisImageModal,
    showPay, setShowPay,
    payStep, setPayStep,
    showReceipt, setShowReceipt,
    uangNum,
    kembalian,
    handleBayar,
    handleNewTransaction,
    handleApproveQris,
    handleCancelQris,
    shareStruk,
    openPayment,
  };
}
