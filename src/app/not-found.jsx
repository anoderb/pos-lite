'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  Compass,
  Headphones,
  Home,
  ArrowLeft,
  Check,
} from 'lucide-react';
import FeedbackModal from '@/components/ui/FeedbackModal';

export default function NotFoundPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState({ isOpen: false, type: 'info', title: '', message: '' });

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
      setFeedback({ isOpen: true, type: 'success', title: 'URL Disalin', message: 'Alamat halaman telah disalin ke clipboard.' });
    } catch {
      setFeedback({ isOpen: true, type: 'info', title: 'Periksa URL', message: 'Periksa kembali URL yang kamu masukkan, lalu coba lagi.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center px-5 py-8 overflow-x-hidden">
      <div className="fixed -top-24 -right-24 w-72 h-72 rounded-full bg-[#0CAF60]/12 blur-2xl pointer-events-none" />
      <div className="fixed top-40 -left-20 w-56 h-56 rounded-full bg-[#E8FAF0] blur-xl pointer-events-none" />

      <div className="w-full max-w-[430px] md:max-w-2xl relative z-10 flex flex-col items-center text-center">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/assets/brand/tokiva-symbol.png" alt="Tokiva" className="w-9 h-9 object-contain drop-shadow-md" />
          <span className="text-xl font-semibold tracking-tight">
            <span className="text-[#10233E]">Tok</span><span className="text-[#0CAF60]">iva</span>
          </span>
        </Link>

        {/* Ilustrasi 404 — utuh, tidak dipotong */}
        <img src="/assets/tokiva-dashboard/img-404.png" alt="Halaman tidak ditemukan" className="w-full max-w-[340px] md:max-w-[460px] object-contain my-5" />

        {/* Pesan */}
        <h1 className="text-[19px] md:text-2xl font-semibold leading-6 text-[#10233E]">Oops! Halaman tidak ditemukan</h1>
        <p className="text-[11px] md:text-[13px] font-normal text-[#68758A] leading-4 mt-1.5 max-w-[300px] md:max-w-md">
          Maaf, halaman yang kamu cari tidak tersedia atau telah dipindahkan.
        </p>

        {/* 3 Kartu Opsi */}
        <div className="w-full bg-white rounded-[18px] shadow-sm border border-gray-50 mt-5 divide-y divide-gray-100 md:divide-y-0 md:divide-x md:grid md:grid-cols-3">
          <button onClick={copyUrl} className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-[#E8FAF0]/40 transition-colors rounded-t-[18px] md:rounded-t-none md:rounded-l-[18px]">
            <span className="w-9 h-9 rounded-full bg-[#EAF3FF] text-blue-600 flex items-center justify-center shrink-0"><Compass className="w-4 h-4" /></span>
            <span>
              <span className="block text-[12px] font-medium text-[#10233E]">Periksa kembali</span>
              <span className="block text-[10px] font-normal text-[#68758A]">URL yang kamu masukkan</span>
            </span>
          </button>
          <Link href="/" className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-[#E8FAF0]/40 transition-colors">
            <span className="w-9 h-9 rounded-full bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center shrink-0"><Store className="w-4 h-4" /></span>
            <span>
              <span className="block text-[12px] font-medium text-[#10233E]">Kembali ke</span>
              <span className="block text-[10px] font-normal text-[#68758A]">Halaman Utama</span>
            </span>
          </Link>
          <button
            onClick={() => setFeedback({ isOpen: true, type: 'info', title: 'Butuh Bantuan?', message: 'Silakan hubungi tim Tokiva melalui email support atau fitur bantuan di aplikasi.' })}
            className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-[#E8FAF0]/40 transition-colors rounded-b-[18px] md:rounded-b-none md:rounded-r-[18px]"
          >
            <span className="w-9 h-9 rounded-full bg-[#F3EEFF] text-violet-600 flex items-center justify-center shrink-0"><Headphones className="w-4 h-4" /></span>
            <span>
              <span className="block text-[12px] font-medium text-[#10233E]">Butuh bantuan?</span>
              <span className="block text-[10px] font-normal text-[#68758A]">Hubungi kami</span>
            </span>
          </button>
        </div>

        {/* Tombol Navigasi */}
        <div className="w-full space-y-2 mt-4 md:space-y-0 md:flex md:gap-2 md:justify-center md:max-w-md">
          <Link
            href="/"
            className="w-full md:flex-1 flex items-center justify-center gap-2 py-3 bg-[#0CAF60] text-white rounded-xl text-[13px] font-medium shadow-sm hover:bg-[#087A4B] active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <button
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.replace('/');
            }}
            className="w-full md:flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-[#10233E] rounded-xl text-[13px] font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali Sebelumnya
          </button>
        </div>

        {/* Footer */}
        <div className="w-full mt-6">
          <div className="rounded-2xl overflow-hidden">
            <img src="/assets/tokiva-dashboard/img-login-hero.png" alt="Tokiva" className="w-full object-cover object-bottom" style={{ height: 100 }} />
          </div>
          <p className="text-[10px] font-normal text-[#68758A] flex items-center justify-center gap-1.5 mt-3">
            <Headphones className="w-3.5 h-3.5 text-[#0CAF60]" />
            Masih butuh bantuan? <span className="font-medium text-[#0CAF60]">Hubungi Kami</span>
          </p>
          <p className="text-[9px] font-normal text-[#68758A]/70 text-center mt-1">© 2026 Tokiva. Semua hak dilindungi.</p>
        </div>
      </div>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
