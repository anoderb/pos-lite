'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  PackagePlus,
  ScanBarcode,
  Settings,
  LogOut,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { APP_NAME } from '@/lib/config';

export default function OwnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, toko, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const menuGroups = [
    {
      title: 'KASIR & TRANSAKSI',
      items: [
        { label: '🛒 Mode Kasir POS', href: '/owner/pos', icon: ScanBarcode, isHighlight: true },
      ],
    },
    {
      title: 'UTAMA',
      items: [
        { label: 'Executive Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
        { label: 'Laporan Keuangan', href: '/owner/laporan', icon: TrendingUp },
      ],
    },
    {
      title: 'PRODUK & INVENTARIS',
      items: [
        { label: 'Katalog & Harga', href: '/owner/produk', icon: Package },
        { label: 'Tambah / Adjust Stok', href: '/owner/stock-adjustment', icon: PackagePlus },
      ],
    },
    {
      title: 'SISTEM',
      items: [
        { label: 'Pengaturan & Staf', href: '/owner/pengaturan', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen sticky top-0 h-screen select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2.5 bg-[#16A34A] text-white rounded-2xl shadow-sm shrink-0">
          <Store className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 truncate">
            {toko?.nama || APP_NAME}
          </h2>
          <p className="text-[11px] font-semibold text-[#15803D] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Owner Portal
          </p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-gray-500 tracking-wider">
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/owner/dashboard' && pathname.startsWith(item.href + '/'));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-[#16A34A] text-white shadow-sm font-bold'
                      : 'text-gray-600 hover:bg-emerald-50 hover:text-[#16A34A]'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-gray-100">
        <div className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.nama ? user.nama[0].toUpperCase() : 'O'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">
                {user?.nama || 'Pemilik Toko'}
              </p>
              <p className="text-[10px] text-gray-500 truncate">Owner Account</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-500 hover:text-[#EF4444] rounded-lg transition-colors"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
