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
} from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { api } from '@/lib/api';

function ProdukThumb({ nama, img, className }) {
  if (img) {
    return (
      <div className={cn('overflow-hidden rounded-xl border border-gray-200 shrink-0 bg-gray-100', className)}>
        <img src={img} alt={nama} className="w-full h-full object-cover" />
      </div>
    );
  }
  const initials = (nama || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={cn('bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-[#16A34A] font-bold text-xs select-none shrink-0', className)}>
      {initials}
    </div>
  );
}

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
  const [search, setSearch] = useState('');
  const [filterStok, setFilterStok] = useState('semua');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [satuanOptions, setSatuanOptions] = useState(SATUAN_ECERAN_OPTIONS);

  useEffect(() => {
    fetchProduk();
    api.get('/owner/satuan').then(res => {
      const data = res?.berhasil ? res.data : (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSatuanOptions(data.map(s => ({ value: s.id, label: `${s.nama}` })));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, filterStok]);

  const fetchProduk = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/owner/produk');
      if (res?.berhasil && Array.isArray(res.data)) {
        setProdukList(res.data);
      } else {
        setProdukList([]);
      }
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
    setTimeout(() => {
      setShowBarcodeScan(false);
      setScannedCode('');
    }, 600);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
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

  const filteredProduk = produkList.filter((p) => {
    const matchesSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));

    if (!matchesSearch) return false;
    if (filterStok === 'kritis') return p.stok <= p.stok_minimum;
    return true;
  });

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

  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nama: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setFeedback({ isOpen: true, type: 'error', title: 'Validasi Gagal', message: 'Nama produk wajib diisi!' });
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
        setFeedback({ isOpen: true, type: 'success', title: 'Berhasil!', message: 'Data produk berhasil diperbarui.' });
      } else {
        await api.post('/owner/produk', payload);
        setFeedback({ isOpen: true, type: 'success', title: 'Berhasil!', message: 'Produk baru berhasil ditambahkan.' });
      }
      setIsFormOpen(false);
      fetchProduk();
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal Menyimpan', message: err.response?.data?.pesan || err.message });
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await api.delete(`/owner/produk/${confirmDelete.id}`);
      setFeedback({ isOpen: true, type: 'success', title: 'Berhasil!', message: 'Produk telah dinonaktifkan.' });
      setConfirmDelete({ isOpen: false, id: null, nama: '' });
      fetchProduk();
    } catch (err) {
      setFeedback({ isOpen: true, type: 'error', title: 'Gagal Menghapus', message: err.response?.data?.pesan || err.message });
    }
  };

  const handleDelete = (p) => {
    const id = typeof p === 'object' ? p.id : p;
    const nama = typeof p === 'object' ? p.nama : 'produk ini';
    setConfirmDelete({ isOpen: true, id, nama });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1 border-b border-gray-100">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 font-[family-name:var(--font-poppins)]">
            Katalog & Multi-Harga Produk
          </h1>
          <p className="text-xs text-gray-500">Kelola daftar harga eceran/grosir & ambang stok minimum</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#16A34A] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#15803D] active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk / barcode..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/30"
          />
        </div>
        <button
          onClick={() => setFilterStok(filterStok === 'kritis' ? 'semua' : 'kritis')}
          className={cn(
            'px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5',
            filterStok === 'kritis'
              ? 'bg-red-500 text-white border-red-500 font-bold'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="hidden sm:inline">Stok Kritis</span>
        </button>
      </div>

      {/* Mobile Compact Card List */}
      {isLoading ? (
        renderProdukSkeleton()
      ) : filteredProduk.length > 0 ? (
        <>
          <div className="space-y-2.5">
            {filteredProduk.slice((page - 1) * 20, page * 20).map((p) => {
              const ecerPrice = Number(p.harga_jual_default || 0);
              const grosirPrice = Number(p.harga_grosir || 0);
              const minQty = Number(p.min_qty_grosir) || 5;
              const isKritis = p.stok <= p.stok_minimum;

              return (
                <div
                  key={p.id}
                  className={cn(
                    'bg-white rounded-2xl p-4 border shadow-xs flex items-center justify-between gap-3 transition-all hover:border-[#16A34A]',
                    isKritis ? 'border-red-200 bg-red-50/20' : 'border-gray-100'
                  )}
                >
                  <ProdukThumb nama={p.nama} img={p.foto_url || p.img || p.fotos?.[0]} className="w-12 h-12 rounded-xl text-xs font-bold" />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{p.nama}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                        {p.barcode || 'NO-BARCODE'}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          isKritis ? 'bg-red-100 text-[#EF4444]' : 'bg-emerald-50 text-[#15803D]'
                        )}
                      >
                        Stok: {p.stok} {p.satuan_dasar?.nama || 'pcs'}
                      </span>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-extrabold text-[#16A34A]">
                      {formatRupiah(ecerPrice)}
                    </p>
                    {grosirPrice > 0 && (
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                        Grosir: <span className="font-bold text-gray-700">{formatRupiah(grosirPrice)}</span> (min {minQty})
                      </p>
                    )}
                    <div className="flex justify-end gap-1.5 mt-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls (BUG-13) */}
          {filteredProduk.length > 20 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
              <span>Menampilkan {((page - 1) * 20) + 1} - {Math.min(page * 20, filteredProduk.length)} dari {filteredProduk.length} produk</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl disabled:opacity-40 font-bold hover:bg-gray-50"
                >
                  ← Prev
                </button>
                <span className="font-bold text-gray-700">{page} / {Math.ceil(filteredProduk.length / 20)}</span>
                <button
                  disabled={page >= Math.ceil(filteredProduk.length / 20)}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl disabled:opacity-40 font-bold hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State Feedback (BUG-11) */
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 text-[#16A34A]">
            <Package className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">Produk Tidak Ditemukan</h4>
          <p className="text-xs text-gray-500">
            {search ? `Tidak ada produk dengan kata kunci "${search}". Coba kata kunci lain atau scan barcode.` : 'Belum ada produk terdaftar di toko Anda.'}
          </p>
        </div>
      )}

      {/* Modal Add / Edit Produk */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Produk & Multi-Harga' : 'Tambah Produk Baru'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <Input
            label="Nama Produk"
            placeholder="Indomie Goreng Spesial"
            value={formData.nama}
            onChange={e => setFormData({ ...formData, nama: e.target.value })}
            required
          />

          {/* Multi-Angle Photo Upload for Thumbnail & AI Training Dataset */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                <ImageIcon className="w-4 h-4 text-[#16A34A]" />
                Foto Produk Multi-Angle
              </label>
              <span className="text-[10px] text-[#15803D] bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Dataset Training AI
              </span>
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              Upload foto dari berbagai sudut (Tampak Depan, Samping, Belakang, Kemasan) untuk thumbnail & sampel pelatihan model visual AI.
            </p>

            {/* Dropzone & Photo Preview Carousel Grid */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              {/* Option 1: File Upload */}
              <label className="w-20 h-20 border-2 border-dashed border-emerald-300 hover:border-[#16A34A] bg-white rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-center p-1 shrink-0 hover:bg-emerald-50/50">
                <Upload className="w-4 h-4 text-[#16A34A] mb-1" />
                <span className="text-[9px] font-bold text-gray-700 leading-tight">📁 Upload File</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {/* Option 2: Live Browser Camera Capture */}
              <button
                type="button"
                onClick={() => setShowCameraCapture(true)}
                className="w-20 h-20 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-center p-1 shrink-0 hover:bg-blue-50/50"
              >
                <Camera className="w-4 h-4 text-blue-600 mb-1" />
                <span className="text-[9px] font-bold text-gray-700 leading-tight">📷 Kamera</span>
              </button>

              {/* Uploaded Photos List */}
              {formData.fotos && formData.fotos.map((url, idx) => (
                <div key={idx} className="w-20 h-20 rounded-xl border border-gray-200 relative overflow-hidden shrink-0 group bg-gray-900 shadow-xs">
                  <img src={url} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 ? (
                    <span className="absolute bottom-0 left-0 right-0 bg-[#16A34A] text-white text-[8px] font-bold text-center py-0.5">
                      Main Thumb
                    </span>
                  ) : (
                    <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-emerald-300 text-[8px] font-semibold text-center py-0.5">
                      AI Sample #{idx + 1}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 block">Kode Barcode</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="089686010018"
                  value={formData.barcode}
                  onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 placeholder:text-gray-500 focus:outline-none focus:border-[#16A34A]"
                />
                <button
                  type="button"
                  onClick={() => setShowBarcodeScan(true)}
                  className="p-2.5 bg-emerald-50 text-[#16A34A] border border-emerald-200 rounded-xl hover:bg-emerald-100 active:scale-95 transition-all shrink-0"
                  title="Scan Barcode via Kamera Live"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dropdown Satuan Eceran (No Typo) */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700 block">Satuan Eceran (Dasar)</label>
              <select
                value={formData.satuan}
                onChange={e => setFormData({ ...formData, satuan: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#16A34A] font-semibold"
                required
              >
                {(satuanOptions.length > 0 ? satuanOptions : SATUAN_ECERAN_OPTIONS).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Harga Beli / HPP (satuan)"
              type="number"
              prefix="Rp"
              value={formData.hpp}
              onChange={e => setFormData({ ...formData, hpp: e.target.value })}
              placeholder="3500"
            />
            <Input
              label="Harga Jual Eceran"
              type="number"
              prefix="Rp"
              value={formData.harga_jual}
              onChange={e => setFormData({ ...formData, harga_jual: e.target.value })}
              required
              placeholder="5000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Stok Saat Ini"
              type="number"
              value={formData.stok}
              onChange={e => setFormData({ ...formData, stok: e.target.value })}
              required
            />
            <Input
              label="Batas Stok Minimum"
              type="number"
              value={formData.stok_minimum}
              onChange={e => setFormData({ ...formData, stok_minimum: e.target.value })}
              required
            />
          </div>

          <Button variant="primary" fullWidth size="lg" type="submit">
            {editingId ? 'Simpan Perubahan' : 'Tambah ke Katalog'}
          </Button>
        </form>
      </Modal>

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
                <p className="text-base font-mono font-extrabold">{scannedCode}</p>
              </div>
            )}

            {/* Quick Simulation Buttons */}
            <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap max-w-xs">
              <span className="text-[10px] text-gray-500 font-medium">Test Barcode:</span>
              {['089686010018', '089686010025', '089686010032'].map(code => (
                <button
                  type="button"
                  key={code}
                  onClick={() => handleAutoScannedBarcode(code)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-200 rounded-lg text-[10px] font-mono border border-white/10 transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
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
            <span className="text-xs text-emerald-400 font-extrabold bg-black/50 backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
              {formData.fotos?.length || 0} Foto
            </span>
          </div>

          {/* Bottom Floating Controls */}
          <div className="relative z-20 pb-8 px-4 flex flex-col items-center gap-4">
            {/* Counter & Instruction Pill */}
            <div className="bg-black/70 backdrop-blur border border-white/15 px-4 py-2 rounded-full text-center shadow-xl">
              <p className="text-xs text-white font-semibold">
                Foto Diambil: <span className="font-extrabold text-emerald-400">{formData.fotos?.length || 0} Foto</span>
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

      {/* Notification Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
