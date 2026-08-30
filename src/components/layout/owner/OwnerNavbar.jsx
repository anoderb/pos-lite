'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, Store, ShieldCheck, Settings, LogOut, Pause, Play, ScanBarcode } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useShiftStore } from '@/store/shiftStore';
import { APP_NAME } from '@/lib/config';

export default function OwnerNavbar() {
  const router = useRouter();
  const { user, toko, logout } = useAuthStore();
  const requestLogout = useShiftStore((s) => s.requestLogout);
  const shift = useShiftStore((s) => s.shift);
  const fetchShift = useShiftStore((s) => s.fetchShift);
  const lanjutShift = useShiftStore((s) => s.lanjutShift);
  const openTutup = useShiftStore((s) => s.openTutup);
  const [isOnline, setIsOnline] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    fetchShift();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLanjutkanShift = async () => {
    try {
      setResumeLoading(true);
      await lanjutShift();
      // Shift buka lagi → langsung ke POS
      router.push('/owner/pos');
    } catch {
      setResumeLoading(false);
    }
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    // Kalau shift aktif → wajib tutup dulu (modal), gak bisa logout langsung
    const ok = requestLogout();
    if (ok) {
      await logout();
      router.replace('/login');
    }
  };

  return (
    <header className="h-[68px] bg-white border-b border-gray-100 px-4 sm:px-5 sticky top-0 z-30 flex items-center justify-between">
      {/* Brand Header Owner */}
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-[#E8FAF0] rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
          {toko?.logo_url ? (
            <img src={toko.logo_url} alt={toko?.nama || 'Logo toko'} className="w-full h-full object-cover" />
          ) : (
            <Store className="w-[18px] h-[18px] text-[#0CAF60]" />
          )}
        </div>
        <div>
          <h1 className="text-[16px] font-semibold leading-5 text-gray-900 truncate">
            {toko?.nama || APP_NAME}
          </h1>
          <p className="text-[11px] font-normal leading-4 text-[#0CAF60] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Owner Portal
          </p>
        </div>
      </div>

      {/* Connection & Owner Pill */}
      <div className="flex items-center space-x-3">
        <div
          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-[11px] font-medium border ${
            isOnline
              ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Shift Badge — jeda = amber + tombol Lanjutkan; buka = hijau indikator */}
        {shift?.status === 'jeda' && (
          <div className="flex items-center gap-1.5">
            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
              title={`Shift dijeda sejak ${shift.waktu_jeda ? new Date(shift.waktu_jeda).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WIB`}
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shift Dijeda</span>
              <span suppressHydrationWarning>
                {shift.waktu_jeda ? new Date(shift.waktu_jeda).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </span>
            <button
              onClick={handleLanjutkanShift}
              disabled={resumeLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#0CAF60] text-white hover:bg-[#087A4B] transition-colors active:scale-95 disabled:opacity-60"
              title="Lanjutkan shift & kembali ke POS"
            >
              <Play className="w-3 h-3" />
              <span className="hidden sm:inline">Lanjutkan</span>
            </button>
            <button
              onClick={() => openTutup()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-[#D94850] hover:bg-[#FFF0F0] transition-colors"
              title="Tutup shift & rekap kas"
            >
              <ScanBarcode className="w-3 h-3" />
            </button>
          </div>
        )}
        {shift?.status === 'buka' && (
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-[#16A34A] border border-emerald-200"
            title={`Shift aktif sejak ${shift.waktu_buka ? new Date(shift.waktu_buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WIB`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#0CAF60] animate-pulse" />
            <span className="hidden sm:inline">Shift Aktif</span>
          </span>
        )}

        {/* Owner Profile Badge (Clickable with Mobile Popover Dropdown) */}
        <div className="relative pl-2 border-l border-gray-100">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 focus:outline-none group active:scale-95 transition-transform"
            title="Menu Profil & Logout"
          >
            <div className="w-10 h-10 rounded-full bg-[#0CAF60] text-white flex items-center justify-center font-medium text-[16px] shadow-xs ring-2 ring-emerald-100">
              {user?.nama ? user.nama[0].toUpperCase() : 'O'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">
                {user?.nama || 'Pemilik Toko'}
              </p>
              <p className="text-[10px] font-semibold text-emerald-600 uppercase">Owner</p>
            </div>
          </button>

          {/* Profile Dropdown Popover */}
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center space-x-3 p-2 bg-emerald-50/70 rounded-xl mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-semibold text-sm shrink-0 shadow-xs">
                    {user?.nama ? user.nama[0].toUpperCase() : 'O'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{user?.nama || 'Pemilik Toko'}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user?.email || 'owner@example.com'}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-100 text-[#16A34A] text-[9px] font-semibold rounded-full uppercase">
                      Owner Toko
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/owner/pengaturan"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span>Pengaturan</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Keluar Akun (Logout)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
