'use client';

import React from 'react';
import PosEngine from '@/app/pos-engine';

/**
 * Dedicated Owner POS Direct Route (/owner/pos)
 * Reuses the shared POS engine (AI scanner + checkout) inside OwnerLayout.
 */
export default function OwnerPosPage() {
  return <PosEngine />;
}