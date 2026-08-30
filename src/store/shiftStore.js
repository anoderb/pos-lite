'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

/**
 * Store Shift — state shift kasir + guard navigasi/logout.
 * Alur:
 *  - fetchShift()  : cek shift aktif (buka/jeda) saat masuk /owner/*
 *  - requestNav()  : mau pindah halaman — kalau shift BUKA, wajib jeda/tutup dulu
 *  - requestLogout(): mau logout — kalau shift BUKA, wajib tutup dulu
 * Modal UI di ShiftGuardModal (OwnerLayout).
 */
export const useShiftStore = create((set, get) => ({
  shift: null,            // null | { id, status:'buka'|'jeda', modal_awal, waktu_buka, ... }
  isShiftLoading: true,   // loading awal
  guardOpen: false,       // modal guard navigasi/logout tampil?
  pendingNav: null,       // { href } tujuan setelah jeda/tutup
  pendingLogout: false,   // proses tutup karena logout
  tutupOpen: false,       // modal tutup shift (input kas_aktual + rekap)
  rekap: null,            // rekap shift detail (GET /shift/:id)
  rekapLoading: false,
  rekapError: null,
  kasAktual: '',          // input kas aktual
  catatan: '',

  // ── Fetch shift aktif (buka/jeda) ──
  fetchShift: async () => {
    try {
      const res = await api.get('/kasir/shift/aktif');
      const data = res?.data || res?.data?.data || res;
      const shiftData = data && data.id ? data : null;
      set({ shift: shiftData, isShiftLoading: false });
    } catch {
      set({ shift: null, isShiftLoading: false });
    }
  },

  // ── Buka shift baru ──
  bukaShift: async (modalAwal) => {
    const res = await api.post('/kasir/shift/buka', { modal_awal: Number(modalAwal) || 0 });
    const data = res?.data || res;
    if (!data?.id) throw new Error('Respons tidak valid');
    set({ shift: data });
    return data;
  },

  // ── Jeda shift ──
  jedaShift: async () => {
    const { shift } = get();
    if (!shift) return;
    const res = await api.post('/kasir/shift/jeda', {});
    const data = res?.data || res;
    set({ shift: data?.id ? { ...data } : { ...shift, status: 'jeda' } });
    return data;
  },

  // ── Lanjut shift (dari jeda) ──
  lanjutShift: async () => {
    const res = await api.post('/kasir/shift/lanjut', {});
    const data = res?.data || res;
    set({ shift: data?.id ? { ...data } : { ...get().shift, status: 'buka' } });
    return data;
  },

  // ── Tutup shift ──
  tutupShift: async ({ kasAktual, catatan }) => {
    const { shift } = get();
    if (!shift) throw new Error('Tidak ada shift aktif');
    const res = await api.post('/kasir/shift/tutup', {
      shift_id: shift.id,
      kas_aktual: Number(kasAktual) || 0,
      catatan: catatan || '',
    });
    const data = res?.data || res;
    set({ shift: data?.id ? data : null });
    return data;
  },

  // ── Ambil detail shift + rekap transaksi (GET /shift/:id) ──
  fetchRekap: async (shiftId) => {
    const res = await api.get(`/kasir/shift/${shiftId}`);
    const data = res?.data || res;
    set({ rekap: data, rekapLoading: false, rekapError: null });
    return data;
  },

  // ── Buka modal tutup setelah memuat rekap shift terbaru ──
  // Semua pemicu (POS, navbar, guard) wajib lewat action ini agar tidak ada
  // modal yang terbuka dengan rekap lama/kosong.
  openTutup: async (shiftId) => {
    const id = shiftId || get().shift?.id;
    if (!id) throw new Error('Tidak ada shift aktif');

    set({
      guardOpen: false,
      tutupOpen: true,
      rekap: null,
      rekapLoading: true,
      rekapError: null,
      kasAktual: '',
      catatan: '',
    });

    try {
      const data = await get().fetchRekap(id);
      return data;
    } catch (error) {
      set({ rekapLoading: false, rekapError: error?.message || 'Gagal mengambil rekap shift' });
      return null;
    }
  },

  // ── Request pindah halaman (nav guard) ──
  // Jika shift BUKA → buka modal; jika tidak/shift JEDA → langsung izinkan
  requestNav: (href) => {
    const { shift } = get();
    if (href === '/owner/pos') return true; // pindah ke POS selalu boleh
    if (shift && shift.status === 'buka') {
      set({ guardOpen: true, pendingNav: { href }, pendingLogout: false });
      return false;
    }
    return true;
  },

  // ── Batal tetap di POS (tutup modal guard) ──
  batalNav: () => set({ guardOpen: false, pendingNav: null, pendingLogout: false }),

  // ── Setelah guard (pilih aksi), lanjut navigasi ──
  selesaikanGuard: (href) => {
    set({ guardOpen: false, pendingNav: null, pendingLogout: false });
    if (href) window.location.href = href;
  },

  // ── Request logout: kalau shift BUKA → wajib tutup dulu, gak bisa bypass ──
  requestLogout: () => {
    const { shift } = get();
    if (shift && shift.status === 'buka') {
      set({ guardOpen: true, pendingNav: null, pendingLogout: true });
      return false;
    }
    return true; // tidak ada shift aktif → logout langsung
  },

  // Setter helper (dipakai ShiftGuardModal)
  setKasAktual: (v) => set({ kasAktual: v }),
  setCatatan: (v) => set({ catatan: v }),
  setTutupOpen: (v) => set({ tutupOpen: v, ...(v ? {} : { rekap: null, rekapLoading: false, rekapError: null }), kasAktual: '', catatan: '' }),
}));
