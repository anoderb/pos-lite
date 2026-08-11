'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  DollarSign,
  PieChart,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

import { api } from '@/lib/api';

export default function OwnerLaporanPage() {
  const [rentang, setRentang] = useState('bulan_ini');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [laporanSummary, setLaporanSummary] = useState({
    totalOmset: 0,
    totalHpp: 0,
    labaKotor: 0,
    diskonKasir: 0,
    labaBersih: 0,
  });
  const [metodePembayaran, setMetodePembayaran] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hitung rentang tanggal berdasarkan pilihan
  useEffect(() => {
    const now = new Date();
    if (rentang === 'hari_ini') {
      const d = now.toISOString().slice(0, 10);
      setTanggalMulai(d); setTanggalSelesai(d);
    } else if (rentang === '7_hari') {
      const end = now.toISOString().slice(0, 10);
      const start = new Date(now - 7*86400000).toISOString().slice(0, 10);
      setTanggalMulai(start); setTanggalSelesai(end);
    } else if (rentang === 'bulan_ini') {
      setTanggalMulai(now.toISOString().slice(0, 7) + '-01');
      setTanggalSelesai(now.toISOString().slice(0, 10));
    } else if (rentang === 'bulan_lalu') {
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setTanggalMulai(last.toISOString().slice(0, 7) + '-01');
      setTanggalSelesai(last.toISOString().slice(0, 10));
    }
  }, [rentang]);

  const fetchLaporan = async () => {
    try {
      setIsLoading(true);
      const [penjualanRes, labaRugiRes] = await Promise.all([
        api.get('/owner/laporan/penjualan', { 
          params: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai } 
        }).catch(() => null),
        api.get('/owner/laporan/laba-rugi', {
          params: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai }
        }).catch(() => null),
      ]);

      const txs = Array.isArray(penjualanRes?.data) ? penjualanRes.data : (Array.isArray(penjualanRes) ? penjualanRes : []);
      const labaRugi = labaRugiRes?.data || labaRugiRes || {};

      let omset = 0, diskon = 0, cash = 0, qris = 0, transfer = 0;
      txs.forEach(t => {
        const tot = Number(t.total || 0);
        omset += tot;
        diskon += Number(t.diskon_total || 0);
        const m = (t.metode_bayar || '').toLowerCase();
        if (m === 'cash' || m === 'tunai') cash += tot;
        else if (m === 'qris') qris += tot;
        else transfer += tot;
      });

      setLaporanSummary({
        totalOmset: omset,
        totalHpp: Number(labaRugi.total_hpp || 0),
        labaKotor: omset - Number(labaRugi.total_hpp || 0),
        diskonKasir: diskon,
        labaBersih: Number(labaRugi.estimasi_laba_kotor || (omset - Number(labaRugi.total_hpp || 0) - diskon)),
      });

      const totalValid = omset || 1;
      setMetodePembayaran([
        { nama: 'Tunai (Cash)', total: cash, persentase: Math.round((cash / totalValid) * 100) },
        { nama: 'QRIS', total: qris, persentase: Math.round((qris / totalValid) * 100) },
        { nama: 'Transfer Bank', total: transfer, persentase: Math.round((transfer / totalValid) * 100) },
      ]);
    } catch {
      setLaporanSummary({ totalOmset: 0, totalHpp: 0, labaKotor: 0, diskonKasir: 0, labaBersih: 0 });
      setMetodePembayaran([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tanggalMulai && tanggalSelesai) fetchLaporan();
  }, [tanggalMulai, tanggalSelesai]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

  // Skeleton blocks matching laporan layout
  const renderLabaRugiSkeleton = () => (
    <div className="space-y-3 text-xs">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex justify-between items-center py-1">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );

  const renderMetodeSkeleton = () => (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div>
          <h1 className="text-lg font-bold text-gray-900 font-[family-name:var(--font-poppins)]">
            Laporan Keuangan & Penjualan
          </h1>
          <p className="text-xs text-gray-500">Analisis Laba Rugi, HPP, dan perincian Omset toko</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`${API_BASE_URL}/owner/laporan/penjualan/export?tanggal_mulai=${tanggalMulai}&tanggal_selesai=${tanggalSelesai}&format=pdf`, '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 active:scale-95 transition-all shadow-xs"
          >
            <FileText className="w-4 h-4 text-red-500" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => window.open(`${API_BASE_URL}/owner/laporan/penjualan/export?tanggal_mulai=${tanggalMulai}&tanggal_selesai=${tanggalSelesai}&format=excel`, '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#16A34A] text-white rounded-xl text-xs font-bold hover:bg-[#15803D] active:scale-95 transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {[
          { id: 'hari_ini', label: 'Hari Ini' },
          { id: '7_hari', label: '7 Hari Terakhir' },
          { id: 'bulan_ini', label: 'Bulan Ini (Juli 2026)' },
          { id: 'bulan_lalu', label: 'Bulan Lalu' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setRentang(item.id)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all border',
              rentang === item.id
                ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs font-bold'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Income Statement (Laporan Laba Rugi) Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900 font-[family-name:var(--font-poppins)]">
            Laporan Laba Rugi (Income Statement)
          </h3>
          <span className="text-xs text-gray-500 font-medium">Periode: Juli 2026</span>
        </div>

        <div className="space-y-3 text-xs">
          {isLoading ? (
            renderLabaRugiSkeleton()
          ) : (
            <>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600 font-medium">Total Omset Penjualan Kotor</span>
                <span className="font-bold text-gray-900 text-sm">{formatRupiah(laporanSummary.totalOmset)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-red-600">
                <span>Harga Pokok Penjualan (HPP Total Modal)</span>
                <span className="font-bold">- {formatRupiah(laporanSummary.totalHpp)}</span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-xl font-bold text-gray-900">
                <span>Laba Kotor (Gross Profit)</span>
                <span className="text-[#16A34A]">{formatRupiah(laporanSummary.labaKotor)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-amber-600">
                <span>Potongan Diskon & Promo Kasir</span>
                <span className="font-bold">- {formatRupiah(laporanSummary.diskonKasir)}</span>
              </div>

              <div className="border-t-2 border-dashed border-gray-200 pt-3 flex justify-between items-center text-sm font-extrabold text-gray-900">
                <span className="flex items-center gap-1.5 text-[#16A34A]">
                  <DollarSign className="w-5 h-5 p-0.5 bg-emerald-100 rounded-full" />
                  Laba Bersih (Net Profit Estimate)
                </span>
                <span className="text-base text-[#16A34A] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  {formatRupiah(laporanSummary.labaBersih)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          Perincian Metode Pembayaran
        </h3>

        <div className="space-y-3">
          {isLoading ? (
            renderMetodeSkeleton()
          ) : (
            metodePembayaran.map((m, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-800">
                  <span>{m.nama}</span>
                  <span className="text-[#16A34A]">{formatRupiah(m.total)} ({m.persentase}%)</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#16A34A] rounded-full transition-all"
                    style={{ width: `${m.persentase}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
