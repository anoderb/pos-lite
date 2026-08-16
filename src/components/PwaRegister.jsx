'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* gagal daftar SW tidak memblokir aplikasi */
      });
    }
  }, []);

  return null;
}
