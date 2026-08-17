'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  PackagePlus,
  Grid,
  X,
  Settings,
  ShoppingCart,
  ScanBarcode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OwnerBottomNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const hide = () => setIsHidden(true);
    const show = () => setIsHidden(false);
    window.addEventListener('owner-nav-hide', hide);
    window.addEventListener('owner-nav-show', show);
    return () => {
      window.removeEventListener('owner-nav-hide', hide);
      window.removeEventListener('owner-nav-show', show);
    };
  }, []);

  const ownerDrawerItems = [
    {
      label: 'Tambah Stok',
      desc: 'Tambah & adjust stok manual (+/-)',
      href: '/owner/stock-adjustment',
      icon: PackagePlus,
      color: 'bg-emerald-50 text-[#16A34A]',
    },
    {
      label: 'Pengaturan Toko',
      desc: 'Profil toko & kelola staf kasir',
      href: '/owner/pengaturan',
      icon: Settings,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
        />
      )}

      {/* Drawer Menu Lainnya untuk Owner (Bottom Sheet - Full Edge to Edge) */}
      <div
        className={cn(
          'lg:hidden fixed left-0 right-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 p-5 transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto pb-36',
          isDrawerOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        )}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />
        <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">
          Menu Utama Owner
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {ownerDrawerItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsDrawerOpen(false)}
                className="p-4 bg-white border border-gray-100 hover:border-[#16A34A] shadow-xs rounded-2xl flex flex-col justify-between transition-all active:scale-[0.98] group"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', item.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#16A34A]">
                    {item.label}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 leading-tight">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Nav Bar with Elevated Center Hero POS Button */}
      <div className={cn(
        'lg:hidden fixed bottom-3 left-3 right-3 z-50 transition-transform duration-300 ease-out',
        isHidden && 'translate-y-[120%]'
      )}>
        <div className="bg-white/95 backdrop-blur-md border border-gray-100 shadow-xl rounded-2xl px-2 py-1.5 flex items-center justify-around relative">
          
          {/* 1. Dashboard */}
          <Link
            href="/owner/dashboard"
            onClick={() => setIsDrawerOpen(false)}
            className="flex flex-col items-center justify-center flex-1 py-1"
          >
            <div
              className={cn(
                'p-1.5 rounded-xl transition-all duration-150',
                pathname === '/owner/dashboard' ? 'bg-emerald-50 text-[#16A34A]' : 'text-gray-500'
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span
              className={cn(
                'text-[10px] font-bold mt-0.5',
                pathname === '/owner/dashboard' ? 'text-[#16A34A]' : 'text-gray-500'
              )}
            >
              Dashboard
            </span>
          </Link>

          {/* 2. Produk */}
          <Link
            href="/owner/produk"
            onClick={() => setIsDrawerOpen(false)}
            className="flex flex-col items-center justify-center flex-1 py-1"
          >
            <div
              className={cn(
                'p-1.5 rounded-xl transition-all duration-150',
                pathname === '/owner/produk' ? 'bg-emerald-50 text-[#16A34A]' : 'text-gray-500'
              )}
            >
              <Package className="w-5 h-5" />
            </div>
            <span
              className={cn(
                'text-[10px] font-bold mt-0.5',
                pathname === '/owner/produk' ? 'text-[#16A34A]' : 'text-gray-500'
              )}
            >
              Produk
            </span>
          </Link>

          {/* 3. HERO CENTER FLOATING POS ACTION BUTTON (MENONJOL NAIK KE ATAS) */}
          <div className="flex-1 flex flex-col items-center justify-center -mt-6">
            <Link
              href="/owner/pos"
              onClick={() => setIsDrawerOpen(false)}
              className={cn(
                'w-13 h-13 rounded-full text-white flex items-center justify-center shadow-lg border-4 border-[#F8FAF9] active:scale-90 transition-all',
                pathname === '/owner/pos'
                  ? 'bg-[#15803D] ring-2 ring-[#16A34A] shadow-emerald-700/50'
                  : 'bg-[#16A34A] shadow-emerald-600/40 hover:bg-[#15803D]'
              )}
              title="Direct Access Kasir POS Checkout"
            >
              <ScanBarcode className="w-6 h-6" />
            </Link>
            <span className={cn('text-[10px] font-semibold mt-0.5 tracking-tight', pathname === '/owner/pos' ? 'text-[#15803D]' : 'text-[#16A34A]')}>
              Kasir POS
            </span>
          </div>

          {/* 4. Laporan */}
          <Link
            href="/owner/laporan"
            onClick={() => setIsDrawerOpen(false)}
            className="flex flex-col items-center justify-center flex-1 py-1"
          >
            <div
              className={cn(
                'p-1.5 rounded-xl transition-all duration-150',
                pathname === '/owner/laporan' ? 'bg-emerald-50 text-[#16A34A]' : 'text-gray-500'
              )}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <span
              className={cn(
                'text-[10px] font-bold mt-0.5',
                pathname === '/owner/laporan' ? 'text-[#16A34A]' : 'text-gray-500'
              )}
            >
              Laporan
            </span>
          </Link>

          {/* 5. Drawer Toggle (Lainnya) */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="flex flex-col items-center justify-center flex-1 py-1 focus:outline-none"
          >
            <div
              className={cn(
                'p-1.5 rounded-xl transition-all duration-200',
                isDrawerOpen
                  ? 'bg-[#16A34A] text-white shadow-md rotate-90'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {isDrawerOpen ? <X className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </div>
            <span
              className={cn(
                'text-[10px] font-bold mt-0.5',
                isDrawerOpen ? 'text-[#16A34A]' : 'text-gray-500'
              )}
            >
              {isDrawerOpen ? 'Tutup' : 'Lainnya'}
            </span>
          </button>

        </div>
      </div>
    </>
  );
}
