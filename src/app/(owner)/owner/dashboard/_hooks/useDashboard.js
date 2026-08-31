'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

const EMPTY_DASH = {
  omzet: 0,
  omzet_prev: 0,
  growth_persen: 0,
  total_transaksi: 0,
  total_item_terjual: 0,
  total_produk_terjual: 0,
  chart: [],
  top_produk: [],
  insight: { arah: 'stable', persen: null, teks: '' },
};

/**
 * useDashboard — state & fetch halaman dashboard owner.
 * Dipakai DashboardContent.jsx; komponen presentasional (HeroCarousel,
 * RevenueChart, TxBars, GrowthPill) tetap di file screen.
 */
export function useDashboard() {
  const [periodeFilter, setPeriodeFilter] = useState('hari_ini');
  const [customRange, setCustomRange] = useState(null); // { mulai, selesai } YYYY-MM-DD
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeDraft, setRangeDraft] = useState({ mulai: '', selesai: '' });
  const [dash, setDash] = useState(EMPTY_DASH);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingTotal, setPendingTotal] = useState(0);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = customRange
        ? { tanggal_mulai: customRange.mulai, tanggal_selesai: customRange.selesai }
        : { periode: periodeFilter };
      const res = await api.get('/owner/dashboard', { params });
      const d = res?.data || res || {};
      setDash({ ...EMPTY_DASH, ...d });

      api.get('/owner/laporan/pending', { params: { page: 1, pageSize: 1 } })
        .then((pres) => { const pd = pres?.data || pres || {}; setPendingTotal(pd?.total || 0); })
        .catch(() => { /* ignore */ });
    } catch {
      setDash(EMPTY_DASH);
      setError('Gagal memuat data dashboard. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [periodeFilter, customRange]);

  const periods = [
    { id: 'hari_ini', label: 'Hari Ini' },
    { id: 'minggu_ini', label: 'Minggu Ini' },
    { id: 'bulan_ini', label: 'Bulan Ini' },
  ];

  const pickPeriod = (id) => { setCustomRange(null); setPeriodeFilter(id); setRangeOpen(false); };

  const applyRange = () => {
    if (!rangeDraft.mulai || !rangeDraft.selesai) return;
    setCustomRange({ mulai: rangeDraft.mulai, selesai: rangeDraft.selesai });
    setRangeOpen(false);
  };

  return {
    periodeFilter, setPeriodeFilter,
    customRange, setCustomRange,
    rangeOpen, setRangeOpen,
    rangeDraft, setRangeDraft,
    dash, setDash,
    isLoading, setIsLoading,
    error, setError,
    pendingTotal, setPendingTotal,
    fetchDashboard,
    periods, pickPeriod, applyRange,
  };
}
