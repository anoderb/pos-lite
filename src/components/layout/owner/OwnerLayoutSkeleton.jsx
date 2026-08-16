'use client';

import React from 'react';

// Minimal neutral shell saat auth init — BUKAN skeleton dashboard lama.
// Render sama di server & client agar tidak ada hydration mismatch.
export default function OwnerLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
      <div className="space-y-3 w-44">
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  );
}
