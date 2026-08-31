'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    // SW hanya untuk production PWA. Di dev, cache-first chunk bisa menyajikan
    // modul stale ("module factory is not available") — jadi jangan register di dev.
    if (process.env.NODE_ENV !== 'production') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('[PWA] Service worker gagal didaftarkan:', err));
    }
  }, []);

  return null;
}
