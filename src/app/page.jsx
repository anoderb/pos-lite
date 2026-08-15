import LandingNav from '@/components/landing/LandingNav';
import { Hero, Stats, Features, HowItWorks, CTA, Footer } from '@/components/landing/LandingSections';

export const metadata = {
  title: 'Tokiva — POS Pintar untuk Toko Modern',
  description: 'Kelola penjualan, stok, dan laporan toko lebih cepat dengan Tokiva. Identifikasi produk otomatis melalui kamera.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAF9]">
      <LandingNav />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
