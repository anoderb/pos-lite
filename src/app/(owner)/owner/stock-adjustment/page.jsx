'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PackagePlus,
  Plus,
  Minus,
  Search,
  Package,
  History,
  FileSpreadsheet,
  ScanBarcode,
  ChevronRight,
  X,
  Camera,
  SlidersHorizontal,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import Skeleton from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/ToastProvider';
import { useAuthStore } from '@/store/authStore';

function ProdukThumb({ nama, img, className = '' }) {
  const [err, setErr] = useState(false);
  const fallback = (nama || '?').slice(0, 2).toUpperCase();
  if (img && !err) {
    return <img src={img} alt={nama} onError={() => setErr(true)} className={`${className} object-cover bg-gray-50`} />;
  }
  return (
    <div className={`${className} bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center font-medium`}>
      {fallback}
    </div>
  );
}

const SATUAN_GROSIR_OPTIONS = [
  { value: 'Dus', label: 'Dus / Karton' },
  { value: 'Slop', label: 'Slop / Press' },
  { value: 'Bal', label: 'Bal / Karung Plastik' },
  { value: 'Renceng', label: 'Renceng / Gantung' },
  { value: 'Karung', label: 'Karung 25kg/50kg' },
  { value: 'Pak', label: 'Pak / Box Kecil' },
];

export default function OwnerStockAdjustmentPage() {
  const { user } = useAuthStore();
  const [logList, setLogList] = useState([]);
  const [produkList, setProdukList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipe, setFilterTipe] = useState('semua'); // semua | tambah | kurang
  const [filterOpen, setFilterOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const videoRef = useRef(null);

  const showFeedback = (type, title, message) => toast[type](message, { title });

  const [formData, setFormData] = useState({
    produkNama: '',
    tipe: 'tambah',
    unitMode: 'grosir',
    satuanGrosir: 'Dus',
    jumlahKemasan: 0,
    isiPerKemasan: 40,
    jumlahPcs: 0,
    alasan: '',
  });
  const [produkQuery, setProdukQuery] = useState('');
  const [produkFocused, setProdukFocused] = useState(false);

  const produkSuggestions = produkList.filter(p =>
    p.nama?.toLowerCase().includes((produkQuery || '').toLowerCase())
  ).slice(0, 8);

  const fetchData = () => {
    setIsLoading(true);
    Promise.all([
      api.get('/owner/produk').catch(() => null),
      api.get('/owner/stock-adjustment').catch(() => null),
    ]).then(([produkRes, logRes]) => {
      const produkData = produkRes?.berhasil ? produkRes.data : (Array.isArray(produkRes?.data) ? produkRes.data : []);
      if (Array.isArray(produkData)) setProdukList(produkData);
      const logData = logRes?.berhasil ? logRes.data : (Array.isArray(logRes?.data) ? logRes.data : []);
      if (Array.isArray(logData)) setLogList(logData);
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // Sembunyikan bottom nav saat form/scan terbuka
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const open = isFormOpen || showScan;
    window.dispatchEvent(new CustomEvent(open ? 'owner-nav-hide' : 'owner-nav-show'));
    return () => window.dispatchEvent(new CustomEvent('owner-nav-show'));
  }, [isFormOpen, showScan]);

  // Barcode scan sederhana (BarcodeDetector, fallback manual)
  useEffect(() => {
    if (!showScan) return;
    let stream;
    let timer;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        timer = setInterval(async () => {
          if (typeof window !== 'undefined' && 'BarcodeDetector' in window && videoRef.current && videoRef.current.readyState === 4) {
            try {
              const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'] });
              const results = await detector.detect(videoRef.current);
              if (results.length > 0) {
                const code = results[0].rawValue;
                setSearch(code);
                setShowScan(false);
              }
            } catch { /* lanjut */ }
          }
        }, 500);
      } catch {
        showFeedback('info', 'Kamera Tidak Tersedia', 'Kamera tidak dapat diakses. Ketik barcode secara manual di kolom pencarian.');
        setShowScan(false);
      }
    })();
    return () => {
      if (timer) clearInterval(timer);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [showScan]);

  const totalCalculatedPcs = formData.unitMode === 'grosir'
    ? (Number(formData.jumlahKemasan) || 0) * (Number(formData.isiPerKemasan) || 1)
    : Number(formData.jumlahPcs) || 0;

  const handleSave = async (e) => {
    e.preventDefault();
    const descInfo = formData.unitMode === 'grosir'
      ? `${formData.alasan} (${formData.jumlahKemasan} ${formData.satuanGrosir} @${formData.isiPerKemasan} pcs)`
      : formData.alasan;

    try {
      const selectedProduk = produkList.find(p => p.nama?.toLowerCase() === formData.produkNama?.toLowerCase());
      if (!selectedProduk) return showFeedback('info', 'Perhatian', 'Produk tidak ditemukan. Pilih dari daftar.');

      if (formData.tipe === 'kurang' && totalCalculatedPcs > Number(selectedProduk.stok || 0)) {
        return showFeedback('info', 'Stok Tidak Mencukupi', `Stok ${selectedProduk.nama} tersedia ${selectedProduk.stok}, tapi diminta kurangi ${totalCalculatedPcs}.`);
      }

      await api.post('/owner/stock-adjustment', {
        produk_id: selectedProduk.id,
        tipe: formData.tipe,
        qty: totalCalculatedPcs,
        alasan: descInfo,
      });

      setIsFormOpen(false);
      showFeedback('success', 'Berhasil!', `Stok ${selectedProduk.nama} berhasil ${formData.tipe === 'tambah' ? 'ditambah' : 'dikurangi'} ${totalCalculatedPcs} pcs.`);
      fetchData();
      setFormData({ produkNama: '', tipe: 'tambah', unitMode: 'grosir', satuanGrosir: 'Dus', jumlahKemasan: 0, isiPerKemasan: 40, jumlahPcs: 0, alasan: '' });
    } catch (err) {
      showFeedback('error', 'Gagal', err?.response?.data?.pesan || err?.message || 'Terjadi kesalahan');
    }
  };

  const filteredLogs = logList.filter(l => {
    const teks = `${l.produk?.nama || ''} ${l.alasan || ''} ${l.pembuat?.nama || ''}`.toLowerCase();
    const matchSearch = !search || teks.includes(search.toLowerCase());
    const matchTipe = filterTipe === 'semua' || l.tipe === filterTipe;
    return matchSearch && matchTipe;
  });

  const openForm = (tipe, log = null) => {
    if (log) {
      setFormData({
        produkNama: log.produk?.nama || '',
        tipe: log.tipe || 'tambah',
        unitMode: 'pcs',
        satuanGrosir: 'Dus',
        jumlahKemasan: 0,
        isiPerKemasan: 40,
        jumlahPcs: Math.abs(log.qty || 0),
        alasan: log.alasan || '',
      });
      setProdukQuery(log.produk?.nama || '');
    } else {
      setFormData(prev => ({ ...prev, tipe }));
      setProdukQuery('');
    }
    setIsFormOpen(true);
  };

  const produkFoto = (log) => {
    const p = produkList.find(x => x.id === log.produk_id);
    return p?.foto_url || null;
  };

  const riwayatRef = useRef(null);
  const scrollToRiwayat = () => riwayatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="max-w-[430px] lg:max-w-none mx-auto space-y-4 lg:space-y-5 pb-24 lg:pb-8 text-[#10233E]">
      {/* Breadcrumb + Banner */}
      <div className="relative overflow-hidden rounded-[20px] lg:rounded-[22px] p-4 lg:p-6 bg-gradient-to-br from-[#E8FAF0] via-white to-[#FFF8D9] shadow-[0_2px_10px_rgba(16,35,62,.05)]">
        <div className="relative z-10 max-w-[60%] lg:max-w-[58%]">
          <p className="text-[10px] font-normal text-[#68758A]">Dashboard &gt; Tambah / Adjust Stok</p>
          <h1 className="text-base lg:text-xl font-semibold leading-6 lg:leading-7 mt-1">Tambah / Adjust Stok</h1>
          <p className="text-[10px] lg:text-xs font-normal text-[#68758A] leading-4 mt-1">Kelola stok barang dengan mudah. Tambah, kurang, dan catat riwayat secara manual.</p>
        </div>
        <img src="/assets/tokiva-dashboard/img-stock-3d.png" alt="Stok 3D" className="absolute right-1 bottom-0 w-[44%] lg:w-[28%] h-[96%] object-contain object-right-bottom" />
      </div>

      {/* Action Bar Hijau */}
      <div className="rounded-[18px] bg-[#0CAF60] p-2.5 flex items-center gap-2 shadow-sm lg:max-w-2xl">
        <button
          onClick={() => openForm('tambah')}
          className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-white/95 hover:bg-white active:scale-[0.98] transition-all"
        >
          <span className="w-9 h-9 rounded-lg bg-[#0CAF60] text-white flex items-center justify-center shrink-0"><Plus className="w-4 h-4" /></span>
          <span className="text-left">
            <span className="block text-[11px] font-medium text-[#10233E]">Tambah Stok</span>
            <span className="block text-[9px] font-normal text-[#68758A]">Menambah jumlah stok barang</span>
          </span>
        </button>
        <div className="w-px h-10 bg-white/30" />
        <button
          onClick={() => openForm('kurang')}
          className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-white/95 hover:bg-white active:scale-[0.98] transition-all"
        >
          <span className="w-9 h-9 rounded-lg bg-[#D94850] text-white flex items-center justify-center shrink-0"><Minus className="w-4 h-4" /></span>
          <span className="text-left">
            <span className="block text-[11px] font-medium text-[#10233E]">Kurangi Stok</span>
            <span className="block text-[9px] font-normal text-[#68758A]">Mengurangi jumlah stok barang</span>
          </span>
        </button>
        <button
          onClick={() => openForm('tambah')}
          aria-label="Buka form penyesuaian"
          className="w-9 h-9 rounded-full bg-white text-[#0CAF60] flex items-center justify-center shrink-0 active:scale-95 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Kartu Fitur */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
        <button onClick={() => openForm('tambah')} className="p-3 rounded-[16px] bg-white shadow-sm border border-gray-50 text-left hover:bg-gray-50 active:scale-[0.98] transition-all">
          <span className="w-8 h-8 rounded-lg bg-[#EAF3FF] text-blue-600 flex items-center justify-center"><ClipboardList className="w-4 h-4" /></span>
          <p className="text-[11px] font-medium text-[#10233E] mt-2">Penyesuaian Stok</p>
          <p className="text-[9px] font-normal text-[#68758A]">Set stok aktual</p>
        </button>
        <button onClick={scrollToRiwayat} className="p-3 rounded-[16px] bg-white shadow-sm border border-gray-50 text-left hover:bg-gray-50 active:scale-[0.98] transition-all">
          <span className="w-8 h-8 rounded-lg bg-[#F3EEFF] text-violet-600 flex items-center justify-center"><History className="w-4 h-4" /></span>
          <p className="text-[11px] font-medium text-[#10233E] mt-2">Riwayat Penyesuaian</p>
          <p className="text-[9px] font-normal text-[#68758A]">Lihat semua log</p>
        </button>
        <button onClick={() => showFeedback('info', 'Segera Hadir', 'Import stok dari Excel akan segera hadir.')} className="p-3 rounded-[16px] bg-white shadow-sm border border-gray-50 text-left hover:bg-gray-50 active:scale-[0.98] transition-all">
          <span className="w-8 h-8 rounded-lg bg-[#FFF8D9] text-amber-600 flex items-center justify-center"><FileSpreadsheet className="w-4 h-4" /></span>
          <p className="text-[11px] font-medium text-[#10233E] mt-2">Import Stok (Excel)</p>
          <p className="text-[9px] font-normal text-[#68758A]">Unggah data</p>
        </button>
        <button onClick={() => setShowScan(true)} className="p-3 rounded-[16px] bg-white shadow-sm border border-gray-50 text-left hover:bg-gray-50 active:scale-[0.98] transition-all">
          <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><ScanBarcode className="w-4 h-4" /></span>
          <p className="text-[11px] font-medium text-[#10233E] mt-2">Scan Barcode Produk</p>
          <p className="text-[9px] font-normal text-[#68758A]">Pilih produk cepat</p>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68758A]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk, alasan, atau pengguna..."
            className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] outline-none border border-gray-50 shadow-sm focus:border-[#0CAF60]"
          />
        </div>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={cn(
            'relative px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all',
            filterTipe !== 'semua' ? 'bg-[#0CAF60] text-white' : 'bg-white border border-gray-100 text-[#68758A] hover:bg-gray-50'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>
      </div>
      {filterOpen && (
        <div className="flex gap-1.5 -mt-1">
          {[['semua', 'Semua'], ['tambah', 'Tambah'], ['kurang', 'Kurang']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setFilterTipe(id); setFilterOpen(false); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                filterTipe === id ? 'bg-[#0CAF60] text-white' : 'bg-white text-[#68758A] shadow-sm hover:bg-[#E8FAF0]'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Riwayat */}
      <div ref={riwayatRef}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium leading-5">Riwayat Penyesuaian Terbaru</h2>
          {!isLoading && <span className="text-[10px] font-medium text-[#0CAF60]">{filteredLogs.length} log</span>}
        </div>
        {isLoading ? (
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-x-3 lg:gap-y-2 lg:space-y-0">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-[16px] p-3 shadow-sm border border-gray-50">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-2 w-24" />
                </div>
                <Skeleton className="h-3 w-12 shrink-0" />
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-gray-50 p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-[#E8FAF0] rounded-full flex items-center justify-center mx-auto mb-2 text-[#0CAF60]"><Package className="w-6 h-6" /></div>
            <p className="text-[13px] font-medium text-[#10233E]">Belum ada riwayat</p>
            <p className="text-[10px] font-normal text-[#68758A] mt-0.5">Penyesuaian stok yang Anda lakukan akan tampil di sini.</p>
          </div>
        ) : (
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-x-3 lg:gap-y-2 lg:space-y-0">
            {filteredLogs.slice(0, 15).map((log, idx) => {
              const tambah = log.tipe === 'tambah';
              return (
                <button
                  key={log.id || `log-${idx}`}
                  onClick={() => openForm(log.tipe, log)}
                  className="w-full flex items-center gap-3 bg-white rounded-[16px] p-3 shadow-sm border border-gray-50 text-left hover:border-[#0CAF60] transition-all"
                >
                  <ProdukThumb nama={log.produk?.nama || '?'} img={produkFoto(log)} className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#10233E] truncate">{log.produk?.nama || 'Produk'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded-full', tambah ? 'bg-[#E8FAF0] text-[#087A4B]' : 'bg-[#FFF0F0] text-[#D94850]')}>
                        {tambah ? 'Tambah' : 'Kurang'} · {log.alasan || 'Penyesuaian'}
                      </span>
                    </div>
                    <p className="text-[9px] font-normal text-[#68758A] mt-1">
                      {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {log.pembuat?.nama || '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-xs font-medium', tambah ? 'text-[#0CAF60]' : 'text-[#D94850]')}>
                      {tambah ? '+' : '-'}{log.qty} pcs
                    </p>
                    <ChevronRight className="w-4 h-4 text-[#68758A] ml-auto mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-over Form */}
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isFormOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
      </div>
      <div className={cn(
        'fixed z-40 bg-white shadow-2xl flex flex-col inset-x-0 bottom-0 max-h-[92vh] rounded-t-[24px] lg:rounded-none lg:rounded-l-[28px] lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:max-h-none lg:w-[480px] transition-transform duration-300 ease-out',
        isFormOpen
          ? 'translate-y-0 lg:translate-y-0 lg:translate-x-0'
          : 'translate-y-full pointer-events-none lg:translate-y-0 lg:translate-x-full'
      )}>
        <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mt-2.5 shrink-0 lg:hidden" />
        <div className="flex items-center justify-between px-4 lg:px-5 pt-2 pb-3 border-b border-gray-50 shrink-0">
          <div>
            <h2 className="text-[15px] lg:text-lg font-semibold leading-5 text-[#10233E]">{formData.tipe === 'tambah' ? 'Tambah Stok' : 'Kurangi Stok'}</h2>
            <p className="text-[10px] lg:text-xs font-normal text-[#68758A]">Catat penyesuaian stok manual</p>
          </div>
          <button onClick={() => setIsFormOpen(false)} className="p-2 -mr-1 text-[#68758A] hover:bg-gray-100 rounded-xl active:scale-95 transition-all"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto hide-scrollbar px-4 lg:px-5 py-3 lg:py-4 space-y-3">
          {/* Pilih Produk (searchable combobox) */}
          <div className="space-y-1 relative">
            <label className="text-[11px] font-medium text-[#10233E]">Pilih Produk</label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68758A]" />
                <input
                  type="text"
                  value={produkQuery}
                  onChange={e => { setProdukQuery(e.target.value); setFormData({ ...formData, produkNama: e.target.value }); }}
                  onFocus={() => setProdukFocused(true)}
                  onBlur={() => setTimeout(() => setProdukFocused(false), 150)}
                  placeholder="Ketik nama produk..."
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] outline-none focus:border-[#0CAF60]"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowScan(true)}
                aria-label="Scan barcode"
                className="w-10 shrink-0 rounded-xl border border-gray-200 bg-white text-[#68758A] hover:text-[#0CAF60] hover:border-[#0CAF60] flex items-center justify-center active:scale-95 transition-all"
              >
                <ScanBarcode className="w-4 h-4" />
              </button>
            </div>
              {produkFocused && produkQuery && produkSuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden max-h-44 overflow-y-auto hide-scrollbar">
                  {produkSuggestions.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setProdukQuery(p.nama); setFormData({ ...formData, produkNama: p.nama }); setProdukFocused(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#E8FAF0] transition-colors"
                    >
                      <span className="text-xs font-normal text-[#10233E] truncate">{p.nama}</span>
                      <span className={cn('text-[9px] font-medium shrink-0 ml-2', Number(p.stok) > 0 ? 'text-[#087A4B]' : 'text-[#D94850]')}>
                        stok {p.stok}
                      </span>
                    </button>
                  ))}
                </div>
              )}
          </div>

          {/* Tipe Toggle */}
          <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
            {['tambah', 'kurang'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData({ ...formData, tipe: t })}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-xs font-medium transition-all',
                  formData.tipe === t ? (t === 'tambah' ? 'bg-[#0CAF60] text-white shadow-sm' : 'bg-[#D94850] text-white shadow-sm') : 'text-[#68758A]'
                )}
              >
                {t === 'tambah' ? '+ Tambah' : '− Kurang'}
              </button>
            ))}
          </div>

          {/* Unit Mode */}
          <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
            {[['grosir', 'Grosir (Dus/Slop)'], ['pcs', 'Satuan (Pcs)']].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFormData({ ...formData, unitMode: id })}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-[11px] font-medium transition-all',
                  formData.unitMode === id ? 'bg-white text-[#10233E] shadow-sm' : 'text-[#68758A]'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {formData.unitMode === 'grosir' ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#10233E]">Jumlah Kemasan</label>
                <input type="number" min="0" value={formData.jumlahKemasan} onChange={e => setFormData({ ...formData, jumlahKemasan: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#0CAF60]" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#10233E]">Satuan Grosir</label>
                <select value={formData.satuanGrosir} onChange={e => setFormData({ ...formData, satuanGrosir: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#0CAF60]">
                  {SATUAN_GROSIR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[11px] font-medium text-[#10233E]">Isi per Kemasan (pcs)</label>
                <input type="number" min="1" value={formData.isiPerKemasan} onChange={e => setFormData({ ...formData, isiPerKemasan: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#0CAF60]" />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#10233E]">Jumlah (pcs)</label>
              <input type="number" min="0" value={formData.jumlahPcs} onChange={e => setFormData({ ...formData, jumlahPcs: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#0CAF60]" />
            </div>
          )}

          {/* Alasan */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[#10233E]">Alasan Penyesuaian</label>
            <select value={formData.alasan} onChange={e => setFormData({ ...formData, alasan: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#0CAF60]">
              <option value="">— Pilih alasan —</option>
              <option value="Pembelian stok baru">Pembelian stok baru</option>
              <option value="Retur dari pelanggan">Retur dari pelanggan</option>
              <option value="Produk rusak / kadaluarsa">Produk rusak / kadaluarsa</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Preview total pcs */}
          <div className="p-3 rounded-xl bg-[#E8FAF0] border border-emerald-100 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#10233E]">Total Penyesuaian</span>
            <span className={cn('text-sm font-semibold', formData.tipe === 'tambah' ? 'text-[#0CAF60]' : 'text-[#D94850]')}>
              {formData.tipe === 'tambah' ? '+' : '-'}{totalCalculatedPcs} pcs
            </span>
          </div>

          <button
            type="submit"
            className={cn(
              'w-full py-3 rounded-xl text-[13px] font-medium text-white shadow-sm active:scale-[0.98] transition-all',
              formData.tipe === 'tambah' ? 'bg-[#0CAF60] hover:bg-[#087A4B]' : 'bg-[#D94850] hover:bg-[#b93a41]'
            )}
          >
            {formData.tipe === 'tambah' ? 'Simpan Tambah Stok' : 'Simpan Kurangi Stok'}
          </button>
        </form>
      </div>

      {/* Scan Barcode Overlay */}
      {showScan && (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between overflow-hidden animate-fade-in select-none">
          <div className="absolute inset-0 z-0 bg-gray-950 overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-105" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />
          </div>
          <div className="relative z-20 flex items-center justify-between p-4 pt-6">
            <button onClick={() => setShowScan(false)} className="p-2.5 bg-black/40 backdrop-blur rounded-full text-white hover:bg-black/60 transition-all active:scale-95"><X className="w-5 h-5" /></button>
            <span className="text-xs text-white/80 font-medium">Scan Barcode Produk</span>
            <span className="text-xs text-white/80 font-medium">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-4">
            <div className="mb-4 px-4 py-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-full text-white text-xs flex items-center gap-2">
              <ScanBarcode className="w-4 h-4 text-[#0CAF60]" />
              Arahkan kamera ke barcode produk...
            </div>
            <div className="w-full max-w-xs aspect-square relative rounded-3xl overflow-hidden flex items-center justify-center">
              <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-[#0CAF60] rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-[#0CAF60] rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-[#0CAF60] rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-[#0CAF60] rounded-br-2xl" />
              <div className="absolute left-4 right-4 h-0.5 bg-[#0CAF60] shadow-lg shadow-emerald-500/80 animate-pulse top-1/2 -translate-y-1/2" />
            </div>
            {search && (
              <p className="mt-4 px-4 py-2 bg-[#E8FAF0] text-[#087A4B] rounded-xl text-xs font-mono">Hasil: {search}</p>
            )}
          </div>
          <div className="relative z-20 pb-8 pt-2 px-4 flex justify-center">
            <button onClick={() => setShowScan(false)} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-medium border border-white/20 backdrop-blur transition-all">
              Batal / Tutup Kamera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
