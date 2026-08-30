'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Store, ScanBarcode, BarChart3, ShieldCheck, Mail } from 'lucide-react';
import AuthLayout from './components/AuthLayout';

export default function AuthLayoutWrapper({ children }) {
  const pathname = usePathname();

  const configs = {
    '/login': {
      hero: '/assets/tokiva-dashboard/img-login-hero.png',
      title: <>Kasir cerdas,<br />kelola toko <span className="text-[#0CAF60]">jadi mudah.</span></>,
      tagline: 'Semua transaksi, stok, dan laporan dalam satu aplikasi.',
      features: [
        { icon: Store, title: 'Kelola Produk & Stok', desc: 'Tambah stok, harga, dan kategori dengan mudah.' },
        { icon: ScanBarcode, title: 'Scan Barcode Cepat', desc: 'Kasir lebih cepat dengan deteksi produk otomatis.' },
        { icon: BarChart3, title: 'Laporan Real-time', desc: 'Pantau omzet & laba toko setiap saat.' },
      ],
    },
    '/register': {
      hero: '/assets/tokiva-dashboard/img-register-hero.png',
      title: <>Buat akun<br />toko Anda</>,
      tagline: 'dan mulai kelola bisnis dengan mudah',
      desc: 'Daftar gratis dan nikmati semua fitur Tokiva POS untuk UMKM.',
      features: [
        { icon: Store, title: 'Gratis Mendaftar', desc: 'Tanpa biaya awal, langsung bisa jualan.' },
        { icon: BarChart3, title: 'Siap Pertumbuhan', desc: 'Fitur lengkap untuk toko yang sedang berkembang.' },
      ],
    },
    '/lupa-password': {
      hero: '/assets/tokiva-dashboard/img-login-security.png',
      title: <>Lupa Password?</>,
      tagline: 'Jangan khawatir, kami siap membantu!',
      desc: 'Kami akan mengirimkan link reset password ke email Anda.',
      features: [
        { icon: ShieldCheck, title: 'Aman & Terenkripsi', desc: 'Data Anda terlindungi sepenuhnya.' },
      ],
    },
    '/verifikasi': {
      hero: '/assets/tokiva-dashboard/img-verifikasi-hero.png',
      title: <>Verifikasi Email<br />Anda</>,
      tagline: 'Satu langkah lagi untuk memulai',
      desc: 'Konfirmasi email Anda agar akun siap digunakan.',
      features: [
        { icon: Mail, title: 'Cek Inbox Anda', desc: 'Link verifikasi dikirim ke email Anda.' },
      ],
    },
  };

  const cfg = configs[pathname] || configs['/login'];

  return <AuthLayout {...cfg}>{children}</AuthLayout>;
}
