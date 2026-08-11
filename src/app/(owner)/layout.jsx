'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OwnerLayout from '@/components/layout/owner/OwnerLayout';
import OwnerLayoutSkeleton from '@/components/layout/owner/OwnerLayoutSkeleton';
import { useAuthStore } from '@/store/authStore';

export default function OwnerRouteGroupLayout({ children }) {
  const router = useRouter();
  const { initAuth, user, token, isInitialized } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      if (!user || !token) {
        router.replace('/login');
      } else if (user.role !== 'owner') {
        router.replace('/login');
      }
    }
  }, [isInitialized, user, token, router]);

  if (!isInitialized) {
    // Skeleton layout langsung — gak nunggu auth, LCP lebih cepat
    // suppressHydrationWarning karena NK boleh beda dgn server
    return <OwnerLayoutSkeleton />;
  }

  if (!user || user.role !== 'owner') {
    return null;
  }

  return <OwnerLayout suppressHydrationWarning>{children}</OwnerLayout>;
}