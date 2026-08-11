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
          {/* Breadcrumb Navigation (FIX-11) */}
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/owner/dashboard" className="hover:text-[#16A34A] transition-colors">
              Dashboard
            </Link>
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="text-gray-300">›</span>
                <span className={i === crumbs.length - 1 ? 'text-gray-700 font-semibold' : ''}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>

          {children}
        </main>
      </div>

      {/* Floating Bottom Nav for Mobile */}
      <OwnerBottomNav />
    </div>
  );
}
