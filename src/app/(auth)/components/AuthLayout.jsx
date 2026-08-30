import React from 'react';
import Link from 'next/link';
import { Headphones } from 'lucide-react';

/**
 * AuthLayout — shell 2 kolom responsif utk halaman auth (login, register,
 * verifikasi, lupa-password).
 *
 * - Desktop / tablet (≥lg): kiri = panel branding (logo, tagline, hero, fitur),
 *   kanan = card form (children).
 * - Mobile (<lg): single column — brand kecil di atas, form card di bawah.
 * - Semua children diharapkan membungkus KONTEN FORM-nya sendiri (card).
 */
export default function AuthLayout({ children, hero, title, tagline, desc, features, link }) {
  return (
    <div className="min-h-screen bg-[#F1F5F4] lg:bg-[#F8FAF9] flex flex-col lg:flex-row overflow-x-hidden">
      {/* Blob dekoratif (mobile) */}
      <div className="fixed -top-24 -right-24 w-72 h-72 rounded-full bg-[#0CAF60]/15 blur-2xl pointer-events-none lg:hidden" />
      <div className="fixed top-40 -left-20 w-56 h-56 rounded-full bg-[#E8FAF0] blur-xl pointer-events-none lg:hidden" />

      {/* ── Panel Branding (desktop/tablet ≥lg) ── */}
      <div className="hidden lg:flex w-[46%] min-h-screen bg-gradient-to-br from-[#E8FAF0] via-white to-[#FFF8D9] relative overflow-hidden p-[6%] flex-col justify-between">
        {/* decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#0CAF60]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-8rem] left-[-8rem] w-80 h-80 rounded-full bg-[#EAF3FF] blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-2">
          <img src="/assets/brand/tokiva-symbol.png" alt="Tokiva" className="w-10 h-10 object-contain drop-shadow-md" />
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            <span className="text-[#10233E]">Tok</span><span className="text-[#0CAF60]">iva</span>
          </Link>
        </div>

        {/* Hero copy + ilustrasi */}
        <div className="relative flex-1 flex flex-col justify-center gap-8 max-w-[440px]">
          <div>
            <h1 className="text-[34px] leading-[1.15] font-semibold tracking-tight text-[#10233E]">
              {title}
            </h1>
            {tagline && (
              <p className="text-[15px] font-medium text-[#0CAF60] mt-3">{tagline}</p>
            )}
            {desc && (
              <p className="text-[13px] leading-relaxed text-[#68758A] mt-3">{desc}</p>
            )}
          </div>

          {hero && (
            <div className="flex items-center justify-center">
              <img src={hero} alt="Ilustrasi Tokiva" className="w-full max-w-[420px] object-contain" />
            </div>
          )}

          {features && features.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/70 backdrop-blur rounded-2xl p-3 shadow-[0_2px_10px_rgba(16,35,62,.05)]">
                  <span className="w-9 h-9 rounded-xl bg-[#E8FAF0] text-[#0CAF60] flex items-center justify-center shrink-0">
                    {f.icon && <f.icon className="w-4 h-4" />}
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold text-[#10233E]">{f.title}</p>
                    <p className="text-[10px] text-[#68758A] leading-4">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer panel kiri */}
        <div className="relative flex items-center justify-between">
          <p className="text-[11px] text-[#68758A]">© 2026 Tokiva. Semua hak dilindungi.</p>
          <div className="flex items-center gap-1.5 text-[#68758A]">
            <Headphones className="w-4 h-4 text-[#0CAF60]" />
            <span className="text-[11px]">Butuh bantuan?</span>
          </div>
        </div>
      </div>

      {/* ── Kolom Form (kanan / mobile) ── */}
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center px-5 py-8 relative z-10">
        <div className="w-full max-w-[430px]">
          {/* Brand mini (mobile saja) */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <img src="/assets/brand/tokiva-symbol.png" alt="Tokiva" className="w-9 h-9 object-contain drop-shadow-md" />
            <span className="text-xl font-semibold tracking-tight">
              <span className="text-[#10233E]">Tok</span><span className="text-[#0CAF60]">iva</span>
            </span>
          </div>

          {/* Card form — konten halaman */}
          <div>{children}</div>

          {/* Link bawah (mobile atau kalau dibutuhkan) */}
          {link && (
            <p className="text-center mt-5 text-[12px] font-normal text-[#68758A]">
              {link}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
