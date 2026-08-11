'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/admin/AdminLayout';
import Skeleton from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import { APP_NAME } from '@/lib/config';
import {
  Store,
  Users,
  FolderKanban,
  CheckSquare,
  Cpu,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Database,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const savedToken = localStorage.getItem('tokiva_admin_token');
      const res = await api.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.berhasil && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Tenant Toko',
      value: metrics?.toko?.total ?? 0,
      subtext: `${metrics?.toko?.total_pengguna ?? 0} Total Pengguna`,
      icon: Store,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Class Produk AI',
      value: metrics?.ai?.total_class ?? 0,
      subtext: 'Master Label Dataset AI',
      icon: FolderKanban,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Foto Dataset AI',
      value: (metrics?.ai?.total_foto_dataset ?? 0).toLocaleString('id-ID'),
      subtext: `${metrics?.ai?.total_koreksi_pending ?? 0} Koreksi Pending`,
      icon: Database,
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Versi Model AI Aktif',
      value: metrics?.ai?.model_aktif?.versi || '—',
      subtext: `Akurasi: ${((metrics?.ai?.model_aktif?.akurasi || 0) * 100).toFixed(1)}%`,
      icon: Cpu,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  // Skeleton untuk 4 KPI stat cards — biar LCP element langsung render (gak nunggu API)
  const renderStatCardSkeleton = () => (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24 bg-slate-700/50" />
            <Skeleton className="w-9 h-9 rounded-2xl bg-slate-700/50" />
          </div>
          <Skeleton className="h-7 w-20 bg-slate-700/50" />
          <Skeleton className="h-3 w-28 bg-slate-700/50" />
        </div>
      ))}
    </>
  );

  // Skeleton untuk AI Dataset Status mini-cards (3 kolom)
  const renderDatasetSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <Skeleton className="h-3 w-20 bg-slate-700/50" />
          <Skeleton className="h-5 w-24 bg-slate-700/50" />
          <Skeleton className="h-2.5 w-28 bg-slate-700/50" />
        </div>
      ))}
    </div>
  );

  return (
    <AdminLayout title="Executive SaaS & MLOps Dashboard">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/20">
                Master Control Active
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Selamat Datang di {APP_NAME} Master Hub 🚀
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Pusat kendali ekosistem SaaS {APP_NAME}, pemantauan {(metrics?.ai?.total_foto_dataset ?? 0).toLocaleString('id-ID')} foto AI visual recognition, dan live deployment model AI.
            </p>
          </div>

          <button
            onClick={fetchMetrics}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all shrink-0 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            renderStatCardSkeleton()
          ) : (
            statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                    <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${card.color} flex items-center justify-center shadow-lg text-slate-950`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-100 tracking-tight font-[family-name:var(--font-poppins)]">
                    {card.value}
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    {card.subtext}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Middle Section: Quick Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Dataset Status Card */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" /> AI Dataset & Model Status
                </h3>
                <p className="text-xs text-slate-400">Ringkasan MLOps visual recognition {APP_NAME}</p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                Live Deployment Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {isLoading ? (
                renderDatasetSkeleton()
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 block">Class Produk AI</span>
                    <span className="text-xl font-bold text-slate-100 mt-1 block">{metrics?.ai?.total_class ?? 0} Class</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Master Label Dataset</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 block">Dataset Foto</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{(metrics?.ai?.total_foto_dataset ?? 0).toLocaleString('id-ID')} Foto</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Hosted di HuggingFace Hub</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 block">Akurasi Model</span>
                    <span className="text-xl font-bold text-indigo-400 mt-1 block">{((metrics?.ai?.model_aktif?.akurasi || 0) * 100).toFixed(1)}%</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">{metrics?.ai?.model_aktif?.nama || '—'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" /> Aksi Cepat Master Admin
            </h3>

            <a
              href="/admin/data-collector"
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 text-xs font-semibold text-slate-200 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4 text-emerald-400" />
                <span>Galeri {(metrics?.ai?.total_foto_dataset ?? 0).toLocaleString('id-ID')} Foto AI</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </a>

            <a
              href="/admin/users"
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 text-xs font-semibold text-slate-200 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Kelola Tenant & Owner</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </a>

            <a
              href="/admin/model"
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 text-xs font-semibold text-slate-200 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Live Deployment Model AI</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
