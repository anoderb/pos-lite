'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/ToastProvider';

/** Satuan eceran default (dipakai form) */
export const SATUAN_ECERAN_OPTIONS = [
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

const defaultForm = { nama: '', barcode: '', stok: 0, stok_minimum: 10, satuan: 'pcs', hpp: '', harga_jual: '', fotos: [] };

/**
 * useProducts — state & operasi halaman katalog produk.
 * Return nama identik dengan yang lama di produk/page.jsx agar call-site tak berubah.
 */
export function useProducts() {
  const [produkList, setProdukList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('semua');
  const [filterStok, setFilterStok] = useState('semua'); // semua | kritis | aman
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [satuanOptions, setSatuanOptions] = useState(SATUAN_ECERAN_OPTIONS);
  const [hargaModalOpen, setHargaModalOpen] = useState(false);
  const [hargaEdit, setHargaEdit] = useState({});
  const [savingHarga, setSavingHarga] = useState(false);
  const [notifStok, setNotifStok] = useState(() => (typeof window !== 'undefined' ? (localStorage.getItem('tokiva_notif_stok') === '1') : false));
  const [tipsFotoOpen, setTipsFotoOpen] = useState(false);

  const fetchKategori = async () => {
    try {
      const res = await api.get('/owner/kategori');
      const data = res?.berhasil ? res.data : (Array.isArray(res?.data) ? res.data : []);
      setKategoriList(Array.isArray(data) ? data : []);
    } catch {
      setKategoriList([]);
    }
  };

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
      setProdukList(filterStok === 'aman' ? data.filter(p => Number(p.stok) > Number(p.stok_minimum)) : data);
    } catch {
      setProdukList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search → fetch ke BE
  useEffect(() => {
    const t = setTimeout(() => { fetchProduk(); }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedKategori, filterStok]);

  useEffect(() => { setPage(1); }, [search, selectedKategori, filterStok]);

  // Initial load: produk + kategori + satuan (dari BE)
  useEffect(() => {
    fetchProduk();
    fetchKategori();
    api.get('/owner/satuan').then(res => {
      const data = res?.berhasil ? res.data : (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSatuanOptions(data.map(s => ({ value: s.id, label: `${s.nama}` })));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist notif stok ke localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('tokiva_notif_stok', notifStok ? '1' : 'off');
  }, [notifStok]);

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

  const [formData, setFormData] = useState(defaultForm);

  // Sembunyikan/munculkan bottom nav saat slide-over form dibuka/ditutup
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(isFormOpen ? 'owner-nav-hide' : 'owner-nav-show'));
    return () => window.dispatchEvent(new CustomEvent('owner-nav-show'));
  }, [isFormOpen]);

  // Camera lifecycle untuk snapshot photo capture
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
    setFormData(prev => ({ ...prev, fotos: [...(prev.fotos || []), dataUrl] }));
  };

  // Camera Barcode lifecycle
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
                handleAutoScannedBarcode(results[0].rawValue);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const stats = {
    totalProduk: produkList.length,
    kategori: kategoriList.length,
    stokRendah: produkList.filter(p => Number(p.stok) <= Number(p.stok_minimum)).length,
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ ...defaultForm });
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

  return {
    produkList, setProdukList,
    kategoriList, setKategoriList,
    search, setSearch,
    selectedKategori, setSelectedKategori,
    filterStok, setFilterStok,
    filterOpen, setFilterOpen,
    page, setPage,
    isLoading, setIsLoading,
    satuanOptions, setSatuanOptions,
    hargaModalOpen, setHargaModalOpen,
    hargaEdit, setHargaEdit,
    savingHarga, setSavingHarga,
    notifStok, setNotifStok,
    tipsFotoOpen, setTipsFotoOpen,
    showBarcodeScan, setShowBarcodeScan,
    scannedCode, setScannedCode,
    videoRef,
    showCameraCapture, setShowCameraCapture,
    captureVideoRef,
    isFormOpen, setIsFormOpen,
    editingId, setEditingId,
    formData, setFormData,
    confirmDelete, setConfirmDelete,
    stats,
    fetchKategori, fetchProduk,
    handleTakeSnapshot, handleAutoScannedBarcode,
    handleImageUpload, handleRemovePhoto,
    handleOpenAdd, handleOpenEdit,
    handleSave, executeDelete,
    handleExportCsv, handleOpenHarga, handleSaveHarga,
    handleDelete,
  };
}
