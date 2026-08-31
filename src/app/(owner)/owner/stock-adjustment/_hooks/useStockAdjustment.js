'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/ToastProvider';

/**
 * useStockAdjustment — state & operasi halaman tambah/adjust stok.
 * Return nama identik dengan yang lama di stock-adjustment/page.jsx.
 */
export function useStockAdjustment() {
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
                setSearch(results[0].rawValue);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return {
    logList, setLogList,
    produkList, setProdukList,
    isLoading, setIsLoading,
    search, setSearch,
    filterTipe, setFilterTipe,
    filterOpen, setFilterOpen,
    isFormOpen, setIsFormOpen,
    showScan, setShowScan,
    videoRef,
    formData, setFormData,
    produkQuery, setProdukQuery,
    produkFocused, setProdukFocused,
    produkSuggestions,
    fetchData,
    totalCalculatedPcs,
    handleSave,
    filteredLogs,
    openForm,
    produkFoto,
    riwayatRef, scrollToRiwayat,
  };
}
