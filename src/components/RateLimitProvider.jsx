'use client';

import React, { useEffect, useState, useCallback } from 'react';
import FeedbackModal from './ui/FeedbackModal';

/**
 * Global rate-limit handler. Auto-subscribes to window 'rate-limited' event.
 * Place once in root layout under <body>.
 */
export default function RateLimitProvider({ children }) {
  const [rateLimit, setRateLimit] = useState(null);

  const dismiss = useCallback(() => setRateLimit(null), []);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.retryAfter) {
        setRateLimit({
          title: 'Terlalu Banyak Permintaan',
          message: `Anda terkena batas kecepatan (rate limit). Silakan tunggu ${e.detail.retryAfter} detik sebelum mencoba lagi.`,
        });
      } else {
        setRateLimit({
          title: 'Terlalu Banyak Permintaan',
          message: 'Terlalu banyak permintaan dalam waktu singkat. Silakan tunggu beberapa saat dan coba lagi.',
        });
      }
    };

    window.addEventListener('rate-limited', handler);
    return () => window.removeEventListener('rate-limited', handler);
  }, []);

  return (
    <>
      {children}
      <FeedbackModal
        isOpen={!!rateLimit}
        onClose={dismiss}
        type="error"
        title={rateLimit?.title}
        message={rateLimit?.message}
        buttonText="Tutup"
      />
    </>
  );
}