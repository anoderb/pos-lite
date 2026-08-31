'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Camera,
  ScanBarcode,
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Download,
  SlidersHorizontal,
  LayoutGrid,
  Tags,
  Bell,
  Save,
  Lightbulb,
} from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { toast } from '@/components/ui/ToastProvider';
import { api } from '@/lib/api';
import ProdukThumb from '@/components/ui/ProdukThumb';

const SATUAN_ECERAN_OPTIONS = [
  { value: 'pcs', label: 'pcs (Pcs / Biji)' },
  { value: 'botol', label: 'botol (Botol)' },
  { value: 'pouch', label: 'pouch (Pouch / Reffil)' },
  { value: 'saset', label: 'saset (Saset)' },
  { value: 'bungkus', label: 'bungkus (Bungkus / Pack)' },
  { value: 'kg', label: 'kg (Kilogram)' },
  { value: 'gram', label: 'gram (Gram)' },
  { value: 'liter', label: 'liter (Liter)' },
  { value: 'kaleng', label: 'kaleng (Kaleng)' },
  { value: 'biji', label: 'biji (Biji / Unit)' },
];

export default function OwnerProdukPage() {
  const [produkList, setProdukList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('semua');
  const [filterStok, setFilterStok] = useState('semua'); // semua | kritis | aman
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [satuanOptions, setSatuanOptions] = useState(SATUAN_ECERAN_OPTIONS);

  // Multi-Harga modal state
  const [hargaModalOpen, setHargaModalOpen] = useState(false);
  const [hargaEdit, setHargaEdit] = useState({});
  const [savingHarga, setSavingHarga] = useState(false);

  // Slide-over form state
  const [notifStok, setNotifStok] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('tokiva_notif_stok') !== 'off';
  });
  const [tipsFotoOpen, setTipsFotoOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('tokiva_notif_stok', notifStok ? 'on' : 'off');
  }, [notifStok]);

  useEffect(() => {
    fetchProduk();
    fetchKategori();
    api.get('/owner/satuan').then(res => {
      const data = res?.berhasil ? res.data : (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSatuanOptions(data.map(s => ({ value: s.id, label: `${s.nama}` })));
      }
    }).catch(() => {});
  }, []);

  const fetchKategori = async () => {
    try {
      const res = await api.get('/owner/kategori');
      const data = res?.berhasil ? res.data : (Array.isArray(res?.data) ? res.data : []);
      setKategoriList(Array.isArray(data) ? data : []);
    } catch {
      setKategoriList([]);
    }
  };

  // Debounce search → fetch ke BE (search + kategori sebagai source of truth)
  useEffect(() => {
    const t = setTimeout(() => { fetchProduk(); }, 300);
    return () => clearTimeout(t);
  }, [search, selectedKategori, filterStok]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedKategori, filterStok]);

  const fetchProduk = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedKategori !== 'semua') params.kategori_id = selectedKategori;
      if (filterStok === 'kritis') params.stok_kritis = 'true';
      const res = await api.get('/owner/produk', { params });
      const data = res?.berhasil ? res.data : (Array.isArray(res?.data) ? res.data : []);
      if (!Array.isArray(data)) { setProdukList([]); return; }
      // Filter 'aman' lokal (BE hanya support flag kritis)
      setProdukList(filterStok === 'aman' ? data.filter(p => Number(p.stok) > Number(p.stok_minimum)) : data);
    } catch {
      setProdukList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Camera Barcode Scan state
  const [showBarcodeScan, setShowBarcodeScan] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const videoRef = useRef(null);

  // Camera Snapshot Photo Capture state
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const captureVideoRef = useRef(null);

  // Modal Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Sembunyikan/munculkan bottom nav saat slide-over form dibuka/ditutup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(isFormOpen ? 'owner-nav-hide' : 'owner-nav-show'));
    return () => window.dispatchEvent(new CustomEvent('owner-nav-show'));
  }, [isFormOpen]);
  const [formData, setFormData] = useState({
    nama: '',
    barcode: '',
    stok: 0,
    stok_minimum: 10,
    satuan: 'pcs',
    hpp: '',
    harga_jual: '',
    fotos: [],
  });

  // Camera lifecycle for snapshot photo capture
  useEffect(() => {
    let stream = null;
    if (showCameraCapture) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        }).then(s => {
          stream = s;
          if (captureVideoRef.current) captureVideoRef.current.srcObject = s;
        }).catch(err => console.warn('Capture camera access denied:', err));
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [showCameraCapture]);

  const handleTakeSnapshot = () => {
    if (!captureVideoRef.current) return;
    const video = captureVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setFormData(prev => ({
      ...prev,
      fotos: [...(prev.fotos || []), dataUrl]
    }));
  };

  useEffect(() => {
    let stream = null;
    let timer = null;

    if (showBarcodeScan) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        }).then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        }).catch(err => console.warn('Camera access denied:', err));
      }

      timer = setInterval(() => {
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
          });
          if (videoRef.current && videoRef.current.readyState === 4) {
            detector.detect(videoRef.current).then(results => {
              if (results.length > 0) {
                const code = results[0].rawValue;
                handleAutoScannedBarcode(code);
              }
            }).catch(() => {});
          }
        }
      }, 400);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [showBarcodeScan]);

  const handleAutoScannedBarcode = (code) => {
    setScannedCode(code);
    setFormData(prev => ({ ...prev, barcode: code }));
    setSearch(code);
    setTimeout(() => {
      setShowBarcodeScan(false);
      setScannedCode('');
    }, 600);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const MAX = 10 * 1024 * 1024; // 10MB
    const oversized = files.filter(f => f.size > MAX);
    if (oversized.length > 0) {
      toast.error(`Maksimal 10MB per foto. ${oversized.map(f => f.name).join(', ')} ditolak.`, { title: 'Foto Terlalu Besar' });
    }
    files.filter(f => f.size <= MAX).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          fotos: [...(prev.fotos || []), event.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      fotos: (prev.fotos || []).filter((_, i) => i !== index)
    }));
  };

  const filteredProduk = produkList; // BE sudah memfilter search/kategori/kritis

  const stats = {
    totalProduk: produkList.length,
    kategori: kategoriList.length,
    stokRendah: produkList.filter(p => Number(p.stok) <= Number(p.stok_minimum)).length,
  };

  // Skeleton untuk daftar produk
  const renderProdukSkeleton = () => (
    <div className="space-y-2.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <div className="space-y-1.5 text-right">
            <Skeleton className="h-3.5 w-16 ml-auto" />
            <Skeleton className="h-2.5 w-20 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      nama: '', barcode: '', stok: 0, stok_minimum: 10,
      satuan: 'pcs', hpp: '', harga_jual: '', fotos: [],
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      nama: p.nama || '',
      barcode: p.barcode || '',
      stok: p.stok ?? 0,
      stok_minimum: p.stok_minimum ?? 10,
      satuan: p.satuan_dasar?.nama || 'pcs',
      hpp: p.hpp > 0 ? p.hpp : '',
      harga_jual: Number(p.harga_jual_default || 0) || '',
      fotos: p.foto_url ? [p.foto_url] : (p.fotos || (p.img ? [p.img] : [])),
    });
    setIsFormOpen(true);
  };

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nama: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast.error('Nama produk wajib diisi!', { title: 'Validasi Gagal' });
      return;
    }
    try {
      const payload = {
        nama: formData.nama,
        barcode: formData.barcode,
        stok: Number(formData.stok) || 0,
        stok_minimum: Number(formData.stok_minimum) || 0,
        hpp: Number(formData.hpp) || 0,
        harga_jual_default: Number(formData.harga_jual) || 0,
        satuan_id: formData.satuan || null,
        foto_url: formData.fotos?.[0] || null,
      };

      if (editingId) {
        await api.put(`/owner/produk/${editingId}`, payload);
        toast.success('Data produk berhasil diperbarui.', { title: 'Berhasil!' });
      } else {
        await api.post('/owner/produk', payload);
        toast.success('Produk baru berhasil ditambahkan.', { title: 'Berhasil!' });
      }
      setIsFormOpen(false);
      fetchProduk();
    } catch (err) {
      toast.error(err.response?.data?.pesan || err.message, { title: 'Gagal Menyimpan' });
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await api.delete(`/owner/produk/${confirmDelete.id}`);
      toast.success('Produk telah dinonaktifkan.', { title: 'Berhasil!' });
      setConfirmDelete({ isOpen: false, id: null, nama: '' });
      fetchProduk();
    } catch (err) {
      toast.error(err.response?.data?.pesan || err.message, { title: 'Gagal Menghapus' });
    }
  };

  // Export CSV dari data produk real (client-side)
  const handleExportCsv = () => {
    if (produkList.length === 0) {
      toast.info('Belum ada produk untuk diekspor.', { title: 'Tidak Ada Data' });
      return;
    }
    const header = ['nama', 'barcode', 'kategori', 'stok', 'stok_minimum', 'harga_ecer'];
    const rows = produkList.map(p => [
      `"${String(p.nama || '').replace(/"/g, '""')}"`,
      `"${String(p.barcode || '')}"`,
      `"${String(p.kategori?.nama || '')}"`,
      p.stok,
      p.stok_minimum,
      p.harga_ecer,
    ]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produk-tokiva-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV produk telah diunduh.', { title: 'Ekspor Berhasil' });
  };

  const handleOpenHarga = () => {
    const edit = {};
    produkList.forEach(p => {
      const sj = (p.satuan_jual || []).find(s => s.is_default && Number(s.harga_ecer || 0) > 0)
        || (p.satuan_jual || []).find(s => Number(s.harga_ecer || 0) > 0)
        || (p.satuan_jual || [])[0];
      if (sj) {
        edit[p.id] = { sid: sj.id, ecer: Number(sj.harga_ecer || 0), grosir: Number(sj.harga_grosir || 0) };
      }
    });
    setHargaEdit(edit);
    setHargaModalOpen(true);
  };

  const handleSaveHarga = async () => {
    setSavingHarga(true);
    let ok = 0;
    let fail = 0;
    for (const [id, v] of Object.entries(hargaEdit)) {
      if (!v.sid) { fail++; continue; }
      try {
        await api.put(`/owner/produk/${id}/satuan-jual/${v.sid}`, {
          harga_ecer: Number(v.ecer) || 0,
          harga_grosir: Number(v.grosir) || 0,
        });
        ok++;
      } catch { fail++; }
    }
    setSavingHarga(false);
    setHargaModalOpen(false);
    setHargaEdit({});
    if (ok > 0) fetchProduk();
    (fail === 0 ? toast.success : toast.error)(
      fail === 0 ? `${ok} harga produk diperbarui.` : `${ok} berhasil, ${fail} gagal diperbarui.`,
      { title: fail === 0 ? 'Berhasil!' : 'Sebagian Gagal' }
    );
  };

  const handleDelete = (p) => {
    const id = typeof p === 'object' ? p.id : p;
    const nama = typeof p === 'object' ? p.nama : 'produk ini';
    setConfirmDelete({ isOpen: true, id, nama });
  };

  return (
    <div className="max-w-[430px] lg:max-w-none mx-auto space-y-4 pb-24 lg:pb-8 text-[#10233E]">
      {/* Promo Summary Card */}
      <section className="relative overflow-hidden rounded-[22px] p-4 lg:p-6 bg-gradient-to-br from-[#E8FAF0] via-white to-[#FFF8D9] shadow-[0_2px_10px_rgba(16,35,62,.05)]">
        <div className="relative z-10 max-w-[58%] lg:max-w-[52%]">
          <h1 className="text-base lg:text-xl font-semibold leading-6 lg:leading-7">Katalog & Multi-Harga</h1>
          <p className="text-[11px] lg:text-[13px] font-normal text-[#68758A] leading-4 mt-1">Kelola produk, harga eceran/grosir, dan ambang stok minimum.</p>
        </div>
        <img src="/assets/tokiva-dashboard/img-produk1.png" alt="Katalog produk" className="absolute right-1 bottom-1 lg:right-6 w-[46%] lg:w-[30%] h-[86%] object-contain object-right-bottom" />
        <div className="relative z-10 grid grid-cols-3 gap-1.5 mt-3 max-w-[62%] lg:max-w-[55%]">
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg bg-[#0CAF60]/10 text-[#0CAF60] flex items-center justify-center shrink-0"><Package className="w-3.5 h-3.5 lg:w-4 lg:h-4" /></span>
            <div className="min-w-0"><p className="text-[13px] lg:text-base font-medium leading-4">{stats.totalProduk}</p><p className="text-[9px] lg:text-[11px] font-normal text-[#68758A] truncate">Produk</p></div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg bg-[#F3EEFF] text-violet-600 flex items-center justify-center shrink-0"><LayoutGrid className="w-3.5 h-3.5 lg:w-4 lg:h-4" /></span>
            <div className="min-w-0"><p className="text-[13px] lg:text-base font-medium leading-4">{stats.kategori}</p><p className="text-[9px] lg:text-[11px] font-normal text-[#68758A] truncate">Kategori</p></div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg bg-[#FFF0F0] text-[#F05B61] flex items-center justify-center shrink-0"><AlertTriangle className="w-3.5 h-3.5 lg:w-4 lg:h-4" /></span>
            <div className="min-w-0"><p className="text-[13px] lg:text-base font-medium leading-4">{stats.stokRendah}</p><p className="text-[9px] lg:text-[11px] font-normal text-[#68758A] truncate">Stok Rendah</p></div>
          </div>
        </div>
      </section>

      {/* Action Row */}
      <div className="lg:flex lg:items-center lg:gap-3 space-y-2.5 lg:space-y-0">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-sm lg:flex-1 lg:order-first">
          <Search className="w-4 h-4 text-[#68758A] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk / barcode..."
            className="flex-1 bg-transparent text-xs font-normal text-[#10233E] placeholder:text-[#68758A] outline-none"
          />
          <span className="w-px h-4 bg-gray-200" />
          <button
            onClick={() => setShowBarcodeScan(true)}
            aria-label="Scan barcode"
            className="text-[#0CAF60] shrink-0 p-0.5"
          >
            <ScanBarcode className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex-[1.8] lg:flex-none whitespace-nowrap flex items-center justify-center gap-1.5 px-2 py-2.5 lg:px-4 bg-[#0CAF60] text-white rounded-xl text-xs font-medium shadow-sm hover:bg-[#087A4B] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Produk</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex-1 lg:flex-none whitespace-nowrap px-2 py-2.5 lg:px-4 bg-white border border-gray-200 text-[#68758A] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4 shrink-0" />
            Import/Export
          </button>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              'relative flex-1 lg:flex-none whitespace-nowrap px-2 py-2.5 lg:px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition-all',
              filterStok !== 'semua' ? 'bg-[#0CAF60] text-white' : 'bg-white border border-gray-200 text-[#68758A] hover:bg-gray-50'
            )}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            Filter
          </button>
        </div>
      </div>
      {filterOpen && (
        <div className="flex gap-1.5 -mt-1 lg:mt-0">
          {[['semua', 'Semua'], ['kritis', 'Stok Kritis'], ['aman', 'Stok Aman']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setFilterStok(id); setFilterOpen(false); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                filterStok === id ? 'bg-[#0CAF60] text-white' : 'bg-white text-[#68758A] shadow-sm hover:bg-[#E8FAF0]'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap lg:flex-nowrap gap-1.5 overflow-x-auto lg:overflow-visible hide-scrollbar overscroll-x-contain">
        <button
          onClick={() => setSelectedKategori('semua')}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
            selectedKategori === 'semua' ? 'bg-[#0CAF60] text-white shadow-sm' : 'bg-white text-[#68758A] shadow-sm hover:bg-[#E8FAF0]'
          )}
        >
          Semua
        </button>
        {kategoriList.map(k => (
          <button
            key={k.id}
            onClick={() => setSelectedKategori(k.id)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
              selectedKategori === k.id ? 'bg-[#0CAF60] text-white shadow-sm' : 'bg-white text-[#68758A] shadow-sm hover:bg-[#E8FAF0]'
            )}
          >
            {k.nama}
          </button>
        ))}
      </div>

      {/* Mobile Compact Card List */}
      {isLoading ? (
        renderProdukSkeleton()
      ) : filteredProduk.length > 0 ? (
        <>
          <div className="space-y-2.5 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3">
            {filteredProduk.slice((page - 1) * 20, page * 20).map((p) => {
              const ecerPrice = Number(p.harga_jual_default || 0);
              const grosirPrice = Number(p.harga_grosir || 0);
              const isKritis = Number(p.stok) <= Number(p.stok_minimum);

              return (
                <div
                  key={p.id}
                  className={cn(
                    'bg-white rounded-[16px] p-3 shadow-sm border flex items-center gap-3 lg:flex-col lg:items-stretch lg:p-4 transition-all hover:shadow-md',
                    isKritis ? 'border-[#F5C6C9] bg-[#FFF8F8]' : 'border-gray-50'
                  )}
                >
                  <div className="relative shrink-0">
                    <ProdukThumb nama={p.nama} img={p.foto_url || p.img || p.fotos?.[0]} className="w-12 h-12 rounded-xl lg:w-full lg:h-36 lg:rounded-2xl" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#0CAF60] border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0 lg:flex-none">
                    <p className="text-xs font-medium text-[#10233E] truncate">{p.nama}</p>
                    <p className="text-[10px] font-normal text-[#68758A] font-mono truncate">{p.barcode || 'NO-BARCODE'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn('text-[9px] font-normal px-1.5 py-0.5 rounded-full', isKritis ? 'bg-[#FFF0F0] text-[#D94850]' : 'bg-[#E8FAF0] text-[#087A4B]')}>
                        Stok {p.stok} {p.satuan_dasar?.nama || 'pcs'}
                      </span>
                      <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-full bg-gray-100 text-[#68758A]">
                        Min {p.stok_minimum}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 lg:text-left lg:flex lg:items-center lg:justify-between lg:border-t lg:border-gray-50 lg:mt-3 lg:pt-3">
                    <div>
                      <p className="text-[13px] font-medium text-[#0CAF60]">
                        {formatRupiah(ecerPrice)}
                      </p>
                      {grosirPrice > 0 && (
                        <p className="text-[9px] font-normal text-[#68758A] mt-0.5">
                          Grosir {formatRupiah(grosirPrice)}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end gap-1.5 mt-1.5 lg:mt-0">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 text-[#68758A] hover:text-[#10233E] hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-[#68758A] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {filteredProduk.length > 20 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
              <span>Menampilkan {((page - 1) * 20) + 1} - {Math.min(page * 20, filteredProduk.length)} dari {filteredProduk.length} produk</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl disabled:opacity-40 font-medium hover:bg-gray-50"
                >
                  ← Prev
                </button>
                <span className="font-medium text-gray-700">{page} / {Math.ceil(filteredProduk.length / 20)}</span>
                <button
                  disabled={page >= Math.ceil(filteredProduk.length / 20)}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl disabled:opacity-40 font-medium hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-[16px] border border-gray-50 p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-[#E8FAF0] rounded-full flex items-center justify-center mx-auto mb-2 text-[#0CAF60]">
            <Package className="w-6 h-6" />
          </div>
          <h4 className="text-[13px] font-medium text-[#10233E] mb-1">Produk Tidak Ditemukan</h4>
          <p className="text-[11px] font-normal text-[#68758A]">
            {search ? `Tidak ada produk dengan kata kunci "${search}". Coba kata kunci lain atau scan barcode.` : 'Belum ada produk terdaftar di toko Anda.'}
          </p>
        </div>
      )}

      {/* Multi-Harga Panel */}
      <section className="rounded-[18px] bg-gradient-to-br from-[#E8FAF0] to-[#FFF8D9] p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0"><Tags className="w-5 h-5 text-[#0CAF60]" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#10233E]">Multi-Harga Eceran & Grosir</p>
          <p className="text-[10px] font-normal text-[#68758A]">Atur harga jual per produk sekaligus.</p>
        </div>
        <button
          onClick={handleOpenHarga}
          className="shrink-0 px-3 py-2 rounded-xl bg-[#0CAF60] text-white text-xs font-medium shadow-sm hover:bg-[#087A4B] active:scale-[0.98] transition-all"
        >
          Kelola Harga
        </button>
      </section>

      {/* Slide-over Add / Edit Produk — full height, smooth bottom sheet */}
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isFormOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
      </div>
      <div className={cn(
        'fixed z-40 bg-white shadow-2xl flex flex-col inset-x-0 bottom-0 max-h-[92vh] h-full lg:h-auto rounded-t-[24px] lg:rounded-none lg:rounded-l-[28px] lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:max-h-none lg:w-[480px] transition-transform duration-300 ease-out',
        isFormOpen
          ? 'translate-y-0 lg:translate-y-0 lg:translate-x-0'
          : 'translate-y-full pointer-events-none lg:translate-y-0 lg:translate-x-full'
      )}>
        <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mt-2.5 shrink-0 lg:hidden" />
        <div className="flex items-center justify-between px-4 lg:px-5 pt-2 pb-3 border-b border-gray-50 shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold leading-5 text-[#10233E]">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
            <p className="text-[10px] font-normal text-[#68758A]">{editingId ? 'Perbarui detail produk & multi-harga' : 'Lengkapi detail produk baru Anda'}</p>
          </div>
          <button onClick={() => setIsFormOpen(false)} className="p-2 -mr-1 text-[#68758A] hover:bg-gray-100 rounded-xl active:scale-95 transition-all"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto hide-scrollbar px-4 lg:px-5 py-3 space-y-3">
                {/* AI Banner */}
                <div className="relative overflow-hidden rounded-[16px] p-3 bg-gradient-to-br from-[#E8FAF0] via-white to-[#FFF8D9]">
                  <div className="relative z-10 max-w-[62%]">
                    <p className="text-xs font-medium text-[#10233E] flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-[#0CAF60]" /> Bantu AI mengenali produk Anda</p>
                    <p className="text-[10px] font-normal text-[#68758A] leading-4 mt-1">Upload foto dari berbagai sudut untuk hasil deteksi yang lebih akurat.</p>
                    <button type="button" onClick={() => setTipsFotoOpen(true)} className="text-[10px] font-medium text-[#0CAF60] mt-1.5">Pelajari lebih lanjut →</button>
                  </div>
                  <img src="/assets/tokiva-dashboard/img-ai-banner.png" alt="Bantuan AI" className="absolute right-1 bottom-1 w-[42%] h-[95%] object-contain object-right-bottom" />
                </div>

                {/* Nama Produk */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#10233E]">Nama Produk</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#68758A]" />
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={e => setFormData({ ...formData, nama: e.target.value })}
                      maxLength={100}
                      placeholder="Indomie Goreng Spesial"
                      required
                      className="w-full pl-9 pr-12 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] focus:outline-none focus:border-[#0CAF60]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-normal text-[#68758A]">{formData.nama.length}/100</span>
                  </div>
                </div>

                {/* Foto Produk Multi-Angle */}
                <div className="p-3 rounded-[16px] border border-gray-100 space-y-2 bg-[#FAFBFC]">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-[#10233E] flex items-center gap-1.5 text-[11px]">
                      <ImageIcon className="w-4 h-4 text-[#0CAF60]" />
                      Foto Produk Multi-Angle
                    </label>
                    <button type="button" onClick={() => setTipsFotoOpen(true)} className="text-[10px] font-medium text-[#0CAF60] flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Tips Foto</button>
                  </div>
                  <p className="text-[9px] font-normal text-[#68758A] leading-4">
                    Gunakan latar polos & pencahayaan cukup agar model AI mengenali produk dengan baik.
                  </p>

                  <div className="flex gap-2">
                    <label className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 border-2 border-dashed border-emerald-200 hover:border-[#0CAF60] bg-white rounded-xl cursor-pointer transition-all">
                      <Upload className="w-4 h-4 text-[#0CAF60]" />
                      <span className="text-[9px] font-medium text-[#10233E]">Upload Foto</span>
                      <span className="text-[8px] font-normal text-[#68758A]">Maks. 10MB/foto</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    </label>
                    <button type="button" onClick={() => setShowCameraCapture(true)} className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white rounded-xl transition-all">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span className="text-[9px] font-medium text-[#10233E]">Ambil Foto</span>
                      <span className="text-[8px] font-normal text-[#68758A]">Kamera langsung</span>
                    </button>
                  </div>

                  {formData.fotos && formData.fotos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pt-1">
                      {formData.fotos.map((url, idx) => (
                        <div key={idx} className="w-16 h-16 rounded-xl border border-gray-200 relative overflow-hidden shrink-0">
                          <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                          <span className={`absolute bottom-0 left-0 right-0 text-white text-[7px] text-center py-0.5 ${idx === 0 ? 'bg-[#0CAF60]' : 'bg-black/70'}`}>{idx === 0 ? 'Main Thumb' : `AI #${idx + 1}`}</span>
                          <button type="button" onClick={() => handleRemovePhoto(idx)} className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"><X className="w-2.5 h-2.5" /></button>
                        </div>
                      ))}
                      <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#0CAF60] bg-white flex flex-col items-center justify-center cursor-pointer shrink-0 text-[#0CAF60] transition-all">
                        <Plus className="w-4 h-4" />
                        <span className="text-[7px] font-medium">Tambah</span>
                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#10233E]">Kode Barcode</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="089686010018"
                        value={formData.barcode}
                        onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] focus:outline-none focus:border-[#0CAF60]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBarcodeScan(true)}
                        className="p-2 bg-[#E8FAF0] text-[#0CAF60] border border-emerald-100 rounded-xl active:scale-95 transition-all shrink-0"
                        title="Scan Barcode via Kamera Live"
                      >
                        <ScanBarcode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#10233E]">Satuan Eceran (Dasar)</label>
                    <select
                      value={formData.satuan}
                      onChange={e => setFormData({ ...formData, satuan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-normal text-[#10233E] focus:outline-none focus:border-[#0CAF60]"
                      required
                    >
                      {(satuanOptions.length > 0 ? satuanOptions : SATUAN_ECERAN_OPTIONS).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#10233E]">Harga Beli / HPP (satuan)</label>
                    <input
                      type="number"
                      prefix="Rp"
                      value={formData.hpp}
                      onChange={e => setFormData({ ...formData, hpp: e.target.value })}
                      placeholder="3500"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] focus:outline-none focus:border-[#0CAF60]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#10233E]">Harga Jual Eceran</label>
                    <input
                      type="number"
                      value={formData.harga_jual}
                      onChange={e => setFormData({ ...formData, harga_jual: e.target.value })}
                      required
                      placeholder="5000"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] focus:outline-none focus:border-[#0CAF60]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#10233E]">Stok Saat Ini (pcs)</label>
                    <input
                      type="number"
                      value={formData.stok}
                      onChange={e => setFormData({ ...formData, stok: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] focus:outline-none focus:border-[#0CAF60]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#10233E]">Batas Stok Minimum</label>
                    <input
                      type="number"
                      value={formData.stok_minimum}
                      onChange={e => setFormData({ ...formData, stok_minimum: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-normal text-[#10233E] placeholder:text-[#68758A] focus:outline-none focus:border-[#0CAF60]"
                    />
                  </div>
                </div>

                {/* Notifikasi Stok */}
                <div className="flex items-center justify-between p-3 rounded-[16px] border border-gray-100 bg-[#FAFBFC]">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center shrink-0"><Bell className="w-4 h-4" /></span>
                    <div>
                      <p className="text-[11px] font-medium text-[#10233E]">Notifikasi Stok</p>
                      <p className="text-[9px] font-normal text-[#68758A]">Ingatkan saat stok mencapai batas minimum</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifStok(!notifStok)}
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${notifStok ? 'bg-[#0CAF60]' : 'bg-gray-200'}`}
                    aria-label="Notifikasi stok"
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notifStok ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Footer sticky */}
              <div className="p-3 border-t border-gray-50 shrink-0 bg-white">
                <Button variant="primary" fullWidth size="lg" type="submit" icon={Save}>
                  {editingId ? 'Simpan Perubahan' : 'Tambah ke Katalog'}
                </Button>
              </div>
            </form>
      </div>

      {/* FULL-SCREEN CAMERA BARCODE SCANNER OVERLAY FOR PRODUCT CREATION */}
      {showBarcodeScan && (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between overflow-hidden animate-fade-in select-none">
          {/* Live Video Background */}
          <div className="absolute inset-0 z-0 bg-gray-950 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90 pointer-events-none" />
          </div>

          {/* Top Control Bar */}
          <div className="relative z-20 flex items-center justify-between p-4 pt-6">
            <button
              type="button"
              onClick={() => setShowBarcodeScan(false)}
              className="p-2.5 bg-black/40 backdrop-blur rounded-full text-white hover:bg-black/60 transition-all border border-white/10 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs text-red-400 font-bold">Kamera Barcode Reader</span>
            </div>
            <span className="text-xs text-white/80 font-medium tracking-wide">
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Center Bounding Scanner Frame */}
          <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-4">
            <div className="mb-4 px-4 py-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-full text-white text-xs font-semibold flex items-center gap-2 shadow-md">
              <ScanBarcode className="w-4 h-4 text-red-400" />
              <span>Arahkan kamera ke kode barcode produk...</span>
            </div>

            <div className="w-full max-w-xs aspect-square relative rounded-3xl overflow-hidden flex items-center justify-center">
              <div className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 border-red-500 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 border-red-500 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 border-red-500 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 border-red-500 rounded-br-2xl" />

              {/* Red Laser Beam Animation */}
              <div className="absolute left-4 right-4 h-0.5 bg-red-500 shadow-lg shadow-red-500/80 animate-pulse top-1/2 -translate-y-1/2" />
            </div>

            {scannedCode && (
              <div className="mt-4 bg-emerald-500 text-white rounded-2xl px-5 py-2.5 text-center shadow-xl animate-slide-up">
                <p className="text-[9px] uppercase font-bold tracking-wider opacity-90">Barcode Terisi Otomatis</p>
                <p className="text-base font-mono font-semibold">{scannedCode}</p>
              </div>
            )}

            {/* Quick Simulation Buttons — DIHAPUS (test-only) */}
          </div>

          {/* Bottom Action */}
          <div className="relative z-20 pb-8 pt-2 px-4 flex justify-center">
            <button
              type="button"
              onClick={() => setShowBarcodeScan(false)}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold border border-white/20 backdrop-blur transition-all"
            >
              Batal / Tutup Kamera
            </button>
          </div>
        </div>
      )}

      {/* LIVE BROWSER CAMERA PHOTO SNAPSHOT CAPTURE MODAL - FULLSCREEN PORTRAIT (NO FRAME) */}
      {showCameraCapture && (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between overflow-hidden animate-fade-in select-none">
          {/* Live Video Background - Fullscreen Portrait */}
          <div className="absolute inset-0 z-0 bg-gray-950 overflow-hidden">
            <video
              ref={captureVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Top and Bottom Dark Gradients for legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />
          </div>

          {/* Top Header Controls Bar */}
          <div className="relative z-20 flex items-center justify-between p-4 pt-6">
            <button
              type="button"
              onClick={() => setShowCameraCapture(false)}
              className="p-2.5 bg-black/40 backdrop-blur rounded-full text-white hover:bg-black/60 transition-all border border-white/10 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs text-white font-bold">Kamera Live Produk</span>
            </div>
            <span className="text-xs text-emerald-400 font-semibold bg-black/50 backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
              {formData.fotos?.length || 0} Foto
            </span>
          </div>

          {/* Bottom Floating Controls */}
          <div className="relative z-20 pb-8 px-4 flex flex-col items-center gap-4">
            {/* Counter & Instruction Pill */}
            <div className="bg-black/70 backdrop-blur border border-white/15 px-4 py-2 rounded-full text-center shadow-xl">
              <p className="text-xs text-white font-semibold">
                Foto Diambil: <span className="font-semibold text-emerald-400">{formData.fotos?.length || 0} Foto</span>
              </p>
              <p className="text-[10px] text-gray-300 mt-0.5">Arahkan kamera ke produk & tekan tombol jepret</p>
            </div>

            {/* Shutter & Done Buttons Row */}
            <div className="flex items-center justify-center gap-6 w-full max-w-xs">
              <button
                type="button"
                onClick={handleTakeSnapshot}
                className="w-20 h-20 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 active:scale-90 transition-all border-4 border-white shrink-0"
                title="Jepret Foto Produk"
              >
                <Camera className="w-9 h-9" />
              </button>

              <button
                type="button"
                onClick={() => setShowCameraCapture(false)}
                className="px-5 py-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold border border-white/30 backdrop-blur transition-all active:scale-95 shrink-0"
              >
                Selesai ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kelola Harga (Multi-Harga) */}
      <Modal
        isOpen={hargaModalOpen}
        onClose={() => setHargaModalOpen(false)}
        title="Kelola Harga Produk"
        size="md"
      >
        <div className="space-y-2 max-h-[55vh] overflow-y-auto hide-scrollbar">
          {produkList.length === 0 ? (
            <p className="text-xs font-normal text-[#68758A] text-center py-6">Belum ada produk untuk diatur harganya.</p>
          ) : (
            produkList.map(p => {
              const v = hargaEdit[p.id];
              if (!v) return null;
              return (
                <div key={p.id} className="p-2.5 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-[#10233E] truncate">{p.nama}</p>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <input
                      type="number"
                      value={v.ecer}
                      onChange={e => setHargaEdit(prev => ({ ...prev, [p.id]: { ...prev[p.id], ecer: e.target.value } }))}
                      placeholder="Harga Eceran"
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-normal text-[#10233E] outline-none focus:border-[#0CAF60]"
                    />
                    <input
                      type="number"
                      value={v.grosir}
                      onChange={e => setHargaEdit(prev => ({ ...prev, [p.id]: { ...prev[p.id], grosir: e.target.value } }))}
                      placeholder="Harga Grosir"
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-normal text-[#10233E] outline-none focus:border-[#0CAF60]"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="secondary" fullWidth onClick={() => setHargaModalOpen(false)}>Batal</Button>
          <Button variant="primary" fullWidth onClick={handleSaveHarga} disabled={savingHarga || produkList.length === 0}>
            {savingHarga ? 'Menyimpan...' : 'Simpan Semua'}
          </Button>
        </div>
      </Modal>

      {/* Tips Foto */}
      <FeedbackModal
        isOpen={tipsFotoOpen}
        onClose={() => setTipsFotoOpen(false)}
        type="info"
        title="Tips Foto Produk"
        message={'1. Gunakan latar polos dan terang.\n2. Pencahayaan cukup, hindari bayangan.\n3. Ambil foto dari beberapa sudut (depan, samping, belakang, kemasan).\n4. Isi frame dengan produk agar model AI mengenali dengan akurat.'}
      />

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, nama: '' })}
        onConfirm={executeDelete}
        title="Hapus Produk"
        message={`Apakah Anda yakin ingin menonaktifkan produk "${confirmDelete.nama}"?`}
        confirmText="Ya, Nonaktifkan"
        isDanger
      />


    </div>
  );
}
