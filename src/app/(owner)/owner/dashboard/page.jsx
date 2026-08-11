'use client';

import { lazy, Suspense } from 'react';

const DashboardContent = lazy(() => import('./DashboardContent'));

function DashboardSkeleton() {
  const SkeletonCard = ({ col = false }) => (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
      <div className="animate-pulse flex items-start justify-between">
        <div className="space-y-2 flex-1 mr-3">
          <div className="h-3 bg-gray-100 rounded w-20" />
          <div className="h-6 bg-gray-100 rounded w-28" />
          <div className="h-2 bg-gray-100 rounded w-14" />
        </div>
        <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
      </div>
    </div>
  );

  const SkeletonCardRow = () => (
    <div className="grid grid-cols-2 gap-3">
      <SkeletonCard /><SkeletonCard />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div className="space-y-2">
          <div className="h-5 bg-gray-100 rounded w-44" />
          <div className="h-3 bg-gray-50 rounded w-72" />
        </div>
        <div className="h-8 bg-gray-100 rounded-xl w-64" />
      </div>
      <SkeletonCardRow />
      <SkeletonCardRow />
      <div className="animate-pulse bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
        <div className="h-3 bg-gray-100 rounded w-36 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-3 bg-gray-100 rounded w-20" />
                <div className="h-2 bg-gray-50 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
