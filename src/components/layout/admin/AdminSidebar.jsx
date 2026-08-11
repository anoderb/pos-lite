'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  RefreshCw,
  Cpu,
  FileText,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HF_DATASET_URL, APP_NAME } from '@/lib/config';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export default function AdminSidebar({ mobileOpen = false, onCloseMobile }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logoutAdmin } = useAdminAuthStore();

  const handleLogout = () => {
    logoutAdmin();
    router.replace('/admin/login');
  };

  const menuGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Executive Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'SAAS TENANT MANAGEMENT',
      items: [
        { label: 'Daftar Tenant & Owner', href: '/admin/users', icon: Users },
      ],
    },
    {
      title: 'AI MLOPS & DATASET PIPELINE',
      items: [
        { label: 'Data Collector & Class', href: '/admin/data-collector', icon: FolderKanban },
        { label: 'Kurasi Koreksi Kasir', href: '/admin/kurasi', icon: CheckSquare },
        { label: 'AI Model Deployment', href: '/admin/model', icon: Cpu },
      ],
    },
    {
      title: 'SYSTEM AUDIT',
      items: [
        { label: 'Audit Trail Logs', href: '/admin/log', icon: FileText },
      ],
    },
  ];

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <ShieldCheck className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-none">
                {APP_NAME}<span className="text-emerald-400">Admin</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block mt-0.5">
                Master Control Hub
              </span>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Admin Badge */}
        <div className="mx-3 my-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
            MA
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-100 truncate leading-tight">{admin?.nama || 'Master Admin'}</p>
            <p className="text-[10px] text-emerald-400 font-medium truncate mt-0.5">Master Control Role</p>
          </div>
        </div>

        {/* Navigation Menu Groups */}
        <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-190px)]">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group',
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 font-semibold ring-1 ring-emerald-500/20'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            'w-4 h-4 transition-colors',
                            isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer & Logout */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950/40">
        <a
          href={HF_DATASET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
        >
          <span className="truncate">HuggingFace Dataset</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </a>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Master Admin</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
        />
      )}

      {/* Mobile drawer (slide-in) */}
      <aside
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-200 select-none transition-transform duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0 min-h-screen text-slate-200 select-none">
        {sidebarContent}
      </aside>
    </>
  );
}
