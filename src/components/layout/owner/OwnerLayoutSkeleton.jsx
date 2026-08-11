'use client';

import React from 'react';
import OwnerSidebar from './OwnerSidebar';
import OwnerBottomNav from './OwnerBottomNav';

export default function OwnerLayoutSkeleton({ children }) {
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-gray-900 font-sans antialiased flex">
      {/* Desktop Sidebar — skeleton */}
      <OwnerSidebar suppressHydrationWarning />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar — skeleton */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Page Content — skeleton */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children || (
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
              {/* Header skeleton */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-100 rounded w-44 animate-pulse" />
                  <div className="h-3 bg-gray-50 rounded w-72 animate-pulse" />
                </div>
                <div className="h-8 bg-gray-100 rounded-xl w-64 animate-pulse" />
              </div>

              {/* KPI cards skeleton */}
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
                    <div className="animate-pulse flex items-start justify-between">
                      <div className="space-y-2 flex-1 mr-3">
                        <div className="h-3 bg-gray-100 rounded w-20" />
                        <div className="h-6 bg-gray-100 rounded w-28" />
                        <div className="h-2 bg-gray-100 rounded w-14" />
                      </div>
                      <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Nav */}
        <OwnerBottomNav suppressHydrationWarning />
      </div>
    </div>
  );
}