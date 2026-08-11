'use client';

import React from 'react';
import { ShieldCheck, Bell, Sparkles, Menu } from 'lucide-react';
import { useAdminAuthStore } from '@/store/adminAuthStore';

export default function AdminHeader({ title = 'Master Control Hub', onOpenMobile }) {
  const { admin } = useAdminAuthStore();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 text-slate-100">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={onOpenMobile}
          className="md:hidden p-2 -ml-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white transition-all"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-slate-100 tracking-tight truncate">{title}</h1>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <Sparkles className="w-3 h-3" /> Live Engine v1.0
        </span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* Notification indicator */}
        <button className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-all relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-slate-900" />
        </button>

        {/* Profile info */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-100 leading-tight">{admin?.nama || 'Master Admin'}</p>
            <p className="text-[10px] text-emerald-400 font-medium">Full Access System</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
