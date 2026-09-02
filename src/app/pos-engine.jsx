'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ScanBarcode,
  PenLine,
  Package,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle,
  XCircle,
  Banknote,
  QrCode,
  ArrowRight,
  Info,
  Loader2,
  ReceiptText,
  LayoutGrid,
  List,
  Pause,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { getTf } from '@/lib/tf';
import { cn, formatRupiah } from '@/lib/utils';
import { api, getApiBaseUrl } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useShiftStore } from '@/store/shiftStore';
import { useCart } from '@/hooks/useCart';
import { usePosData } from '@/hooks/usePosData';
import { useAiModel } from '@/hooks/useAiModel';
import { useAiScanner } from '@/hooks/useAiScanner';
import { useCheckout } from '@/hooks/useCheckout';
import { toast } from '@/components/ui/ToastProvider';
import ProdukThumb from '@/components/ui/ProdukThumb';
import CustomerSheet from '@/components/pos/CustomerSheet';
import PaymentSheet from '@/components/pos/PaymentSheet';
import QrisPendingPanel from '@/components/pos/QrisPendingPanel';
import ReceiptModal from '@/components/pos/ReceiptModal';
import QRCode from 'qrcode';
import { METODE_LABEL, METODE_BADGE, METODE_ICON_BG } from '@/lib/constants';
import { useProdukFilter } from '@/app/pos-engine/_hooks/useProdukFilter';
import ProdukList from '@/app/pos-engine/_components/ProdukList';
import RiwayatSheet from '@/app/pos-engine/_components/RiwayatSheet';

/* ═══════════════════════════════════════════════════ */
export default function KasirPosPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  // Data & fetch POS — source of truth dipindah ke hook usePosData
  const {
    produkList, setProdukList,
    pelangganList, setPelangganList,
    tokoPay, setTokoPay,
    todayStats, setTodayStats,
    kategoriList, setKategoriList,
    selectedKategori, setSelectedKategori,
    riwayat, setRiwayat,
    riwayatTotal, riwayatPage, riwayatPages, isRiwayatLoading, riwayatFilter, riwayatPendingTotal,
    setRiwayatPage, setRiwayatFilter,
    produkPage, setProdukPage,
    produkViews, setProdukViews,
    viewMode, setViewMode,
    sortBy, setSortBy,
    fetchRiwayat, fetchPendingRiwayat, reloadRiwayatPage, switchRiwayatFilter,
    fetchTokoPay, fetchTodayStats, fetchKategori, fetchProduk, fetchPelanggan,
  } = usePosData();

  const [scanMode, setScanMode] = useState('ai'); // 'ai' | 'barcode'

  // Cart — source of truth dipindah ke hook useCart
  const {
    cart,
    diskon,
    setDiskon,
    addToCart,
    updateQty,
    clearCart,
    resetCart,
    subtotal,
    total,
    cartCount,
  } = useCart();
  const [view, setView] = useState('home'); // 'home' | 'cart'

  // Modals (scanner state dipindah ke hook useAiScanner)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState({ id: 'umum', nama: 'Pelanggan Umum', no_hp: '' });
  const [showPayment, setShowPayment] = useState(false);

  // === DEPENDENCIES hook lain (harus tersedia sebelum useCheckout/useAiScanner) ===
  // Auth
  const { user, toko } = useAuthStore();
  // Shift (source of truth di shiftStore — sinkron dgn guard global)
  const shift = useShiftStore((s) => s.shift);
  const isShiftLoading = useShiftStore((s) => s.isShiftLoading);
  const fetchShiftStore = useShiftStore((s) => s.fetchShift);
  const openTutup = useShiftStore((s) => s.openTutup);
  const [modalAwal, setModalAwal] = useState('');
  // Feedback toast — dipakai useCheckout & useAiScanner
  const showFeedback = (type, title, message) => toast[type](message, { title });
  // TFJS Model & Mapping — source of truth di hook useAiModel
  const {
    modelInfo, setModelInfo,
    modelMapping, setModelMapping,
    tfModel, setTfModel,
    modelError, setModelError,
    isModelLoading, setIsModelLoading,
    classLabels, setClassLabels,
    fetchActiveModel,
  } = useAiModel();

  // Checkout & payment — dipindah ke hook useCheckout
  const {
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
  } = useCheckout({
    cart, subtotal, diskon, total, cartCount,
    selectedCustomer, setSelectedCustomer, pelangganList,
    user, toko, shift,
    fetchProduk, fetchTodayStats, fetchRiwayat,
    resetCart, setDiskon,
    setView,
    showFeedback,
  });

  // AI Scanner & barcode — dipindah ke hook useAiScanner
  const {
    showAiScan, setShowAiScan,
    showBarcodeScan, setShowBarcodeScan,
    showAiCandidates, setShowAiCandidates,
    isDetecting, setIsDetecting,
    detectedProduk, setDetectedProduk,
    scannedBarcodeCode, setScannedBarcodeCode,
    barcodeDetectorSupported, setBarcodeDetectorSupported,
    barcodeNotFound, setBarcodeNotFound,
    manualBarcode, setManualBarcode,
    cameraActive, setCameraActive,
    aiCandidates, setAiCandidates,
    lastPredictionsMetadata, setLastPredictionsMetadata,
    videoRef,
    captureCameraFrame,
    getProductByClassSlug,
    handleDetectedBarcode,
    handleManualBarcodeSubmit,
    handleOpenAiScan,
    handleCaptureSnapshot,
    handleSelectCandidate,
  } = useAiScanner({
    produkList, tfModel, modelInfo, classLabels, modelMapping, addToCart,
    fetchActiveModel, isModelLoading,
  });

  useEffect(() => { fetchRiwayat(1); }, []);

  // Klik nomor transaksi di riwayat → buka struk (tanpa harus baru checkout)
  const openStrukRiwayat = (t) => {
    if (!t) return;
    const kasirNama = typeof t.kasir === 'object' && t.kasir ? (t.kasir.nama || 'Kasir') : (t.kasir || 'Kasir');
    setCompletedTx({
      nomor_transaksi: t.nomor_transaksi || '-',
      tanggal: t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
      waktu: t.created_at ? new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '',
      total: Number(t.total || 0),
      uang_diterima: Number(t.total || 0),
      kembalian: 0,
      items: Array.isArray(t.items) ? t.items : [],
      kasir: kasirNama,
      toko: toko?.nama || 'Toko',
      toko_alamat: toko?.alamat || '',
      pelanggan: typeof t.pelanggan === 'object' && t.pelanggan ? (t.pelanggan.nama || 'Pelanggan Umum') : 'Pelanggan Umum',
      metode_bayar: t.metode_bayar || 'cash',
      status_qris: t.status_qris || null,
      alasan_batal: t.alasan || t.alasan_batal || '',
    });
    setShowReceipt(true);
  };

  // Deteksi desktop (≥lg) untuk pilih: inline pay vs bottom sheet
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const upd = () => setIsDesktop(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProduk();
    fetchPelanggan();
    fetchActiveModel();
    fetchShiftStore();
    fetchTodayStats();
    fetchKategori();
    fetchTokoPay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Metode tersedia: tunai/qris mengikuti toggle pengaturan
  const metodeTersedia = [
    ...(tokoPay?.tunai_aktif !== false ? [{ id: 'cash', label: 'Tunai', icon: Banknote }] : []),
    ...(tokoPay?.qris_aktif && tokoPay?.qris_status === 'valid' ? [{ id: 'qris', label: 'QRIS', icon: QrCode }] : []),
  ];

  // Fallback: metode terpilih tidak tersedia → kembalikan ke tunai
  useEffect(() => {
    if (tokoPay === null) return;
    if (!metodeTersedia.some(m => m.id === metodeBayar)) setMetodeBayar('cash');
  }, [tokoPay]);

  // Sembunyikan bottom nav saat struk / panel QRIS tampil (full-screen)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const overlayOpen = showReceipt || showQrisPending;
    window.dispatchEvent(new CustomEvent(overlayOpen ? 'owner-nav-hide' : 'owner-nav-show'));
    return () => window.dispatchEvent(new CustomEvent('owner-nav-show'));
  }, [showReceipt, showQrisPending]);

  // Generate QR secara lokal dari payload transaksi. Tidak bergantung API gambar
  // eksternal yang bisa diblokir browser/network.
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


  // Filter/sort/pagination katalog — pindahan ke useProdukFilter
  const { produkTotalPages, filteredProduk, goProdukPage } = useProdukFilter({
    produkList, search, selectedKategori, sortBy, produkPage, produkViews, setProdukPage,
  });

  /* ════════════════════════════════════════════════════
     SCREEN 1: HALAMAN KASIR (AWAL) — HOME VIEW
     ════════════════════════════════════════════════════ */

  // Shift Guard — wajib buka shift sebelum POS.
  // Modal "Buka Shift" / "Lanjutkan" / "Tutup" ditangani ShiftGuardModal (OwnerLayout).
  // Di sini cukup tampilkan kosong jika belum ada shift (buka/jeda).
  if (isShiftLoading) {
    return (
      <>
        <div className="max-w-md mx-auto flex items-center justify-center min-h-screen">
          <p className="text-sm text-gray-500">Memeriksa shift...</p>
        </div>
      </>
    );
  }

  if (!shift || shift.status === 'jeda') {
    return (
      <>
        {/* Modal global ShiftGuardModal akan tampil otomatis */}
        <div className="max-w-md mx-auto flex items-center justify-center min-h-screen">
          <p className="text-sm text-gray-500">Menyiapkan shift...</p>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-[430px] lg:max-w-none mx-auto space-y-4 pb-24 text-[#10233E]">
      {/* ═══ HEADER (desktop) — mobile pakai greeting banner lama di bawah ═══ */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold leading-7 text-[#10233E]">Mode Kasir POS</h1>
          <p className="text-xs font-normal text-[#68758A] mt-0.5">Kelola kasir &amp; transaksi toko Anda.</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-gray-50 rounded-2xl shadow-sm px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center font-semibold text-sm shrink-0">
            {(user?.nama || 'K')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#10233E] leading-4">{user?.nama || 'Kasir'}</p>
            <p className="text-[10px] font-normal text-[#0CAF60] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0CAF60]" /> Kasir
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => useShiftStore.getState().requestNav('/owner/dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-[11px] font-medium text-[#68758A] hover:bg-gray-50 transition-colors shrink-0"
              title="Jeda shift lalu pindah halaman"
            >
              <Pause className="w-3.5 h-3.5" /> Jeda Shift
            </button>
            <button
              onClick={() => openTutup()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#F5C6C9] text-[#D94850] hover:bg-[#FFF0F0] transition-colors shrink-0"
              title="Tutup shift & rekap kas"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Tutup Shift
            </button>
          </div>
        </div>
      </div>

      {/* ═══ LAYOUT 2 KOLOM (desktop) ═══ */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,380px)] lg:gap-5 lg:items-start">

      {/* ═══ KOLOM KIRI ═══ */}
      <div className="lg:col-start-1 space-y-4 min-w-0">

      {/* ── Greeting Banner + Stat Hari Ini (mobile only, desktop pakai header di atas) ── */}
      <section className="lg:hidden relative overflow-hidden rounded-[20px] p-4 bg-gradient-to-br from-[#E8FAF0] via-white to-[#FFF8D9] shadow-[0_2px_10px_rgba(16,35,62,.05)]">
        <div className="relative z-10 max-w-[62%]">
          <h1 className="text-base font-semibold leading-6">Halo, {user?.nama || 'Kasir'} 👋</h1>
          <p className="text-[10px] font-normal text-[#68758A] mt-0.5" suppressHydrationWarning>
            {shift ? `Shift aktif • ${mounted ? new Date(shift.waktu_buka || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''} WIB` : 'Belum ada shift aktif'}
          </p>
          <div className="flex gap-1.5 mt-3">
            <div className="flex-1 bg-white/85 backdrop-blur rounded-xl p-2">
              <div className="flex items-center gap-1"><ShoppingCart className="w-3 h-3 text-[#0CAF60]" /><span className="text-[8px] font-medium text-[#68758A] truncate">Total Penjualan Hari Ini</span></div>
              <p className="text-xs font-medium mt-0.5">{formatRupiah(todayStats.omzet)}</p>
              <p className="text-[8px] font-normal text-[#68758A]">{todayStats.total_transaksi} Transaksi</p>
            </div>
            <div className="flex-1 bg-white/85 backdrop-blur rounded-xl p-2">
              <div className="flex items-center gap-1"><ReceiptText className="w-3 h-3 text-violet-600" /><span className="text-[8px] font-medium text-[#68758A] truncate">Total Item Terjual</span></div>
              <p className="text-xs font-medium mt-0.5">{todayStats.total_item_terjual} item</p>
              <p className="text-[8px] font-normal text-[#68758A]">{todayStats.total_produk_terjual} Produk</p>
            </div>
          </div>
        </div>
        <img src="/assets/tokiva-dashboard/img-pos-3d.png" alt="POS 3D" className="absolute right-0 bottom-0 w-[44%] h-[96%] object-contain object-right-bottom" />
      </section>

      {/* ── Toolbar: Search + Kategori + Urutkan + View + AI/Barcode ── */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68758A]" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setProdukPage(1); }}
              placeholder="Cari produk (nama / barcode)..."
              className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] outline-none border border-gray-50 shadow-sm focus:border-[#0CAF60]"
            />
          </div>
          <button
            onClick={() => { setScanMode('ai'); handleOpenAiScan(); }}
            disabled={isModelLoading}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 shadow-sm',
              isModelLoading ? 'bg-gray-100 text-gray-400' : 'bg-[#0CAF60] text-white hover:bg-[#087A4B] active:scale-[0.98]'
            )}
            title={isModelLoading ? 'Model AI sedang dimuat...' : 'Scan dengan AI Visual Camera'}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">{isModelLoading ? 'Memuat...' : 'AI Scan'}</span>
          </button>
          <button
            onClick={() => { setScanMode('barcode'); setShowBarcodeScan(true); }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 bg-white border border-gray-100 text-[#68758A] shadow-sm hover:bg-gray-50 active:scale-[0.98]"
            title="Scan dengan Barcode Scanner"
          >
            <ScanBarcode className="w-4 h-4" />
            <span className="hidden sm:inline">Barcode</span>
          </button>
        </div>

        {/* Filter bar: kategori + urutkan + view toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedKategori === 'semua' ? '_semua' : selectedKategori}
            onChange={e => { setSelectedKategori(e.target.value === '_semua' ? 'semua' : e.target.value); setProdukPage(1); }}
            className="px-3 py-2 rounded-xl bg-white border border-gray-100 text-[11px] font-medium text-[#10233E] shadow-sm outline-none focus:border-[#0CAF60] cursor-pointer"
          >
            <option value="_semua">Semua Kategori</option>
            {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setProdukPage(1); }}
            className="px-3 py-2 rounded-xl bg-white border border-gray-100 text-[11px] font-medium text-[#10233E] shadow-sm outline-none focus:border-[#0CAF60] cursor-pointer"
          >
            <option value="nama">Nama (A-Z)</option>
            <option value="harga">Harga Terendah</option>
            <option value="stok">Stok Terbanyak</option>
          </select>
          <div className="ml-auto flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-1.5 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-[#E8FAF0] text-[#0CAF60]' : 'text-[#68758A] hover:bg-gray-50')}
              title="Tampilan Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-1.5 rounded-lg transition-colors', viewMode === 'list' ? 'bg-[#E8FAF0] text-[#0CAF60]' : 'text-[#68758A] hover:bg-gray-50')}
              title="Tampilan List"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Katalog Produk (grid/list) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium leading-5">Produk</h3>
          <Link href="/owner/produk" className="text-[10px] font-medium text-[#0CAF60]">Kelola</Link>
        </div>
        {filteredProduk.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Package className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-[11px] font-normal text-[#68758A]">Produk tidak ditemukan</p>
            {search && (
              <button onClick={() => setSearch('')} className="text-[11px] font-medium text-[#0CAF60] hover:underline">
                Reset pencarian
              </button>
            )}
          </div>
        ) : (
          <ProdukList
            produk={filteredProduk}
            onAdd={addToCart}
            variant={viewMode}
            emptyText="Produk tidak ditemukan"
            onResetSearch={() => setSearch('')}
          />
        )}

        {/* Pagination Katalog */}
        {produkTotalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
            <button
              onClick={() => goProdukPage(produkPage - 1)}
              disabled={produkPage <= 1}
              className="p-1.5 rounded-lg bg-white border border-gray-100 text-[#68758A] shadow-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
              title="Halaman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: produkTotalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => goProdukPage(p)}
                className={cn(
                  'min-w-[30px] h-[30px] rounded-lg text-[11px] font-medium transition-colors',
                  p === produkPage ? 'bg-[#0CAF60] text-white shadow-sm' : 'bg-white border border-gray-100 text-[#68758A] hover:bg-gray-50'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goProdukPage(produkPage + 1)}
              disabled={produkPage >= produkTotalPages}
              className="p-1.5 rounded-lg bg-white border border-gray-100 text-[#68758A] shadow-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
              title="Halaman berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      </div>{/* ── tutup kolom kiri ── */}

      {/* ═══ KOLOM KANAN (keranjang + riwayat) ═══ */}
      <div className="lg:col-start-2 space-y-4 min-w-0 lg:sticky lg:top-5">

      {/* ── Keranjang Card (selalu tampil) ── */}
      <div className="bg-white border border-gray-50 rounded-[18px] shadow-sm overflow-hidden">
        {/* Header — desktop ganti judul saat step pay */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-[#FAFBFC]">
          {payStep === 'pay' && isDesktop ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center"><Wallet className="w-3.5 h-3.5" /></span>
                <span className="text-[13px] font-medium text-[#10233E]">Pembayaran</span>
              </div>
              <button
                onClick={() => { setPayStep('cart'); setPayError(null); }}
                className="flex items-center gap-1 text-[10px] font-medium text-[#68758A] hover:text-[#10233E] transition-colors"
                title="Kembali ke keranjang"
              >
                <ChevronLeft className="w-3 h-3" /> Kembali
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center"><ShoppingCart className="w-3.5 h-3.5" /></span>
                <span className="text-[13px] font-medium text-[#10233E]">Keranjang ({cartCount})</span>
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-[10px] font-medium text-[#EF4444] flex items-center gap-1"><Trash2 className="w-3 h-3" /> Bersihkan</button>
              )}
            </>
          )}
        </div>

        {/* STEP PAY (desktop) — ganti isi kartu, tanpa scroll, tombol konfirmasi di bawah */}
        {payStep === 'pay' && isDesktop ? (
          <div className="px-4 py-3 space-y-3 animate-fade-in">
            {/* Total besar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#10233E]">Total Bayar</span>
              <span className="text-2xl font-semibold text-[#0CAF60]">{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-normal text-[#68758A]">
              <span>{cartCount} item</span>
              {diskon > 0 && <span>Diskon -{formatRupiah(diskon)}</span>}
            </div>

            {/* Metode (konfirmasi cepat) */}
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'cash', label: 'Tunai', icon: Banknote, tersedia: tokoPay?.tunai_aktif !== false },
                  { id: 'qris', label: 'QRIS', icon: QrCode, tersedia: !!(tokoPay?.qris_aktif && tokoPay?.qris_status === 'valid') },
                ]
              ).map(m => {
                const isSel = metodeBayar === m.id && m.tersedia;
                return (
                  <button
                    key={m.id}
                    onClick={() => m.tersedia && setMetodeBayar(m.id)}
                    disabled={!m.tersedia}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-medium transition-all',
                      isSel
                        ? 'border-[#0CAF60] bg-[#E8FAF0] text-[#087A4B]'
                        : m.tersedia
                          ? 'border-gray-100 bg-white text-[#68758A] hover:border-gray-200'
                          : 'border-dashed border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed opacity-70'
                    )}
                    title={m.tersedia ? '' : 'Metode belum diaktifkan di Pengaturan Pembayaran'}
                  >
                    <m.icon className="w-4 h-4" />
                    {m.label}{!m.tersedia && <span className="text-[7px]">(off)</span>}
                  </button>
                );
              })}
            </div>

            {/* Uang Diterima + Quick Chips (Tunai) */}
            {metodeBayar === 'cash' && (
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-medium text-[#68758A] mb-1 block">Uang Diterima</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#0CAF60]">Rp</span>
                    <input
                      type="number"
                      value={uangDiterima}
                      onChange={e => setUangDiterima(e.target.value)}
                      placeholder={String(total)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-lg font-medium text-[#0CAF60] outline-none focus:border-[#0CAF60]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setUangDiterima(String(total))}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[#E8FAF0] text-[#087A4B] hover:bg-emerald-100 transition-colors"
                  >
                    Uang Pas
                  </button>
                  {[10000, 20000, 50000, 100000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setUangDiterima(String(nominal))}
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

            {/* Error */}
            {payError && (
              <div className="p-3 rounded-xl bg-[#FFF0F0] border border-[#F5C6C9] flex items-start gap-2 animate-fade-in">
                <XCircle className="w-4 h-4 text-[#D94850] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-[#D94850]">Pembayaran Gagal</p>
                  <p className="text-[10px] font-normal text-[#68758A] mt-0.5">{payError}</p>
                </div>
              </div>
            )}

            {/* CTA Bayar — satu-satunya hijau utama */}
            <button
              onClick={() => { setPayError(null); handleBayar(); }}
              disabled={isPaying || (metodeBayar === 'cash' && uangNum < total)}
              className="w-full flex items-center justify-center gap-2 bg-[#0CAF60] hover:bg-[#087A4B] text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
            >
              {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isPaying ? 'Memproses Pembayaran...' : payError ? 'Coba Lagi' : 'Konfirmasi Bayar'}
              {!isPaying && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        ) : (
        <>
        {cart.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E8FAF0] flex items-center justify-center mx-auto mb-2 text-[#0CAF60]"><ShoppingCart className="w-5 h-5" /></div>
            <p className="text-[11px] font-medium text-[#10233E]">Belum ada produk</p>
            <p className="text-[10px] font-normal text-[#68758A] mt-0.5">Scan atau tambahkan produk untuk memulai transaksi</p>
          </div>
        ) : (
          <div className="px-4 py-2 space-y-2 max-h-44 overflow-y-auto hide-scrollbar">
            {cart.map((item, idx) => (
              <div key={item.id || `mini-cart-${idx}`} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <ProdukThumb nama={item.nama} img={item.foto_url} className="w-8 h-8 rounded-lg shrink-0 text-[9px]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs text-[#10233E] truncate" title={item.nama}>{item.nama}</p>
                    <p className="text-[#68758A] text-[10px] font-normal">{item.qty} x {formatRupiah(item.harga)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-medium text-xs text-[#10233E]">{formatRupiah(item.harga * item.qty)}</span>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-1 py-0.5">
                    <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 flex items-center justify-center text-[#68758A] hover:text-rose-600 rounded hover:bg-white transition-colors" title="Kurangi Qty">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-medium text-xs text-[#10233E] px-0.5 min-w-[14px] text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 flex items-center justify-center text-[#68758A] hover:text-[#0CAF60] rounded hover:bg-white transition-colors" title="Tambah Qty">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => updateQty(item.id, -item.qty)} className="p-1 text-[#68758A] hover:text-rose-500 transition-colors" title="Hapus barang">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Summary + Bayar + metode */}
        <div className="px-4 py-3 border-t border-gray-100 bg-[#FAFBFC] space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-normal text-[#68758A]">Total</span>
            <span className="font-normal text-[#68758A]">{cartCount} item</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-normal text-[#68758A]">Total Bayar</span>
            <span className="text-base font-semibold text-[#0CAF60]">{formatRupiah(subtotal)}</span>
          </div>

          {/* Pilihan Metode (cepat, update state) */}
          <div>
            <p className="text-[10px] font-normal text-[#68758A] mb-1.5">Metode Pembayaran</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'cash', label: 'Tunai', icon: Banknote, tersedia: tokoPay?.tunai_aktif !== false },
                  { id: 'qris', label: 'QRIS', icon: QrCode, tersedia: !!(tokoPay?.qris_aktif && tokoPay?.qris_status === 'valid') },
                ]
              ).map(m => {
                const isSel = metodeBayar === m.id && m.tersedia;
                return (
                  <button
                    key={m.id}
                    onClick={() => m.tersedia && setMetodeBayar(m.id)}
                    disabled={!m.tersedia}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 py-2 rounded-xl border text-[10px] font-medium transition-all',
                      isSel
                        ? 'border-[#0CAF60] bg-[#E8FAF0] text-[#087A4B]'
                        : m.tersedia
                          ? 'border-gray-100 bg-white text-[#68758A] hover:border-gray-200'
                          : 'border-dashed border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed opacity-70'
                    )}
                    title={m.tersedia ? '' : 'Metode belum diaktifkan di Pengaturan Pembayaran'}
                  >
                    <m.icon className="w-4 h-4" />
                    {m.label}{!m.tersedia && <span className="text-[7px]">(off)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={openPayment}
            disabled={cart.length === 0}
            className="w-full py-3 bg-[#0CAF60] text-white rounded-xl text-[13px] font-medium shadow-sm hover:bg-[#087A4B] active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400"
          >
            Bayar Sekarang
          </button>
        </div>
        </>)}
      </div>

      {/* ── History Transaksi Terbaru ── */}
      <RiwayatSheet
        riwayat={riwayat}
        riwayatFilter={riwayatFilter}
        riwayatPendingTotal={riwayatPendingTotal}
        isRiwayatLoading={isRiwayatLoading}
        riwayatPage={riwayatPage}
        riwayatPages={riwayatPages}
        switchRiwayatFilter={switchRiwayatFilter}
        reloadRiwayatPage={reloadRiwayatPage}
        openStrukRiwayat={openStrukRiwayat}
      />

      </div>{/* ── tutup kolom kanan ── */}

      </div>{/* ── tutup grid 2 kolom ── */}

      {/* ═════ MODALS ═════ */}

      {/* SCREEN 2: FULL-SCREEN CAMERA AI & BARCODE SCANNER OVERLAY */}
      {(showAiScan || showBarcodeScan) && (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between overflow-hidden animate-fade-in select-none">
          {/* 1. Live HTML5 Camera Video Background (Full Screen) */}
          <div className="absolute inset-0 z-0 bg-gray-950 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-105"
            />
            {/* Gradient Overlay for Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />
          </div>

          {/* 2. Top Bar: Close Button + Mode Switcher Pill */}
          <div className="relative z-20 flex items-center justify-between p-4 pt-6">
            {/* Close Button */}
            <button
              onClick={() => { setShowAiScan(false); setShowBarcodeScan(false); }}
              className="p-2.5 bg-black/40 backdrop-blur rounded-full text-white hover:bg-black/60 transition-all border border-white/10 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mode Switcher Capsule Pill */}
            <div className="bg-black/50 backdrop-blur border border-white/15 p-1 rounded-full flex items-center gap-1 shadow-lg">
              <button
                onClick={() => { setShowBarcodeScan(false); setShowAiScan(true); handleOpenAiScan(); }}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5',
                  showAiScan
                    ? 'bg-[#0CAF60] text-white shadow-sm'
                    : 'text-gray-300 hover:text-white'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Mode
              </button>
              <button
                onClick={() => { setShowAiScan(false); setShowBarcodeScan(true); }}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5',
                  showBarcodeScan
                    ? 'bg-[#0CAF60] text-white shadow-sm'
                    : 'text-gray-300 hover:text-white'
                )}
              >
                <ScanBarcode className="w-3.5 h-3.5" />
                Barcode Mode
              </button>
              <button
                onClick={() => { setShowAiScan(false); setShowBarcodeScan(false); setView('home'); setAiCandidates([]); }}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
                title="Beralih ke Input Manual POS"
              >
                <PenLine className="w-3.5 h-3.5" />
                Manual
              </button>
            </div>

            {/* Live Clock / Status */}
            <span className="text-xs text-white/80 font-medium tracking-wide">
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* 3. Center Camera Bounding Frame */}
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-4">
            {/* Floating Detection Status Pill */}
            <div className="mb-4 px-4 py-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-full text-white text-xs font-semibold flex items-center gap-2 shadow-md">
              <span className={cn('w-2 h-2 rounded-full animate-ping', showBarcodeScan ? 'bg-red-400' : isModelLoading ? 'bg-amber-400' : modelError || !tfModel ? 'bg-rose-400' : 'bg-emerald-400')} />
              <span>
                {showBarcodeScan
                  ? 'Mendeteksi barcode...'
                  : isModelLoading
                  ? 'Mengunduh & Memuat Model AI...'
                  : modelError || !tfModel
                  ? 'Gagal Memuat Model AI'
                  : detectedProduk
                  ? `Sukses! ${detectedProduk.nama} Terdeteksi`
                  : 'Memindai AI Real-Time (Otomatis)...'}
              </span>
            </div>

            {/* Bounding Box Frame */}
            <div className="w-full max-w-xs aspect-square relative rounded-3xl overflow-hidden flex items-center justify-center">
              {/* Corner brackets */}
              <div className={cn('absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 rounded-tl-2xl', showBarcodeScan ? 'border-red-500' : 'border-emerald-400')} />
              <div className={cn('absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 rounded-tr-2xl', showBarcodeScan ? 'border-red-500' : 'border-emerald-400')} />
              <div className={cn('absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 rounded-bl-2xl', showBarcodeScan ? 'border-red-500' : 'border-emerald-400')} />
              <div className={cn('absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 rounded-br-2xl', showBarcodeScan ? 'border-red-500' : 'border-emerald-400')} />

              {/* Barcode Laser Beam */}
              {showBarcodeScan && (
                <div className="absolute left-4 right-4 h-0.5 bg-red-500 shadow-lg shadow-red-500/80 animate-pulse top-1/2 -translate-y-1/2" />
              )}

              {/* AI Model Loading & Error States */}
              {showAiScan && !tfModel && (
                isModelLoading ? (
                  <div className="bg-black/80 backdrop-blur px-5 py-4 rounded-2xl border border-white/10 text-center animate-fade-in max-w-[240px]">
                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-emerald-300 font-bold">Memuat Model AI...</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Menyiapkan cache IndexedDB browser</p>
                  </div>
                ) : (
                  <div className="bg-black/85 backdrop-blur p-4 rounded-2xl border border-rose-500/30 text-center animate-fade-in max-w-[260px] space-y-2.5">
                    <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                      <X className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rose-300">Gagal Memuat Model AI</p>
                      <p className="text-[10px] text-gray-300 leading-tight mt-0.5 max-h-12 overflow-y-auto">
                        {modelError || 'Tidak dapat terhubung ke server model.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        onClick={() => fetchActiveModel()}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-[11px] font-bold rounded-xl transition-colors shadow-sm"
                      >
                        Coba Lagi
                      </button>
                      <button
                        onClick={() => { setShowAiScan(false); setShowBarcodeScan(true); }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold rounded-xl border border-white/10 transition-colors"
                      >
                        Mode Barcode
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* AI Manual Processing Spinner */}
              {showAiScan && tfModel && isDetecting && (
                <div className="bg-black/60 backdrop-blur px-5 py-3.5 rounded-2xl border border-white/10 text-center">
                  <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-emerald-300 font-bold">Pemindaian AI...</p>
                </div>
              )}
            </div>

            {/* Detected Result Status Pill directly under bounding box */}
            {showAiScan && detectedProduk && !isDetecting && (
              <div className="mt-3 px-4 py-2 bg-black/75 backdrop-blur border border-emerald-500/30 rounded-2xl text-white text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Produk terdeteksi! <span className="text-emerald-400 font-bold">Confidence {detectedProduk.confidence}%</span></span>
              </div>
            )}

            {/* Scanned Barcode Result Pill */}
            {showBarcodeScan && scannedBarcodeCode && !barcodeNotFound && (
              <div className="mt-3 px-4 py-2 bg-black/75 backdrop-blur border border-emerald-500/30 rounded-2xl text-white text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Barcode: <span className="font-mono text-emerald-400 font-bold">{scannedBarcodeCode}</span></span>
              </div>
            )}

            {/* Barcode Not Found Feedback */}
            {showBarcodeScan && barcodeNotFound && (
              <div className="mt-3 px-4 py-2 bg-black/75 backdrop-blur border border-rose-500/40 rounded-2xl text-white text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Produk tidak ditemukan untuk kode <span className="font-mono text-rose-400 font-bold">{scannedBarcodeCode}</span></span>
              </div>
            )}

            {/* Manual Barcode Input Fallback (browser tanpa BarcodeDetector / produk tak ketemu) */}
            {showBarcodeScan && (
              <form
                onSubmit={handleManualBarcodeSubmit}
                className="mt-3 flex items-center gap-2 max-w-xs mx-auto"
              >
                <input
                  value={manualBarcode}
                  onChange={(e) => { setManualBarcode(e.target.value); setBarcodeNotFound(false); }}
                  placeholder="Ketik kode barcode…"
                  inputMode="numeric"
                  className="flex-1 min-w-0 px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-emerald-400/60"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-400/30 transition-colors"
                >
                  Tambah
                </button>
              </form>
            )}

            {/* Demo Barcode Simulation Buttons — DIHAPUS (test-only) */}
          </div>

          {/* 4. Top 3 Predictions Candidate Banner (KHUSUS AI MODE ONLY) */}
          {showAiScan && aiCandidates.length > 0 && (
            <div className="relative z-30 mx-4 mb-2 bg-black/80 backdrop-blur border border-white/15 rounded-2xl p-2.5 shadow-2xl animate-slide-up max-w-md mx-auto">
              <div className="flex items-center justify-between px-1 mb-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold truncate">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  <span className="truncate">Confidence rendah ({aiCandidates[0]?.match || 62}%). Pilih produk yang sesuai.</span>
                </div>
                <button onClick={() => setAiCandidates([])} className="text-gray-500 hover:text-white shrink-0 text-[10px] font-medium flex items-center gap-1 ml-2">
                  Top 3 prediksi <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white">
                {aiCandidates.slice(0, 3).map((cand, idx) => (
                  <React.Fragment key={`cand-${idx}-${cand.nama}`}>
                    {idx > 0 && <span className="text-gray-600 font-light mx-1">|</span>}
                    <button
                      onClick={() => handleSelectCandidate(cand)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-1 py-1 hover:bg-white/10 rounded-lg transition-colors min-w-0"
                    >
                      <span className="font-bold text-gray-500 text-[11px]">{idx + 1}</span>
                      <span className="font-semibold text-[11px] truncate">{cand.nama}</span>
                      <span className="font-bold text-[#15803D] text-[10px] shrink-0">{cand.match}%</span>
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* 5. Floating Live Cart Drawer (Floating Card matching user mockup) */}
          {cart.length > 0 && (
            <div className="relative z-30 mx-4 mb-4 bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-white/20 max-w-sm w-full mx-auto animate-slide-up">
              {/* Drawer Header Row */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2.5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#16A34A]" />
                  <h4 className="font-semibold text-sm text-gray-900">Keranjang ({cartCount})</h4>
                </div>
                <button
                  onClick={() => setShowPayment(true)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
                >
                  Subtotal <span className="font-semibold text-gray-900 text-sm ml-0.5">Rp {subtotal?.toLocaleString('id-ID')}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Scrollable Item List (Vertical Stack) */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 hide-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-2.5 transition-colors border border-emerald-100/50">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#15803D] font-semibold text-[11px] flex items-center justify-center shrink-0 border border-emerald-200">
                        {item.nama?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-gray-900 truncate" title={item.nama}>{item.nama}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{item.qty} x Rp {item.harga?.toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <p className="font-semibold text-xs text-gray-900">Rp {(item.harga * item.qty).toLocaleString('id-ID')}</p>
                      
                      {/* Stepper Controls: Minus (-), Qty Count, Plus (+) */}
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-0.5 shadow-sm">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Kurangi Qty"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs text-gray-900 px-0.5 min-w-[14px] text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="Tambah Qty"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Delete Item Button */}
                      <button
                        onClick={() => updateQty(item.id, -item.qty)}
                        className="p-1 text-gray-500 hover:text-rose-500 transition-colors"
                        title="Hapus barang"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* SCREEN 3: AI CANDIDATES BOTTOM SHEET */}
      {showAiCandidates && (
        <>
          <div onClick={() => setShowAiCandidates(false)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 p-5 pb-24 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-gray-900">Pilih Produk</h2>
              <button onClick={() => setShowAiCandidates(false)} className="p-1"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Kami menemukan beberapa pilihan produk yang mirip</p>

            <div className="space-y-3">
              {aiCandidates.map((cand, i) => (
                <button
                  key={cand.id || `cand-${i}`}
                  onClick={() => handleSelectCandidate(cand)}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl hover:border-[#16A34A] transition-all active:scale-[0.98]"
                >
                  <ProdukThumb nama={cand.nama} img={cand.foto_url} className="w-14 h-14 rounded-xl shrink-0 text-sm" />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        cand.match >= 90 ? 'bg-emerald-100 text-[#15803D]'
                          : cand.match >= 70 ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {cand.match}% Match
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mt-1">{cand.nama}</h4>
                    <p className="text-sm font-bold text-[#16A34A]">{formatRupiah(cand.harga)}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-2.5 text-center tracking-wider">Produk yang dicari tidak ada?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAiCandidates(false);
                    setShowBarcodeScan(true);
                  }}
                  className="flex-1 py-3 bg-[#16A34A] hover:bg-[#15803D] text-xs font-bold text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ScanBarcode className="w-4 h-4" />
                  <span>Scan Barcode</span>
                </button>
                <button
                  onClick={() => {
                    setShowAiCandidates(false);
                    // Simply focus the search field on main screen
                    const searchInput = document.querySelector('input[placeholder*="Cari produk"]');
                    if (searchInput) searchInput.focus();
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <PenLine className="w-4 h-4 text-gray-500" />
                  <span>Cari Manual</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <CustomerSheet
        open={showCustomerSelect}
        pelangganList={pelangganList}
        selectedCustomer={selectedCustomer}
        onSelect={(c) => { setSelectedCustomer(c); setShowCustomerSelect(false); }}
        onClose={() => setShowCustomerSelect(false)}
      />
      <PaymentSheet
        open={showPay}
        isDesktop={isDesktop}
        subtotal={subtotal}
        diskon={diskon}
        total={total}
        metodeTersedia={metodeTersedia}
        metodeBayar={metodeBayar}
        onSetMetode={setMetodeBayar}
        uangDiterima={uangDiterima}
        onSetUang={setUangDiterima}
        uangNum={uangNum}
        kembalian={kembalian}
        payError={payError}
        isPaying={isPaying}
        onBayar={() => { setPayError(null); handleBayar(); }}
        onClose={() => setShowPay(false)}
      />
      <QrisPendingPanel
        open={showQrisPending}
        tx={qrisPendingTx}
        merchantNama={tokoPay?.qris_info?.merchant_name || toko?.nama || 'Tokiva'}
        qrSrc={qrisImageSrc}
        qrisImageError={qrisImageError}
        showQrisImageModal={showQrisImageModal}
        onOpenQrisImage={() => setShowQrisImageModal(true)}
        onCloseQrisImage={() => setShowQrisImageModal(false)}
        showQrisCancelModal={showQrisCancelModal}
        qrisActionLoading={qrisActionLoading}
        qrisCancelReason={qrisCancelReason}
        onSetQrisCancelReason={(v) => { setQrisCancelReason(v); setQrisCancelError(''); }}
        qrisCancelError={qrisCancelError}
        onOpenCancelModal={() => { setQrisCancelError(''); setQrisCancelReason(''); setShowQrisCancelModal(true); }}
        onCloseCancelModal={() => setShowQrisCancelModal(false)}
        onApprove={handleApproveQris}
        onCancel={handleCancelQris}
        onBackHome={handleNewTransaction}
      />
      <ReceiptModal
        open={showReceipt}
        tx={completedTx}
        subtotal={subtotal}
        diskon={diskon}
        metodeLabel={{ cash: 'Tunai', qris: 'QRIS' }[completedTx?.metode_bayar] || 'Tunai'}
        onShare={shareStruk}
        onNewTransaction={handleNewTransaction}
      />

    </div>
  );
}