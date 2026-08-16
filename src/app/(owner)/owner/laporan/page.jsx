'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  Wallet,
  Receipt,
  Percent,
} from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';
import { api } from '@/lib/api';

const RENTANG = [
  { id: 'hari_ini', label: 'Hari Ini' },
  { id: '7_hari', label: '7 Hari Terakhir' },
  { id: 'bulan_ini', label: 'Bulan Ini' },
  { id: 'bulan_lalu', label: 'Bulan Lalu' },
];

function GrowthBadge({ value }) {
  if (value === null || value === undefined) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#68758A]"><Minus className="w-3 h-3" /> —</span>;
  }
  const up = value >= 0;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium', up ? 'text-[#0CAF60]' : 'text-[#D94850]')}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function DonutChart({ metode }) {
  const total = metode.reduce((s, m) => s + m.total, 0);
  const colors = ['#0CAF60', '#8B5CF6', '#3B82F6'];
  const R = 34;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const segments = metode.map((m, i) => {
    const frac = total > 0 ? m.total / total : 0;
    const seg = { ...m, frac, color: colors[i], dash: frac * C, offset };
    offset += frac * C;
    return seg;
  });
  return (
    <div className="relative w-[110px] h-[110px] shrink-0">
      <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
        <circle cx="45" cy="45" r={R} fill="none" stroke="#F0F2F5" strokeWidth="12" />
        {total > 0 && segments.map(s => (
          <circle
            key={s.nama}
            cx="45" cy="45" r={R} fill="none"
            stroke={s.color} strokeWidth="12"
            strokeDasharray={`${s.dash} ${C - s.dash}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[8px] font-normal text-[#68758A]">Total</p>
        <p className="text-[10px] font-medium text-[#10233E]">{formatRupiah(total)}</p>
      </div>
    </div>
  );
}

export default function OwnerLaporanPage() {
  const [rentang, setRentang] = useState('bulan_ini');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  const fetchRingkasan = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/owner/laporan/ringkasan', { params: { rentang } });
      setData(res?.data || res || null);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRingkasan(); }, [rentang]);

  // Rentang tanggal untuk export (GMT+7, sama pattern BE)
  const rentangTanggal = () => {
    const O = 7 * 3600 * 1000;
    const local = new Date(Date.now() + O);
    const y = local.getUTCFullYear();
    const m = local.getUTCMonth();
    const d = local.getUTCDate();
    let mulai, selesai;
    if (rentang === 'hari_ini') { mulai = new Date(Date.UTC(y, m, d)); selesai = new Date(Date.UTC(y, m, d + 1)); }
    else if (rentang === '7_hari') { mulai = new Date(Date.UTC(y, m, d - 6)); selesai = new Date(Date.UTC(y, m, d + 1)); }
    else if (rentang === 'bulan_lalu') { mulai = new Date(Date.UTC(y, m - 1, 1)); selesai = new Date(Date.UTC(y, m, 1)); }
    else { mulai = new Date(Date.UTC(y, m, 1)); selesai = new Date(Date.UTC(y, m + 1, 1)); }
    return {
      tanggal_mulai: new Date(mulai.getTime() - O).toISOString().slice(0, 10),
      tanggal_selesai: new Date(selesai.getTime() - O - 1000).toISOString().slice(0, 10),
    };
  };

  const handleExportCsv = async () => {
    try {
      setExporting('csv');
      const res = await api.get('/owner/laporan/penjualan', { params: rentangTanggal() });
      const txs = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      if (txs.length === 0) {
        setExporting('');
        return;
      }
      const header = ['nomor_transaksi', 'tanggal', 'kasir', 'metode_bayar', 'total', 'diskon'];
      const rows = txs.map(t => [
        `"${String(t.nomor_transaksi || '')}"`,
        `"${String(t.created_at || '').slice(0, 10)}"`,
        `"${String(t.kasir?.nama || '')}"`,
        `"${String(t.metode_bayar || '')}"`,
        t.total,
        t.diskon_total || 0,
      ]);
      const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-penjualan-${rentang}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* gagal export — biarkan */
    } finally {
      setExporting('');
    }
  };

  const handleExportPdf = () => {
    if (!data) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const rowsHtml = (data.metode || [])
      .map(m => `<tr><td>${m.label}</td><td style="text-align:right">${formatRupiah(m.total)}</td><td style="text-align:right">${m.persentase}%</td></tr>`)
      .join('');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Laporan Keuangan Tokiva</title>
      <style>body{font-family:Inter,Arial,sans-serif;padding:32px;color:#10233E}h1{font-size:20px}h2{font-size:14px;margin-top:24px}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
      td,th{border:1px solid #e5e7eb;padding:6px 8px;text-align:left}
      .kpi{display:flex;gap:12px;flex-wrap:wrap}.kpi div{flex:1;min-width:140px;border:1px solid #e5e7eb;border-radius:12px;padding:12px}
      .v{font-size:16px;font-weight:600}.s{font-size:11px;color:#68758A}</style></head><body>
      <h1>Laporan Keuangan & Penjualan</h1>
      <p class="s">Periode: ${data.label_periode || rentang} — dicetak ${new Date().toLocaleString('id-ID')}</p>
      <div class="kpi">
        <div><p class="s">Total Omset</p><p class="v">${formatRupiah(data.omset)}</p></div>
        <div><p class="s">Laba Bersih</p><p class="v">${formatRupiah(data.laba_bersih)}</p></div>
        <div><p class="s">Transaksi</p><p class="v">${data.total_transaksi}</p></div>
        <div><p class="s">Rata-rata/Transaksi</p><p class="v">${formatRupiah(Math.round(data.rata_rata_tx))}</p></div>
      </div>
      <h2>Income Statement</h2>
      <table>
        <tr><td>Omset Kotor</td><td style="text-align:right">${formatRupiah(data.omset)}</td></tr>
        <tr><td>HPP</td><td style="text-align:right">- ${formatRupiah(data.total_hpp)}</td></tr>
        <tr><td>Laba Kotor</td><td style="text-align:right">${formatRupiah(data.laba_kotor)}</td></tr>
        <tr><td>Diskon Promo</td><td style="text-align:right">- ${formatRupiah(data.diskon)}</td></tr>
        <tr><td><b>Laba Bersih</b></td><td style="text-align:right"><b>${formatRupiah(data.laba_bersih)}</b></td></tr>
      </table>
      <h2>Metode Pembayaran</h2>
      <table><tr><th>Metode</th><th style="text-align:right">Total</th><th style="text-align:right">Persentase</th></tr>${rowsHtml}</table>
      <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
      </body></html>`);
    w.document.close();
  };

  const kpi = [
    { key: 'omset', label: 'Total Omset', icon: Wallet, color: 'text-[#0CAF60] bg-[#E8FAF0]', value: data?.omset, growth: data?.growth_omset },
    { key: 'laba', label: 'Laba Bersih', icon: TrendingUp, color: 'text-violet-600 bg-[#F3EEFF]', value: data?.laba_bersih, growth: data?.growth_laba },
    { key: 'tx', label: 'Transaksi', icon: Receipt, color: 'text-blue-600 bg-[#EAF3FF]', value: data?.total_transaksi, growth: data?.growth_tx, isCount: true },
    { key: 'rata', label: 'Rata-rata/Transaksi', icon: Percent, color: 'text-amber-600 bg-[#FFF8D9]', value: Math.round(data?.rata_rata_tx || 0), growth: data?.growth_rata },
  ];

  return (
    <div className="max-w-[430px] mx-auto space-y-4 pb-24 text-[#10233E]">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[20px] p-4 bg-gradient-to-br from-[#E8FAF0] via-white to-[#FFF8D9] shadow-[0_2px_10px_rgba(16,35,62,.05)]">
        <div className="relative z-10 max-w-[64%]">
          <p className="text-[10px] font-normal text-[#68758A]">Dashboard &gt; Laporan Keuangan</p>
          <h1 className="text-base font-semibold leading-6 mt-1">Laporan Keuangan & Penjualan</h1>
          <p className="text-[10px] font-normal text-[#68758A] leading-4 mt-1">Ringkasan performa keuangan dan penjualan toko Anda.</p>
        </div>
        <img src="/assets/tokiva-dashboard/img-laporan-3d.png" alt="Laporan 3D" className="absolute right-1 bottom-0 w-[40%] h-[96%] object-contain object-right-bottom" />
      </div>

      {/* Export Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleExportPdf}
          className="flex items-center gap-2 p-3 rounded-[16px] bg-white shadow-sm border border-gray-50 hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <span className="w-9 h-9 rounded-xl bg-[#FFF0F0] text-[#D94850] flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></span>
          <span className="text-left">
            <span className="block text-[11px] font-medium text-[#10233E]">Export PDF</span>
            <span className="block text-[9px] font-normal text-[#68758A]">Cetak laporan</span>
          </span>
        </button>
        <button
          onClick={handleExportCsv}
          disabled={exporting === 'csv'}
          className="flex items-center gap-2 p-3 rounded-[16px] bg-white shadow-sm border border-gray-50 hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          <span className="w-9 h-9 rounded-xl bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center shrink-0"><FileSpreadsheet className="w-4 h-4" /></span>
          <span className="text-left">
            <span className="block text-[11px] font-medium text-[#10233E]">Export Excel</span>
            <span className="block text-[9px] font-normal text-[#68758A]">{exporting === 'csv' ? 'Menyiapkan...' : 'Unduh CSV'}</span>
          </span>
        </button>
      </div>

      {/* Rentang Filter */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar overscroll-x-contain">
        {RENTANG.map(r => (
          <button
            key={r.id}
            onClick={() => setRentang(r.id)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
              rentang === r.id ? 'bg-[#0CAF60] text-white shadow-sm' : 'bg-white text-[#68758A] shadow-sm hover:bg-[#E8FAF0]'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2">
        {kpi.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.key} className="rounded-[16px] bg-white p-3 shadow-sm border border-gray-50 min-h-[96px]">
              {isLoading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-2.5 w-12" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center', k.color)}><Icon className="w-3.5 h-3.5" /></span>
                  </div>
                  <p className="text-[9px] font-normal text-[#68758A] mt-2">{k.label}</p>
                  <p className="text-[15px] font-semibold leading-5 mt-0.5">{k.isCount ? k.value : formatRupiah(k.value || 0)}</p>
                  <div className="mt-1"><GrowthBadge value={k.growth} /></div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Income Statement */}
      <section className="rounded-[18px] bg-white p-4 shadow-sm border border-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium leading-5">Laporan Laba Rugi</h2>
          <span className="text-[10px] font-normal text-[#68758A]">Periode: {data?.label_periode || rentang}</span>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between items-center py-1">
                <Skeleton className="h-3 w-44" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : data ? (
          <>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="font-normal text-[#68758A]">Omset Kotor</span><span className="font-medium text-[#10233E]">{formatRupiah(data.omset)}</span></div>
              <div className="flex justify-between"><span className="font-normal text-[#68758A]">HPP</span><span className="font-medium text-[#D94850]">- {formatRupiah(data.total_hpp)}</span></div>
              <div className="flex justify-between"><span className="font-normal text-[#68758A]">Laba Kotor</span><span className="font-medium text-[#10233E]">{formatRupiah(data.laba_kotor)}</span></div>
              <div className="flex justify-between"><span className="font-normal text-[#68758A]">Diskon Promo</span><span className="font-medium text-[#F59E0B]">- {formatRupiah(data.diskon)}</span></div>
            </div>
            <div className="border-t border-dashed border-gray-200 my-3" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#10233E]">Laba Bersih</span>
              <span className="px-3 py-1.5 rounded-full bg-[#E8FAF0] text-[#087A4B] text-[13px] font-semibold">{formatRupiah(data.laba_bersih)}</span>
            </div>
          </>
        ) : (
          <p className="text-[11px] font-normal text-[#68758A] text-center py-6">Belum ada data untuk periode ini.</p>
        )}
      </section>

      {/* Metode Pembayaran */}
      <section className="rounded-[18px] bg-white p-4 shadow-sm border border-gray-50">
        <h2 className="text-sm font-medium leading-5 mb-3">Perincian Metode Pembayaran</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        ) : data && (data.metode || []).some(m => m.total > 0) ? (
          <div className="flex items-center gap-3">
            <DonutChart metode={data.metode || []} />
            <div className="flex-1 space-y-2.5 min-w-0">
              {(data.metode || []).map(m => (
                <div key={m.nama}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-normal text-[#68758A]">{m.label}</span>
                    <span className="font-medium text-[#10233E]">{m.persentase}% · {formatRupiah(m.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', m.nama === 'cash' ? 'bg-[#0CAF60]' : m.nama === 'qris' ? 'bg-violet-500' : 'bg-blue-500')}
                      style={{ width: `${m.persentase}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[11px] font-normal text-[#68758A] text-center py-6">Belum ada transaksi pada periode ini.</p>
        )}
      </section>
    </div>
  );
}
