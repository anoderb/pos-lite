'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays, ChevronDown, ChevronRight, Crown, PackagePlus,
  Plus, ScanLine, Settings, ShoppingCart, TrendingUp, TrendingDown,
  WalletCards, AlertTriangle, BarChart3,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const A = '/assets/tokiva-dashboard';
const EMPTY_DASH = {
  omzet: 0,
  omzet_prev: 0,
  growth_persen: null,
  total_transaksi: 0,
  rata_rata_tx: 0,
  estimasi_laba: 0,
  margin_persen: 0,
  hpp_lengkap: true,
  chart_omzet: [],
  chart_transaksi: [],
  top_produk: [],
  total_stok_kritis: 0,
  stok_kritis_list: [],
  insight: { arah: 'stable', persen: null, teks: '' },
};

// Line chart REAL — titik dari aggregasi transaksi per bucket.
function RevenueChart({ data }) {
  const pts = Array.isArray(data) && data.length > 0 ? data : [];
  const values = pts.map((p) => Number(p.nilai || 0));
  const max = Math.max(...values, 1);
  const W = 158;
  const H = 44;
  const step = pts.length > 1 ? W / (pts.length - 1) : W;
  const coords = pts.map((p, i) => {
    const y = H - (Number(p.nilai || 0) / max) * (H - 4);
    return [i * step, Math.max(2, Math.min(H - 2, y))];
  });
  const poly = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const hasSales = values.some((v) => v > 0);
  const labels = [pts[0]?.bucket, pts[Math.floor(pts.length / 2)]?.bucket, pts[pts.length - 1]?.bucket];

  return (
    <div className="absolute left-4 right-4 bottom-3 h-[62px] z-0">
      <svg viewBox={`0 0 ${W} ${H + 8}`} preserveAspectRatio="none" className="w-full h-[46px] overflow-visible" aria-label="Grafik omset">
        <defs>
          <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="white" stopOpacity=".22" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        {hasSales && (
          <>
            <polyline points={`${poly} ${W},${H} 0,${H}`} fill="url(#revenueFill)" stroke="none" />
            <polyline points={poly} fill="none" stroke="white" strokeOpacity=".86" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {coords.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.6" fill="white" fillOpacity=".9" />
            ))}
          </>
        )}
        {!hasSales && (
          <line x1="0" y1={H} x2={W} y2={H} stroke="white" strokeOpacity=".25" strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeDasharray="3 4" />
        )}
      </svg>
      <div className="flex justify-between text-[8px] text-white/55 mt-0.5">
        {labels.filter(Boolean).map((l, i) => <span key={i}>{l}</span>)}
      </div>
    </div>
  );
}

// Mini bar chart transaksi — REAL count per bucket.
function TxBars({ data }) {
  const pts = Array.isArray(data) && data.length > 0 ? data : [];
  const counts = pts.map((p) => Number(p.jumlah || 0));
  const max = Math.max(...counts, 1);
  const shown = pts.length > 14 ? pts.slice(-14) : pts;
  return (
    <div className="flex items-end gap-[3px] h-10 mt-2 text-violet-300">
      {shown.map((p, i) => {
        const h = 20 + (Number(p.jumlah || 0) / max) * 80;
        return <i key={i} style={{ height: `${h}%` }} className={`flex-1 rounded-t-full bg-current ${Number(p.jumlah) > 0 ? 'opacity-80' : 'opacity-25'}`} />;
      })}
    </div>
  );
}

export default function DashboardContent() {
  const { user, toko } = useAuthStore();
  const [periodeFilter, setPeriodeFilter] = useState('hari_ini');
  const [dash, setDash] = useState(EMPTY_DASH);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchDashboard(); }, [periodeFilter]);
  const fetchDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/owner/dashboard', { params: { periode: periodeFilter } });
      const d = res?.data || res || {};
      setDash({ ...EMPTY_DASH, ...d });
    } catch {
      setDash(EMPTY_DASH);
      setError('Gagal memuat data dashboard. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const periods = [{ id: 'hari_ini', label: 'Hari Ini' }, { id: 'minggu_ini', label: 'Minggu Ini' }, { id: 'bulan_ini', label: 'Bulan Ini' }];
  const ownerName = user?.nama?.split(' ')[0] || 'Owner';
  const growth = dash.growth_persen;
  const insight = dash.insight || { arah: 'stable', persen: null, teks: '' };
  const prevLabel = periodeFilter === 'hari_ini' ? 'kemarin' : periodeFilter === 'minggu_ini' ? 'minggu lalu' : 'bulan lalu';
  const todayLabel = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-[430px] mx-auto space-y-4 pb-24 text-[#10233E]">
      {error && <p className="text-[11px] font-normal text-[#D94850] bg-[#FFF0F0] rounded-xl px-3 py-2">{error}</p>}

      <section className="relative overflow-hidden rounded-[22px] min-h-[190px] p-4 bg-gradient-to-br from-[#E8FAF0] via-[#F5FFF7] to-[#FFF8D9] shadow-[0_2px_10px_rgba(16,35,62,.05)]">
        <div className="relative z-10 max-w-[54%]"><p className="text-[11px] text-[#68758A] font-normal leading-4">Selamat datang kembali,</p><h2 className="text-[17px] leading-6 font-medium mt-0.5">{ownerName}! 👋</h2><p className="text-[22px] leading-[26px] font-medium tracking-[-0.3px] mt-4">Kelola toko dengan lebih <span className="text-[#0CAF60]">cerdas</span> hari ini</p><p className="text-[11px] text-[#68758A] leading-4 mt-2 font-normal">Pantau performa, kelola stok, dan tingkatkan penjualan.</p></div>
        <div className="absolute right-1 bottom-3 w-[44%] h-[70%]"><img src={`${A}/img_store_1.png`} alt="Ilustrasi toko" className="w-full h-full object-contain object-center" /></div><div className="absolute left-4 bottom-3 flex gap-1"><i className="w-5 h-1.5 rounded-full bg-[#0CAF60]" /><i className="w-1.5 h-1.5 rounded-full bg-[#B8E8CC]" /></div>
      </section>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar overscroll-x-contain">{periods.map(p => <button key={p.id} onClick={() => setPeriodeFilter(p.id)} className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium leading-4 transition-all ${periodeFilter === p.id ? 'bg-[#0CAF60] text-white shadow-sm' : 'bg-white text-[#68758A] shadow-sm hover:bg-[#E8FAF0]'}`}><CalendarDays className="w-3.5 h-3.5" />{p.label}</button>)}<button className="ml-auto shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white text-xs font-medium leading-4 text-[#68758A] shadow-sm"><CalendarDays className="w-3.5 h-3.5" />{todayLabel}<ChevronDown className="w-3 h-3" /></button></div>

      <section className="space-y-3">
        <div className="relative overflow-hidden rounded-[18px] p-4 min-h-[168px] text-white bg-gradient-to-br from-[#0CAF60] to-[#087A4B] shadow-[0_2px_10px_rgba(16,35,62,.05)]">{isLoading ? <div className="relative z-10 w-full space-y-2"><div className="h-3 w-20 rounded-md bg-white/25 animate-pulse" /><div className="h-7 w-32 rounded-md bg-white/25 animate-pulse" /><div className="h-4 w-24 rounded-full bg-white/20 animate-pulse" /><div className="h-12 w-full rounded-lg bg-white/10 animate-pulse mt-2" /></div> : <><div className="relative z-10 w-[62%]"><p className="text-xs font-medium leading-4 text-white/80">Total Omset</p><p className="text-[28px] font-medium leading-8 tracking-[-0.4px] mt-1">{formatRupiah(dash.omzet)}</p>{growth !== null && growth !== 0 && <span className="inline-flex mt-2 rounded-full bg-white/15 px-2 py-1 text-[10px] font-medium leading-4">{growth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}{Math.abs(growth)}% <em className="not-italic font-normal ml-1 text-white/70">dari {prevLabel}</em></span>}</div><div className="absolute right-3 top-4 w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center z-10"><WalletCards className="w-5 h-5" /></div><RevenueChart data={dash.chart_omzet} /></>}</div>
        <div className="grid grid-cols-2 gap-3"><div className="rounded-[16px] p-3 min-h-[112px] bg-[#EAF3FF] shadow-sm">{isLoading ? <div className="space-y-2"><div className="flex justify-between"><div className="h-3 w-16 rounded bg-blue-200/70 animate-pulse" /><div className="h-5 w-5 rounded bg-blue-200/70 animate-pulse" /></div><div className="h-6 w-20 rounded bg-blue-200/70 animate-pulse" /><div className="h-2.5 w-14 rounded bg-blue-200/60 animate-pulse" /></div> : <><div className="flex justify-between"><p className="text-xs font-medium leading-4">Laba Bersih Est.</p><WalletCards className="w-5 h-5 text-blue-500" /></div><p className="text-[23px] font-medium leading-7 mt-2">{dash.hpp_lengkap ? formatRupiah(dash.estimasi_laba) : '—'}</p><p className="text-[10px] font-normal text-blue-600 mt-1">{dash.hpp_lengkap ? `Margin ${dash.margin_persen}%` : 'Data laba belum tersedia'}</p></>}</div><div className="rounded-[16px] p-3 min-h-[112px] bg-[#F3EEFF] shadow-sm">{isLoading ? <div className="space-y-2"><div className="flex justify-between"><div className="h-3 w-16 rounded bg-violet-200/70 animate-pulse" /><div className="h-5 w-5 rounded bg-violet-200/70 animate-pulse" /></div><div className="h-6 w-20 rounded bg-violet-200/70 animate-pulse" /><div className="h-2.5 w-14 rounded bg-violet-200/60 animate-pulse" /><div className="h-8 w-full rounded bg-violet-200/50 animate-pulse" /></div> : <><div className="flex justify-between"><p className="text-xs font-medium leading-4">Transaksi</p><ShoppingCart className="w-5 h-5 text-violet-500" /></div><p className="text-[23px] font-medium leading-7 mt-2">{dash.total_transaksi} Struk</p><p className="text-[10px] font-normal text-violet-600 mt-1">Rata-rata {formatRupiah(Math.round(dash.rata_rata_tx))}/tx</p><TxBars data={dash.chart_transaksi} /></>}</div></div>
      </section>

      <section className="rounded-[18px] bg-[#FFF0F0] p-4 flex items-center gap-3 shadow-sm">{isLoading ? <><div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-[#F05B61]" /></div><div className="flex-1 space-y-2"><div className="h-3 w-20 rounded bg-[#F5C6C9] animate-pulse" /><div className="h-6 w-24 rounded bg-[#F5C6C9] animate-pulse" /><div className="h-2.5 w-32 rounded bg-[#F5C6C9] animate-pulse" /></div><div className="w-[110px] h-[90px] rounded-xl bg-[#F5C6C9]/60 animate-pulse" /></> : <><div className="w-10 h-10 rounded-xl bg-white text-[#F05B61] flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></div><div className="flex-1"><p className="text-xs font-medium leading-4 text-[#D94850]">Stok Kritis</p><p className="text-[22px] font-medium leading-7">{dash.total_stok_kritis} Produk</p><p className="text-[10px] font-normal text-[#D94850]">{dash.total_stok_kritis > 0 ? 'Perlu restok segera!' : 'Semua stok aman.'}</p><Link href="/owner/produk" className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-[#D94850] hover:underline">Kelola Produk <ChevronRight className="w-3 h-3" /></Link></div><img src={`${A}/${dash.total_stok_kritis > 0 ? 'img_stok_empty.png' : 'img_stok_full.png'}`} alt="Status stok" className="w-[110px] h-[90px] object-contain" /></>}</section>

      <section><div className="flex items-center justify-between mb-2"><h2 className="text-base font-medium leading-6">Aksi Cepat</h2><Link href="/owner/produk" className="text-[11px] font-medium text-[#0CAF60] flex items-center">Lihat Semua <ChevronRight className="w-3.5 h-3.5" /></Link></div><div className="grid grid-cols-2 gap-2.5">{[[Plus,'Tambah Produk','/owner/produk','bg-[#E8FAF0] text-[#0CAF60]'],[PackagePlus,'Tambah Stok','/owner/stock-adjustment','bg-[#FFF8D9] text-amber-600'],[ScanLine,'Mode Kasir POS','/owner/pos','bg-[#EAF3FF] text-blue-600'],[Settings,'Pengaturan Toko','/owner/pengaturan','bg-[#F3EEFF] text-violet-600']].map(([Icon,label,href,color]) => <Link key={label} href={href} className="bg-white rounded-[16px] p-3 flex items-center gap-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"><span className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></span><span className="text-xs font-medium leading-4">{label}</span></Link>)}</div></section>

      <section className={`relative overflow-hidden rounded-[18px] p-4 text-white shadow-sm ${insight.arah === 'down' ? 'bg-[#7A2E33]' : 'bg-[#123C42]'}`}>{isLoading ? <div className="space-y-3 relative z-10"><div className="flex items-center justify-between"><div className="h-3.5 w-28 rounded bg-white/20 animate-pulse" /><div className="h-4 w-14 rounded-full bg-white/15 animate-pulse" /></div><div className="h-2.5 w-40 rounded bg-white/15 animate-pulse" /><div className="h-2.5 w-32 rounded bg-white/15 animate-pulse" /><div className="h-16 w-[120px] rounded-lg bg-white/10 animate-pulse ml-auto" /></div> : <><div className="flex items-center justify-between relative z-10"><h2 className="text-sm font-medium leading-5 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#55D889]" />Insight Penjualan</h2>{insight.persen !== null && <span className="rounded-full bg-white/15 px-2 py-1 text-[11px] font-medium">{insight.arah === 'down' ? '-' : '+'}{insight.persen}%</span>}</div><p className="text-[11px] font-normal text-white/75 leading-4 mt-3 relative z-10 max-w-[62%]">{insight.teks || 'Penjualan periode ini relatif stabil.'}</p><img src={`${A}/${insight.arah === 'down' ? 'img_grafik_down.png' : 'img_grafik_up.png'}`} alt="Insight penjualan" className="absolute right-3 bottom-2 w-[120px] h-[80px] object-contain object-right-bottom" /><Link href="/owner/laporan" className="inline-flex items-center gap-1 text-[11px] font-medium text-[#55D889] relative z-10">Lihat Laporan <ChevronRight className="w-3.5 h-3.5" /></Link></>}</section>

      <section className="rounded-[18px] bg-white p-4 shadow-sm"><div className="flex items-center justify-between mb-3"><h2 className="text-base font-medium leading-6 flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" />Produk Terlaris</h2><Link href="/owner/produk" className="text-[11px] font-medium text-[#0CAF60]">Lihat Semua →</Link></div>{isLoading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={`skel-${i}`} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0"><div className="w-7 h-7 rounded-lg bg-gray-100 animate-pulse" /><div className="w-9 h-9 rounded-lg bg-gray-100 animate-pulse" /><div className="flex-1 space-y-1.5"><div className="h-3 w-28 rounded bg-gray-100 animate-pulse" /><div className="h-2 w-16 rounded bg-gray-100 animate-pulse" /></div></div>)}</div> : dash.top_produk.length === 0 ? <p className="text-[10px] font-normal text-[#68758A] text-center py-4">Belum ada data produk pada periode ini.</p> : dash.top_produk.map((p, i) => <div key={p.produk_id} className="flex items-center gap-2.5 py-2 border-b last:border-0 border-gray-50"><span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium ${i === 0 ? 'bg-[#E8FAF0]' : i === 1 ? 'bg-[#FFF8D9]' : 'bg-[#FFF0E8]'}`}>{i + 1}</span>{p.foto_url ? <img src={p.foto_url} alt={p.nama} className="w-9 h-9 rounded-lg object-cover" /> : <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center"><PackagePlus className="w-4 h-4 text-gray-400" /></div>}<div className="flex-1"><p className="text-xs font-medium leading-4">{p.nama}</p><p className="text-[10px] font-normal text-[#68758A]">{Math.round(p.qty)} terjual</p></div></div>)}</section>
    </div>
  );
}
