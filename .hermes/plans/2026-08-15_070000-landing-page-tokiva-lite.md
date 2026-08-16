# Landing Page Tokiva Lite — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Landing page publik di route `/` (server component, static) — marketing untuk Tokiva POS dengan computer vision, CTA ke `/login`. Halaman auth dashboard tidak berubah.

**Architecture:** Root page dari client-redirect page diganti server component pure static (SSG, zero client JS selain mobile nav). Section components kecil di `components/landing/`. Screenshot asli app di-capture dari production build ke `public/demo/`. Tidak ada dependency baru.

**Tech Stack:** Next.js 16 App Router (server component), Tailwind CSS 4, lucide-react (sudah ada), Poppins (sudah loaded di layout).

**Design language:** Konsisten dengan UI app — emerald-700 primary, bg `#F8FAF9`, rounded-3xl, clean, tanpa glassmorphism. Bahasa: Indonesia (audience UMKM).

---

## Konteks & Asumsi

- Root `/` sekarang: client component yang auto-redirect ke login/dashboard (`src/app/page.jsx`, 42 baris).
- Keputusan: landing page **tidak** auto-redirect user yang sudah login (landing = publik/SEO). User masuk lewat tombol Masuk → `/login`.
- Login/dashboard flow tidak disentuh.
- Content marketing sudah tersedia di `README.md` (fitur, AI pipeline) — diadaptasi, bukan copy-paste (README = developer doc, landing = bahasa UMKM).
- Tanpa pricing section (belum ada harga publik). CTA = Masuk + (opsional) kontak — lihat Open Questions.

## Files yang berubah

| Aksi | File |
|------|------|
| Rewrite | `src/app/page.jsx` |
| Create | `src/components/landing/LandingNav.jsx` (client, mobile menu) |
| Create | `src/components/landing/LandingSections.jsx` (Hero, Stats, Features, HowItWorks, Screens, CTA, Footer — server components) |
| Modify | `src/app/layout.js` (metadata: title, description, OG tags) |
| Create | `public/demo/*.png` (screenshot asli app) |
| Modify | `README.md` (1 baris: landing page di `/`) |

---

## Fase 1 — Struktur + Design System

### Task 1: Skeleton page + LandingNav

**Files:**
- Rewrite: `src/app/page.jsx`
- Create: `src/components/landing/LandingNav.jsx`

**Langkah:**
1. `page.jsx` → server component `'use client'` dihapus. Struktur: `<LandingNav /> <main> <Hero/ <Features/> <HowItWorks/> <Screens/> <CTA/> <Footer/> </main>`. Section fase 1 = placeholder `<section id="...">` kosong (isi di fase 2/3).
2. `LandingNav.jsx` (satu-satunya client component): sticky top, blur backdrop, logo (Store icon emerald + "Tokiva"), anchor links (Fitur, Cara Kerja, Demo), tombol `Masuk` → `/login`, hamburger + drawer di mobile (`md:hidden`).
3. Id anchor: `#fitur`, `#cara-kerja`, `#demo`, `#kontak` (footer).

**Verifikasi:** `npm run build` PASS; `npx next start -p 3001`; browser: nav sticky, anchor scroll, hamburger mobile buka/tutup, tombol Masuk → `/login`.

### Task 2: Hero + Footer

**Files:**
- Modify: `src/components/landing/LandingSections.jsx`

**Langkah:**
1. Hero: H1 `POS Pintar untuk Toko Kelontong`, subhead: identifikasi produk otomatis pakai kamera — tanpa barcode, tanpa scan manual. CTA: `Masuk ke Aplikasi` (primary emerald) + `Lihat Fitur` (ghost). Visual kanan: mockup POS dari screenshot (fase 3) atau CSS mockup card placeholder sampai screenshot ready.
2. Footer (`#kontak`): logo, tagline, link nav, copyright `© 2026 Tokiva`.

**Verifikasi:** build + visual check desktop & mobile (375px) — hero tidak overflow, CTA tap target ≥44px.

**Commit:** `feat: landing page skeleton, nav, hero, footer`

---

## Fase 2 — Konten

### Task 3: Stats bar + Features

**Files:**
- Modify: `src/components/landing/LandingSections.jsx`

**Langkah:**
1. Stats bar (di bawah hero): 3 stat — `~350ms identifikasi per scan`, `Tanpa barcode`, `100% di browser` (fakta dari README, bukan angka mengarang).
2. Features (`#fitur`): grid 2x2 / 4 kartu:
   - Deteksi Produk AI (kamera → keranjang otomatis, fallback barcode manual)
   - Stok Terjaga (stock cap, proteksi stok negatif)
   - Laporan Lengkap (omzet, laba, top produk)
   - Multi-peran (Owner kelola, Admin panel developer)
   Icons: ScanBarcode, Package, BarChart3, Users (lucide, sudah di-import via optimizePackageImports).

**Verifikasi:** build + visual; semua copy dalam bahasa Indonesia, tidak ada kata "skripsi"/"akademik".

**Commit:** `feat: landing features & stats sections`

### Task 4: How It Works (AI pipeline) + CTA

**Files:**
- Modify: `src/components/landing/LandingSections.jsx`

**Langkah:**
1. How It Works (`#cara-kerja`): 3 langkah horizontal:
   1. Arahkan kamera ke produk
   2. Model AI mengenali di browser (~350ms)
   3. Produk masuk keranjang otomatis — kalau ragu, kasir cukup tap
   Plus note kecil: model terus belajar dari koreksi kasir.
2. CTA block sebelum footer: `Siap kelola toko lebih cepat?` + tombol Masuk.

**Verifikasi:** build + visual; step numbers readable di mobile (vertical stack).

**Commit:** `feat: landing how-it-works & CTA`

---

## Fase 3 — Screenshot Asli

### Task 5: Capture screenshot dari production build

**Files:**
- Create: `public/demo/pos.png`, `public/demo/dashboard.png`, `public/demo/produk.png`, `public/demo/admin.png` (3-5 shot, 1280x800)

**Langkah:**
1. `npm run build && npx next start -p 3001`.
2. Browser tool: login owner (`anoderb@gmail.com`) → capture `/owner/dashboard`, `/owner/pos` (mode manual, keranjang berisi 1-2 item), `/owner/produk`. Login admin (`admin@tokiva.biz.id`) → capture `/admin/dashboard`.
3. Simpan PNG ke `public/demo/`. Cek ukuran file < 500KB (kompres bila perlu — target Lighthouse).
4. Embed di section Screens (`#demo`): galeri horizontal / tab sederhana — 1 server component, `next/image` (unoptimized untuk `public/` tidak perlu — pakai `<img>` atau next/image dengan `dangerouslyAllowSVG=false`; next/image default fine).
5. Ganti hero visual placeholder dengan screenshot POS.

**Verifikasi:** build; visual: screenshot tajam di desktop & tidak stretched di mobile; `curl -sI /demo/pos.png` → 200.

**Commit:** `feat: landing demo screenshots`

---

## Fase 4 — SEO, Performa, Polish

### Task 6: Metadata + Lighthouse

**Files:**
- Modify: `src/app/layout.js`

**Langkah:**
1. Metadata: `title: "Tokiva — POS Pintar dengan Deteksi Produk AI"`, `description` (meta description 150 char, bahasa Indonesia), `openGraph` (title, description, url placeholder domain produksi, type website), twitter card.
2. Lighthouse production: target Performance ≥ 90, SEO 100, A11y ≥ 95 (mobile).
3. A11y check: semua `<img>` ada alt, nav landmarks, contrast, focus states.
4. Responsive final pass: 375px, 768px, 1280px.
5. `npm run build` final, commit + push.

**Commit:** `feat: landing page — SEO metadata, lighthouse polish`

---

## Validation Gate (selesai = semua PASS)

- [ ] `npm run build` exit 0
- [ ] `/` render tanpa JS auth store (server component, cek source HTML)
- [ ] Tidak ada string "skripsi", "akademik", "proposal" di page source
- [ ] Anchor links semua resolve (tidak ada 404 internal)
- [ ] Mobile 375px: tidak ada horizontal scroll
- [ ] Lighthouse mobile: Perf ≥ 90, SEO 100, A11y ≥ 95
- [ ] Screenshot asli (bukan placeholder) ter-load
- [ ] Push ke `origin/master`

## Risks / Tradeoffs

- **Screenshot di `public/`** ikut ter-upload ke Vercel → ukuran deploy naik ~1-2MB. Mitigasi: kompres PNG (target < 500KB/shot).
- **Auto-redirect dihapus dari `/`** → owner yang terbiasa buka domain root akan mendarat di landing dulu, harus klik Masuk. Diterima (landing = pintu baru).
- **Lighthouse Performance 90+** dengan 4 screenshot: perlu lazy-load (`loading="lazy"`) + dimensi eksplisit untuk hindri CLS.

## Open Questions (default kalau tidak dijawab)

1. **Pricing section?** Default: skip (belum ada harga publik).
2. **Kontak di footer?** Default: tanpa email/WhatsApp (belum ada channel publik). Bisa ditambah nanti via `NEXT_PUBLIC_CONTACT_*` env.
3. **Bahasa?** Default: Indonesia saja, tanpa language switcher.
4. **Nama brand di landing?** Default: `Tokiva` (bukan `WebPOS`) — `NEXT_PUBLIC_APP_NAME` tetap untuk UI app.