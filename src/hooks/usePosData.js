'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

/**
 * usePosData — data & fetch POS (produk, pelanggan, kategori, toko/payment, stats, riwayat).
 * Return nama SAMA dengan yang lama di pos-engine.jsx agar call-site tidak berubah.
 * TIDAK menangani: AI model, camera, checkout, QRIS — itu hook/screen lain.
 */
export function usePosData() {
  const [produkList, setProdukList] = useState([]);
  const [pelangganList, setPelangganList] = useState([{ id: 'umum', nama: 'Pelanggan Umum', no_hp: '' }]);
  const [tokoPay, setTokoPay] = useState(null);
  const [todayStats, setTodayStats] = useState({ omzet: 0, total_transaksi: 0, total_item_terjual: 0, total_produk_terjual: 0 });
  const [kategoriList, setKategoriList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('semua');

  // History Transaksi (semua data, 10/halaman)
  const [riwayat, setRiwayat] = useState([]);
  const [riwayatTotal, setRiwayatTotal] = useState(0);
  const [riwayatPage, setRiwayatPage] = useState(1);
  const [riwayatPages, setRiwayatPages] = useState(1);
  const [isRiwayatLoading, setIsRiwayatLoading] = useState(true);
  const [riwayatFilter, setRiwayatFilter] = useState('semua'); // 'semua' | 'pending'
  const [riwayatPendingTotal, setRiwayatPendingTotal] = useState(0);

  // Katalog: pagination + tampilan grid/list + urutan
  const [produkPage, setProdukPage] = useState(1);
  const [produkViews, setProdukViews] = useState(12);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('nama'); // 'nama' | 'harga' | 'stok'

  const fetchRiwayat = async (page = riwayatPage) => {
    try {
      setIsRiwayatLoading(true);
      const res = await api.get('/owner/laporan/riwayat', { params: { page, pageSize: 10 } });
      const d = res?.data || res || {};

      api.get('/owner/laporan/pending', { params: { page: 1, pageSize: 1 } })
        .then((pres) => { const pd = pres?.data || pres || {}; setRiwayatPendingTotal(pd?.total || 0); })
        .catch(() => { /* ignore */ });

      setRiwayat(Array.isArray(d.data) ? d.data : []);
      setRiwayatTotal(d.total || 0);
      setRiwayatPages(d.totalPages || 1);
      setRiwayatPage(Math.min(Math.max(1, d.page || 1), d.totalPages || 1));
      setRiwayatFilter('semua');
    } catch {
      setRiwayat([]);
      setRiwayatTotal(0);
    } finally {
      setIsRiwayatLoading(false);
    }
  };

  const fetchPendingRiwayat = async (page = 1) => {
    try {
      setIsRiwayatLoading(true);
      const res = await api.get('/owner/laporan/pending', { params: { page, pageSize: 10 } });
      const d = res?.data || res || {};
      setRiwayat(Array.isArray(d.data) ? d.data : []);
      setRiwayatTotal(d.total || 0);
      setRiwayatPages(d.totalPages || 1);
      setRiwayatPage(Math.min(Math.max(1, d.page || 1), d.totalPages || 1));
    } catch {
      setRiwayat([]);
      setRiwayatTotal(0);
    } finally {
      setIsRiwayatLoading(false);
    }
  };

  const reloadRiwayatPage = (page) => (riwayatFilter === 'pending' ? fetchPendingRiwayat(page) : fetchRiwayat(page));

  const switchRiwayatFilter = (f) => {
    setRiwayatFilter(f);
    setRiwayatPage(1);
    if (f === 'pending') fetchPendingRiwayat(1);
    else fetchRiwayat(1);
  };

  const fetchTokoPay = async () => {
    try {
      const res = await api.get('/owner/toko');
      const d = res?.data || res;
      if (d) setTokoPay(d);
    } catch { setTokoPay(null); }
  };

  const fetchTodayStats = async () => {
    try {
      const res = await api.get('/owner/dashboard', { params: { periode: 'hari_ini' } });
      const d = res?.data || res;
      if (d) setTodayStats({
        omzet: d.omzet || 0,
        total_transaksi: d.total_transaksi || 0,
        total_item_terjual: d.total_item_terjual || 0,
        total_produk_terjual: d.total_produk_terjual || 0,
      });
    } catch { /* biarkan 0 */ }
  };

  const fetchKategori = async () => {
    try {
      const res = await api.get('/kasir/kategori');
      const data = res?.berhasil ? res.data : (Array.isArray(res?.data) ? res.data : []);
      setKategoriList(Array.isArray(data) ? data : []);
    } catch {
      setKategoriList([]);
    }
  };

  const fetchProduk = async () => {
    try {
      const res = await api.get('/kasir/produk');
      const data = Array.isArray(res) ? res : (res?.data || []);
      if (data.length > 0) {
        const normalized = data.map(p => ({
          ...p,
          harga: Number(p.harga_ecer ?? p.satuan_jual?.[0]?.harga_ecer ?? p.hpp ?? 0),
        }));
        setProdukList(normalized);
      } else {
        setProdukList([]);
      }
    } catch {
      setProdukList([]);
    }
  };

  const fetchPelanggan = async () => {
    try {
      const res = await api.get('/kasir/pelanggan');
      const base = [{ id: 'umum', nama: 'Pelanggan Umum', no_hp: '' }];
      if (res?.berhasil && Array.isArray(res.data)) {
        setPelangganList([...base, ...res.data]);
      } else {
        setPelangganList(base);
      }
    } catch {
      setPelangganList([{ id: 'umum', nama: 'Pelanggan Umum', no_hp: '' }]);
    }
  };

  return {
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
  };
}
