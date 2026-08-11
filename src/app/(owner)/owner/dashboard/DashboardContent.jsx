'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Plus,
  PackagePlus,
  Settings,
} from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import { formatRupiah } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const DEFAULT_DASHBOARD = {
  omzet_hari_ini: 0,
  total_transaksi_hari_ini: 0,
  estimasi_laba: 0,
  total_stok_kritis: 0,
  stok_kritis_list: [],
};

export default function DashboardContent() {
  const { user, toko } = useAuthStore();

  const [periodeFilter, setPeriodeFilter] = useState('hari_ini');
  const [stats, setStats] = useState({
    omset: 0,
    labaBersih: 0,
    totalTx: 0,
    stokKritis: 0,
  });
  const [topBestSeller, setTopBestSeller] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [periodeFilter]);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const dashRes = await api.get('/owner/dashboard').catch(() => null);

      const dash = dashRes?.data || dashRes || {};

      setStats({
        omset: Number(dash.omzet_hari_ini || 0),
        labaBersih: Number(dash.estimasi_laba || 0),
        totalTx: Number(dash.total_transaksi_hari_ini || 0),
        stokKritis: Number(dash.total_stok_kritis || 0),
      });

      setTopBestSeller(Array.isArray(dash.stok_kritis_list) ? dash.stok_kritis_list : []);
    } catch {
      setStats({ omset: 0, labaBersih: 0, totalTx: 0, stokKritis: 0 });
      setTopBestSeller([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Skeleton untuk KPI cards — biar LCP element langsung render (gak nunggu API)
  const renderKpiSkeleton = () => (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Greeting & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-poppins)]">
            Executive Dashboard
          </h1>
          <p className="text-xs text-gray-500">Ringkasan performa keuangan & operasional toko Anda</p>
        </div>

        {/* Period Filter */}
        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-xs self-start sm:self-auto">
          {[
            { id: 'hari_ini', label: 'Hari Ini' },
            { id: 'minggu_ini', label: 'Minggu Ini' },
            { id: 'bulan_ini', label: 'Bulan Ini' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriodeFilter(p.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                periodeFilter === p.id
                  ? 'bg-[#16A34A] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {isLoading ? (
          renderKpiSkeleton()
        ) : (
          <>
            {/* Omset Card */}
            <Link href="/owner/pos" className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2 hover:border-emerald-200 transition-all block">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500">Total Omset</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatRupiah(stats.omset)}</p>
              {stats.omset > 0 ? (
                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                  <span>Perkembangan hari ini</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                  <span>Belum ada penjualan. Mulai dari Mode Kasir POS →</span>
                </div>
              )}
            </Link>

            {/* Laba Bersih Card */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500">Laba Bersih Est.</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-bold text-emerald-700">{formatRupiah(stats.labaBersih)}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                <span>Margin {stats.omset > 0 ? Math.round((stats.labaBersih / stats.omset) * 100) : 0}%</span>
              </div>
            </div>

            {/* Total Transaksi Card */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500">Transaksi</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{stats.totalTx} Struk</p>
              {stats.totalTx > 0 ? (
                <p className="text-[10px] text-gray-500 font-medium">
                  Rata-rata: {formatRupiah(Math.round(stats.omset / stats.totalTx))}/tx
                </p>
              ) : (
                <p className="text-[10px] text-gray-500 font-medium">Belum ada transaksi</p>
              )}
            </div>

            {/* Stok Kritis Card */}
            <Link href="/owner/produk" className="bg-white rounded-2xl p-4 border border-red-100 bg-red-50/20 shadow-xs space-y-2 hover:border-red-300 transition-all block">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-red-600">Stok Kritis</span>
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-bold text-red-600">{stats.stokKritis} Produk</p>
              <p className="text-[10px] text-red-600 font-semibold">Perlu restok segera →</p>
            </Link>
          </>
        )}
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Aksi Manajerial Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/owner/produk"
            className="p-3 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 border border-gray-100 rounded-xl flex items-center gap-2.5 transition-all text-gray-700 hover:text-[#16A34A]"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#16A34A] flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Tambah Produk</p>
              <p className="text-[10px] text-gray-500">Atur multi-harga</p>
            </div>
          </Link>

          <Link
            href="/owner/pos"
            className="p-3 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 border border-gray-100 rounded-xl flex items-center gap-2.5 transition-all text-gray-700 hover:text-[#16A34A]"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#16A34A] flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Mode Kasir POS</p>
              <p className="text-[10px] text-gray-500">Deteksi produk otomatis</p>
            </div>
          </Link>

          <Link
            href="/owner/stock-adjustment"
            className="p-3 bg-gray-50 hover:bg-amber-50 hover:border-amber-200 border border-gray-100 rounded-xl flex items-center gap-2.5 transition-all text-gray-700 hover:text-amber-600"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Tambah Stok</p>
              <p className="text-[10px] text-gray-500">Adjust stok manual</p>
            </div>
          </Link>

          <Link
            href="/owner/pengaturan"
            className="p-3 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 border border-gray-100 rounded-xl flex items-center gap-2.5 transition-all text-gray-700 hover:text-indigo-600"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Pengaturan</p>
              <p className="text-[10px] text-gray-500">Profil toko & staf</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Stok Kritis Alert */}
      <div className="bg-white rounded-2xl p-4 border border-red-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Stok Kritis — Perlu Restok
          </h2>
          <Link href="/owner/produk" className="text-xs font-semibold text-[#16A34A] hover:underline flex items-center gap-0.5">
            Kelola Produk
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3 w-full">
                  <Skeleton className="w-6 h-6 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : topBestSeller.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-3">Semua stok aman terkendali 🎉</p>
        ) : (
          <div className="space-y-2.5">
            {topBestSeller.map((item, i) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-red-500 font-bold text-xs flex items-center justify-center text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{item.nama}</h4>
                    <p className="text-[10px] text-red-600 font-semibold">
                      Stok: {item.stok} / Min: {item.stok_minimum}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-red-600">
                  {Number(item.stok_minimum) - Number(item.stok)} Min
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
