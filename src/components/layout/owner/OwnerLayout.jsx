'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import OwnerNavbar from './OwnerNavbar';
import OwnerSidebar from './OwnerSidebar';
import OwnerBottomNav from './OwnerBottomNav';

const breadcrumbMap = {
  '/owner/dashboard': ['Dashboard'],
  '/owner/laporan': ['Laporan Keuangan'],
  '/owner/produk': ['Katalog & Harga'],
  '/owner/stock-adjustment': ['Tambah / Adjust Stok'],
  '/owner/pengaturan': ['Pengaturan & Staf'],
  '/owner/pos': ['Mode Kasir POS'],
};

export default function OwnerLayout({ children }) {
  const pathname = usePathname();
  const crumbs = breadcrumbMap[pathname] || [pathname.split('/').pop()?.replace(/-/g, ' ')];

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-gray-900 font-sans antialiased flex">
      {/* Desktop Sidebar */}
      <OwnerSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <OwnerNavbar />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-28 md:pb-8">
          {children}
        </main>
      </div>

      {/* Floating Bottom Nav for Mobile */}
      <OwnerBottomNav />
    </div>
  );
}
