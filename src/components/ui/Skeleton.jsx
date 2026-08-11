import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable Loading Skeleton Component Template
 */
export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse bg-gray-200/80 rounded-xl', className)}
      {...props}
    />
  );
}
