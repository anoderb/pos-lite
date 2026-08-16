'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let client = null;

export function getSupabase() {
  if (!client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Konfigurasi Supabase belum diatur (.env.local)');
    }
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
