'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Store, ArrowRight } from 'lucide-react';

const links = [
  { href: '#fitur', label: 'Fitur' },
  { href: '#cara-kerja', label: 'Cara Kerja' },
  { href: '#demo', label: 'Demo' },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/70 bg-[#F8FAF9]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20"><Store className="h-5 w-5" /></span>
          <span className="text-xl font-black tracking-tight text-slate-950">Tokiva<span className="text-emerald-700">.</span></span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => <a key={link.href} href={link.href} className="text-sm font-semibold text-slate-600 transition hover:text-emerald-700">{link.label}</a>)}
        </nav>
        <div className="hidden md:block"><Link href="/login" className="group inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">Masuk <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></Link></div>
        <button type="button" aria-label={open ? 'Tutup menu' : 'Buka menu'} onClick={() => setOpen(!open)} className="rounded-xl p-2 text-slate-700 md:hidden">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="border-t border-slate-200 bg-[#F8FAF9] px-5 py-5 md:hidden"><nav className="flex flex-col gap-4">{links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="py-2 text-base font-bold text-slate-700">{link.label}</a>)}<Link href="/login" onClick={() => setOpen(false)} className="mt-2 rounded-xl bg-emerald-700 px-5 py-3 text-center text-sm font-bold text-white">Masuk ke Aplikasi</Link></nav></div>}
    </header>
  );
}

export { links };