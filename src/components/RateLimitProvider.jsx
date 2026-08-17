'use client';

import React, { useEffect } from 'react';
import { toast } from '@/components/ui/ToastProvider';

export default function RateLimitProvider({ children }) {
  useEffect(() => {
    const handler = (e) => toast.error(
      e.detail?.retryAfter
        ? `Silakan tunggu ${e.detail.retryAfter} detik sebelum mencoba lagi.`
        : 'Terlalu banyak permintaan dalam waktu singkat. Silakan tunggu beberapa saat.',
      { title: 'Terlalu Banyak Permintaan' }
    );
    window.addEventListener('rate-limited', handler);
    return () => window.removeEventListener('rate-limited', handler);
  }, []);

  return children;
}
