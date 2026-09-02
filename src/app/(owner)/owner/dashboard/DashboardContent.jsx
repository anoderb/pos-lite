'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarDays, ChevronDown, ChevronRight, Crown, PackagePlus,
  Plus, ScanLine, Settings, ShoppingCart, TrendingUp, TrendingDown,
  WalletCards, AlertTriangle, BarChart3, Minus,
} from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { useDashboard } from './_hooks/useDashboard';

const A = '/assets/tokiva-dashboard';
const ASSET = '/assets/tokiva-dashboard';

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

const SLIDES = [
  {
    img: `${ASSET}/img-pos-3d.png`,
    title: 'Kasir Lebih Cepat',
    desc: 'Scan produk otomatis dengan computer vision.',
    href: '/owner/pos',
    cta: 'Buka Kasir',
  },
  {
    img: `${ASSET}/img-stock-3d.png`,
    title: 'Stok Terpantau',
    desc: 'Pantau stok real-time, anti kehabisan barang.',
    href: '/owner/stock-adjustment',
    cta: 'Kelola Stok',
  },
  {
    img: `${ASSET}/img-laporan-3d.png`,
    title: 'Laporan Lengkap',
    desc: 'Laporan keuangan & penjualan detail per periode.',
    href: '/owner/laporan',
    cta: 'Lihat Laporan',
  },
];

/* ---------- Line chart REAL — semua titik, label sparse (HTML, tidak stretch) ---------- */
function RevenueChart({ data }) {
  const pts = Array.isArray(data) && data.length > 0 ? data : [];
  const values = pts.map((p) => Number(p.nilai || 0));
  const max = Math.max(...values, 1);
  const W = 200;
  const H = 56;
  const step = pts.length > 1 ? W / (pts.length - 1) : W;
  const coords = pts.map((p, i) => {
    const y = H - (Number(p.nilai || 0) / max) * (H - 6);
    return [i * step, Math.max(3, Math.min(H - 3, y))];
  });
  const poly = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const hasSales = values.some((v) => v > 0);

  // sparse label: maks ~7 label, selalu include pertama & terakhir
  const maxLabels = 7;
  const labelStep = Math.max(1, Math.ceil(pts.length / maxLabels));
  const labelIdx = [];
  for (let i = 0; i < pts.length; i += labelStep) labelIdx.push(i);
  if (labelIdx[labelIdx.length - 1] !== pts.length - 1) labelIdx.push(pts.length - 1);
  const showDots = pts.length <= 24;

  return (
    <div className="absolute left-4 right-4 bottom-3 h-[74px] z-0">
      <div className="relative w-full h-[56px]">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full overflow-visible" aria-label="Grafik omset">
          <defs>
            <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity=".22" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          {hasSales ? (
            <>
              <polyline points={`${poly} ${W},${H} 0,${H}`} fill="url(#revenueFill)" stroke="none" />
              <polyline points={poly} fill="none" stroke="white" strokeOpacity=".86" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {showDots && coords.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="1.6" fill="white" fillOpacity=".9" />
              ))}
            </>
          ) : (
            <line x1="0" y1={H} x2={W} y2={H} stroke="white" strokeOpacity=".25" strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeDasharray="3 4" />
          )}
        </svg>
        {/* label HTML di posisi persentase — tidak ikut stretch */}
        {pts.length > 1 && labelIdx.map((i) => {
          const pct = (i / (pts.length - 1)) * 100;
          const anchor = i === 0 ? 'left' : i === pts.length - 1 ? 'right' : 'center';
          return (
            <span
              key={`lb-${i}`}
              className="absolute -bottom-4 text-[8px] leading-none text-white/55 whitespace-nowrap"
              style={{
                left: `${pct}%`,
                transform: anchor === 'left' ? 'none' : anchor === 'right' ? 'translateX(-100%)' : 'translateX(-50%)',
              }}
            >
              {pts[i].bucket}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Mini bar chart transaksi ---------- */
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

/* ---------- Carousel 3 slide: infinite loop smooth, auto 4s, drag/swipe manual ---------- */
function HeroCarousel() {
  const n = SLIDES.length;
  // clone: [last, ...slides, first] → idx 1..n = slide asli, 0 & n+1 = clone utk loop mulus
  const slides = [SLIDES[n - 1], ...SLIDES, SLIDES[0]];
  const [idx, setIdx] = useState(1);
  const [noTransition, setNoTransition] = useState(false);
  const [paused, setPaused] = useState(false);
  const dragStart = useRef(null);

  const go = (dir) => setIdx((v) => v + dir);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((v) => v + 1), 4000);
    return () => clearInterval(t);
  }, [paused]);

  // saat sampai clone, lompat diam-diam ke posisi asli tanpa transisi
  const handleTransitionEnd = () => {
    if (idx === 0 || idx === n + 1) {
      setNoTransition(true);
      setIdx(idx === 0 ? n : 1);
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
    }
  };

  const handlePointerDown = (e) => {
    dragStart.current = e.clientX;
    setPaused(true);
  };
  const handlePointerUp = (e) => {
    if (dragStart.current !== null) {
      const dx = e.clientX - dragStart.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    }
    dragStart.current = null;
    setPaused(false);
  };

  const activeIdx = idx === 0 ? n - 1 : idx === n + 1 ? 0 : idx - 1;

  return (
    <section
      className="relative overflow-hidden rounded-[22px] min-h-[190px] lg:min-h-[230px] bg-gradient-to-br from-[#E8FAF0] via-[#F5FFF7] to-[#FFF8D9] shadow-[0_2px_10px_rgba(16,35,62,.05)] select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => { dragStart.current = null; setPaused(false); }}
    >
      {/* track */}
      <div
        className="flex h-full"
        style={{
          transform: `translateX(-${idx * 100}%)`,
          transition: noTransition ? 'none' : 'transform 500ms ease-out',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {slides.map((s, i) => (
          <div key={i} className="relative w-full shrink-0 min-h-[190px] lg:min-h-[230px] p-4 lg:p-6">
            <div className="relative z-10 max-w-[56%] lg:max-w-[52%]">
              <p className="text-[11px] text-[#68758A] font-normal leading-4">Selamat datang kembali 👋</p>
              <h2 className="text-[19px] lg:text-[24px] leading-6 lg:leading-7 font-medium tracking-[-0.3px] mt-1.5">{s.title}</h2>
              <p className="text-[11px] lg:text-xs text-[#68758A] leading-4 mt-2 font-normal">{s.desc}</p>
              <Link
                href={s.href}
                className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 rounded-xl bg-[#0CAF60] text-white text-[11px] font-medium shadow-sm hover:bg-[#0a9b55] transition-colors"
              >
                {s.cta} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="absolute right-2 lg:right-6 bottom-2 w-[42%] lg:w-[38%] h-[72%]">
              <img src={s.img} alt={s.title} className="w-full h-full object-contain object-center" />
            </div>
          </div>
        ))}
      </div>

      {/* dots */}
      <div className="absolute left-4 bottom-3 z-20 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i + 1); setPaused(true); setTimeout(() => setPaused(false), 6000); }}
            aria-label={`Slide ${i + 1}`}
            className={cn('h-1.5 rounded-full transition-all', i === activeIdx ? 'w-5 bg-[#0CAF60]' : 'w-1.5 bg-[#B8E8CC] hover:bg-[#8fd8ae]')}
          />
        ))}
      </div>
    </section>
  );
}

/* ---------- Pill pertumbuhan: hijau naik / merah turun / abu stabil ---------- */
function GrowthPill({ growth, prevLabel }) {
  if (growth === null || growth === undefined) return null;
  const up = growth > 0;
  const down = growth < 0;
  return (
    <span
      className={cn(
        'inline-flex items-center mt-2 rounded-full px-2 py-1 text-[10px] font-medium leading-4',
        down ? 'bg-[#D94850] text-white' : 'bg-white/15 text-white'
      )}
    >
      {up ? <TrendingUp className="w-3 h-3 mr-1" /> : down ? <TrendingDown className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
      {down ? '-' : up ? '+' : ''}{Math.abs(growth)}%
      <em className="not-italic font-normal ml-1 opacity-75">{down || up ? `dari ${prevLabel}` : 'stabil'}</em>
    </span>
  );
}

export default function DashboardContent() {
  const {
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
  } = useDashboard();

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const growth = dash.growth_persen;
  const insight = dash.insight || { arah: 'stable', persen: null, teks: '' };
  const prevLabel = customRange
    ? 'periode sebelumnya'
    : periodeFilter === 'hari_ini' ? 'kemarin' : periodeFilter === 'minggu_ini' ? 'minggu lalu' : 'bulan lalu';
  const todayLabel = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const activeLabel = customRange ? `${customRange.mulai} → ${customRange.selesai}` : todayLabel;


  return (
    <div className="max-w-[430px] lg:max-w-none mx-auto space-y-4 pb-24 lg:pb-8 text-[#10233E]">
      {error && <p className="text-[11px] font-normal text-[#D94850] bg-[#FFF0F0] rounded-xl px-3 py-2">{error}</p>}

      {/* Filter periode */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar overscroll-x-contain">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => pickPeriod(p.id)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium leading-4 transition-all',
                !customRange && periodeFilter === p.id ? 'bg-[#0CAF60] text-white shadow-sm' : 'bg-white text-[#68758A] shadow-sm hover:bg-[#E8FAF0]'
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" />{p.label}
            </button>
          ))}
          <button
            onClick={() => setRangeOpen((v) => !v)}
            className={cn(
              'ml-auto shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white text-xs font-medium leading-4 shadow-sm transition-all',
              customRange ? 'text-[#0CAF60] ring-1 ring-[#0CAF60]' : 'text-[#68758A]'
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />{activeLabel}<ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* popover pilih rentang tanggal manual — di luar container overflow */}
        {rangeOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setRangeOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-40 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 space-y-2">
              <p className="text-xs font-semibold text-[#10233E]">Pilih Rentang Tanggal</p>
              <label className="block text-[10px] text-[#68758A]">Mulai
                <input type="date" value={rangeDraft.mulai} onChange={(e) => setRangeDraft((d) => ({ ...d, mulai: e.target.value }))} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#0CAF60]" />
              </label>
              <label className="block text-[10px] text-[#68758A]">Selesai
                <input type="date" value={rangeDraft.selesai} onChange={(e) => setRangeDraft((d) => ({ ...d, selesai: e.target.value }))} className="mt-1 w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#0CAF60]" />
              </label>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setRangeOpen(false)} className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[#68758A] bg-gray-50 hover:bg-gray-100">Batal</button>
                <button onClick={applyRange} disabled={!rangeDraft.mulai || !rangeDraft.selesai} className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium text-white bg-[#0CAF60] hover:bg-[#0a9b55] disabled:opacity-40">Terapkan</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Grid responsif */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-4">
        {/* Carousel banner */}
        <div className="lg:col-span-5"><HeroCarousel /></div>

        {/* Total Omset + chart */}
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-[18px] p-4 lg:p-5 min-h-[190px] lg:min-h-[230px] text-white bg-gradient-to-br from-[#0CAF60] to-[#087A4B] shadow-[0_2px_10px_rgba(16,35,62,.05)] h-full">
            {isLoading ? (
              <div className="relative z-10 w-full space-y-2">
                <div className="h-3 w-20 rounded-md bg-white/25 animate-pulse" />
                <div className="h-7 w-32 rounded-md bg-white/25 animate-pulse" />
                <div className="h-4 w-24 rounded-full bg-white/20 animate-pulse" />
                <div className="h-12 w-full rounded-lg bg-white/10 animate-pulse mt-2" />
              </div>
            ) : (
              <>
                <div className="relative z-10 lg:w-[58%]">
                  <p className="text-xs font-medium leading-4 text-white/80">Total Omset</p>
                  <p className="text-[28px] lg:text-[34px] font-medium leading-8 lg:leading-10 tracking-[-0.4px] mt-1">{formatRupiah(dash.omzet)}</p>
                  <GrowthPill growth={growth} prevLabel={prevLabel} />
                </div>
                <div className="absolute right-3 top-4 w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center z-10"><WalletCards className="w-5 h-5" /></div>
                <RevenueChart data={dash.chart_omzet} />
              </>
            )}
          </div>
        </div>

        {/* KPI: Laba + Transaksi + Stok Kritis + QRIS Pending */}
        <div className="lg:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-[16px] p-3 min-h-[112px] bg-[#EAF3FF] shadow-sm">
            {isLoading ? (
              <div className="space-y-2"><div className="flex justify-between"><div className="h-3 w-16 rounded bg-blue-200/70 animate-pulse" /><div className="h-5 w-5 rounded bg-blue-200/70 animate-pulse" /></div><div className="h-6 w-20 rounded bg-blue-200/70 animate-pulse" /><div className="h-2.5 w-14 rounded bg-blue-200/60 animate-pulse" /></div>
            ) : (
              <>
                <div className="flex justify-between"><p className="text-xs font-medium leading-4">Laba Bersih Est.</p><WalletCards className="w-5 h-5 text-blue-500" /></div>
                <p className="text-[23px] font-medium leading-7 mt-2">{dash.hpp_lengkap ? formatRupiah(dash.estimasi_laba) : '—'}</p>
                <p className="text-[10px] font-normal text-blue-600 mt-1">{dash.hpp_lengkap ? `Margin ${dash.margin_persen}%` : 'Data laba belum tersedia'}</p>
              </>
            )}
          </div>
          <div className="rounded-[16px] p-3 min-h-[112px] bg-[#F3EEFF] shadow-sm">
            {isLoading ? (
              <div className="space-y-2"><div className="flex justify-between"><div className="h-3 w-16 rounded bg-violet-200/70 animate-pulse" /><div className="h-5 w-5 rounded bg-violet-200/70 animate-pulse" /></div><div className="h-6 w-20 rounded bg-violet-200/70 animate-pulse" /><div className="h-8 w-full rounded bg-violet-200/50 animate-pulse" /></div>
            ) : (
              <>
                <div className="flex justify-between"><p className="text-xs font-medium leading-4">Transaksi</p><ShoppingCart className="w-5 h-5 text-violet-500" /></div>
                <p className="text-[23px] font-medium leading-7 mt-2">{dash.total_transaksi} Struk</p>
                <p className="text-[10px] font-normal text-violet-600 mt-1">Rata-rata {formatRupiah(Math.round(dash.rata_rata_tx))}/tx</p>
                <TxBars data={dash.chart_transaksi} />
              </>
            )}
          </div>
          <div className="col-span-2 lg:col-span-1 rounded-[16px] p-3 min-h-[112px] bg-[#FFF0F0] shadow-sm flex items-center gap-3">
            {isLoading ? (
              <div className="flex-1 space-y-2"><div className="h-3 w-20 rounded bg-[#F5C6C9] animate-pulse" /><div className="h-6 w-24 rounded bg-[#F5C6C9] animate-pulse" /><div className="h-2.5 w-32 rounded bg-[#F5C6C9] animate-pulse" /></div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-white text-[#F05B61] flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-4 text-[#D94850]">Stok Kritis</p>
                  <p className="text-[22px] font-medium leading-7">{dash.total_stok_kritis} Produk</p>
                  <Link href="/owner/produk" className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D94850] hover:underline">Kelola <ChevronRight className="w-3 h-3" /></Link>
                </div>
              </>
            )}
          </div>

          {/* Kartu QRIS Pending */}
          <div className="col-span-2 lg:col-span-1 rounded-[16px] p-3 min-h-[112px] bg-[#FFF8D9] shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#D97706] flex items-center justify-center shrink-0"><ScanLine className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-4 text-[#B45309]">QRIS Pending</p>
              <p className="text-[22px] font-medium leading-7">{pendingTotal} Transaksi</p>
              <Link href="/owner/pos" className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B45309] hover:underline">Approve <ChevronRight className="w-3 h-3" /></Link>
            </div>
          </div>
        </div>

        {/* Aksi Cepat */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-medium leading-6">Aksi Cepat</h2>
            <Link href="/owner/produk" className="text-[11px] font-medium text-[#0CAF60] flex items-center">Lihat Semua <ChevronRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[[Plus, 'Tambah Produk', '/owner/produk', 'bg-[#E8FAF0] text-[#0CAF60]'], [PackagePlus, 'Tambah Stok', '/owner/stock-adjustment', 'bg-[#FFF8D9] text-amber-600'], [ScanLine, 'Mode Kasir POS', '/owner/pos', 'bg-[#EAF3FF] text-blue-600'], [Settings, 'Pengaturan Toko', '/owner/pengaturan', 'bg-[#F3EEFF] text-violet-600']].map(([Icon, label, href, color]) => (
              <Link key={label} href={href} className="bg-white rounded-[16px] p-3 flex items-center gap-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></span>
                <span className="text-xs font-medium leading-4">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Insight Penjualan */}
        <div className="lg:col-span-7">
          <div className={`relative overflow-hidden rounded-[18px] p-4 text-white shadow-sm h-full min-h-[140px] ${insight.arah === 'down' ? 'bg-[#7A2E33]' : 'bg-[#123C42]'}`}>
            {isLoading ? (
              <div className="space-y-3 relative z-10"><div className="flex items-center justify-between"><div className="h-3.5 w-28 rounded bg-white/20 animate-pulse" /><div className="h-4 w-14 rounded-full bg-white/15 animate-pulse" /></div><div className="h-2.5 w-40 rounded bg-white/15 animate-pulse" /><div className="h-2.5 w-32 rounded bg-white/15 animate-pulse" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between relative z-10">
                  <h2 className="text-sm font-medium leading-5 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#55D889]" />Insight Penjualan</h2>
                  {insight.persen !== null && <span className={cn('rounded-full px-2 py-1 text-[11px] font-medium', insight.arah === 'down' ? 'bg-[#D94850]' : 'bg-white/15')}>{insight.arah === 'down' ? '-' : '+'}{insight.persen}%</span>}
                </div>
                <p className="text-[11px] font-normal text-white/75 leading-4 mt-3 relative z-10 max-w-[62%]">{insight.teks || 'Penjualan periode ini relatif stabil.'}</p>
                <img src={`${A}/${insight.arah === 'down' ? 'img_grafik_down.png' : 'img_grafik_up.png'}`} alt="Insight penjualan" className="absolute right-3 bottom-2 w-[120px] h-[80px] object-contain object-right-bottom" />
                <Link href="/owner/laporan" className="inline-flex items-center gap-1 text-[11px] font-medium text-[#55D889] relative z-10 mt-2">Lihat Laporan <ChevronRight className="w-3.5 h-3.5" /></Link>
              </>
            )}
          </div>
        </div>

        {/* Produk Terlaris */}
        <div className="lg:col-span-12">
          <div className="rounded-[18px] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-medium leading-6 flex items-center gap-2"><Crown className="w-4 h-4 text-amber-500" />Produk Terlaris</h2>
              <Link href="/owner/produk" className="text-[11px] font-medium text-[#0CAF60]">Lihat Semua →</Link>
            </div>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (
                <div key={`skel-${i}`} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 animate-pulse" /><div className="w-9 h-9 rounded-lg bg-gray-100 animate-pulse" />
                  <div className="flex-1 space-y-1.5"><div className="h-3 w-28 rounded bg-gray-100 animate-pulse" /><div className="h-2 w-16 rounded bg-gray-100 animate-pulse" /></div>
                </div>
              ))}</div>
            ) : dash.top_produk.length === 0 ? (
              <p className="text-[10px] font-normal text-[#68758A] text-center py-4">Belum ada data produk pada periode ini.</p>
            ) : (
              <>
                {/* list (mobile) */}
                <div className="lg:hidden">
                  {dash.top_produk.map((p, i) => (
                    <div key={p.produk_id} className="flex items-center gap-2.5 py-2 border-b last:border-0 border-gray-50">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium ${i === 0 ? 'bg-[#E8FAF0]' : i === 1 ? 'bg-[#FFF8D9]' : 'bg-[#FFF0E8]'}`}>{i + 1}</span>
                      {p.foto_url ? <img src={p.foto_url} alt={p.nama} className="w-9 h-9 rounded-lg object-cover" /> : <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center"><PackagePlus className="w-4 h-4 text-gray-400" /></div>}
                      <div className="flex-1"><p className="text-xs font-medium leading-4">{p.nama}</p><p className="text-[10px] font-normal text-[#68758A]">{Math.round(p.qty)} terjual</p></div>
                      <p className="text-xs font-medium text-[#0CAF60]">{formatRupiah(Math.round(p.omzet))}</p>
                    </div>
                  ))}
                </div>
                {/* tabel (desktop) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-[#68758A] border-b border-gray-100">
                        <th className="py-2 pr-3 font-semibold">#</th>
                        <th className="py-2 pr-3 font-semibold">Produk</th>
                        <th className="py-2 pr-3 font-semibold text-right">Terjual</th>
                        <th className="py-2 font-semibold text-right">Omset</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dash.top_produk.map((p, i) => (
                        <tr key={p.produk_id} className="border-b last:border-0 border-gray-50 hover:bg-gray-50/60 transition-colors">
                          <td className="py-2.5 pr-3"><span className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs font-medium ${i === 0 ? 'bg-[#E8FAF0]' : i === 1 ? 'bg-[#FFF8D9]' : 'bg-[#FFF0E8]'}`}>{i + 1}</span></td>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2.5">
                              {p.foto_url ? <img src={p.foto_url} alt={p.nama} className="w-9 h-9 rounded-lg object-cover" /> : <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center"><PackagePlus className="w-4 h-4 text-gray-400" /></div>}
                              <span className="text-xs font-medium">{p.nama}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 text-right text-xs font-medium">{Math.round(p.qty)}</td>
                          <td className="py-2.5 text-right text-xs font-semibold text-[#0CAF60]">{formatRupiah(Math.round(p.omzet))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}