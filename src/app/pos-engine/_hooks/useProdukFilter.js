'use client';

import { useMemo } from 'react';

/**
 * useProdukFilter — search/kategori/sort/pagination katalog POS.
 * Pindahan murni dari pos-engine.jsx line 304–321 (zero logic change).
 * goProdukPage memanggil window.scrollTo — halaman memanggil setProdukPage sendiri.
 */
export function useProdukFilter({ produkList, search, selectedKategori, sortBy, produkPage, produkViews, setProdukPage }) {
  const filteredProdukSemua = useMemo(() => {
    return (produkList || []).filter(p => {
      const matchSearch = !search || (p.nama || '').toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
      const matchKategori = selectedKategori === 'semua' || p.kategori_id === selectedKategori;
      return matchSearch && matchKategori;
    });
  }, [produkList, search, selectedKategori]);

  const sortedProduk = useMemo(() => {
    return [...filteredProdukSemua].sort((a, b) => {
      if (sortBy === 'harga') return (Number(a.harga) || 0) - (Number(b.harga) || 0);
      if (sortBy === 'stok') return (Number(b.stok) || 0) - (Number(a.stok) || 0);
      return (a.nama || '').localeCompare(b.nama || '');
    });
  }, [filteredProdukSemua, sortBy]);

  const produkTotalPages = Math.max(1, Math.ceil(sortedProduk.length / produkViews));
  const filteredProduk = sortedProduk.slice((produkPage - 1) * produkViews, produkPage * produkViews);

  const goProdukPage = (p) => {
    if (p >= 1 && p <= produkTotalPages) {
      if (setProdukPage) setProdukPage(p);
      // eslint-disable-next-line no-restricted-globals
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return { filteredProdukSemua, sortedProduk, produkTotalPages, filteredProduk, goProdukPage };
}
