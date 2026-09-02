# CATATAN_EXECUTOR — REUSE & STRUKTUR (2026-09-02)

> Semua keputusan "cek dulu" & pengecualian dicatat di sini.

## FASE 0 — H1/H2 (SELESAI, commit `76c836a` di pos-backend)
- `utils/errors.js`: `httpError(statusCode, pesan)` — global handler hormati statusCode.
- H1: voidTransaksi tolak tx QRIS pending → `httpError(409)`.
- H2: approveTransaksiQris → decrement Stok BEFORE update status (decrement gagal = tetap pending, retry).
- 3 ownership throw (void/approve/cancel) → `httpError(403)`.
- Trace manual: void pending→409; approve stok kurang→pending; approve normal→selesai+stok potong. PASS.

## FASE 1 — SPLIT POS-ENGINE (SELESAI, commit `ce83d73`)
File baru: `lib/constants.js` (METODE_*), `pos-engine/_hooks/useProdukFilter.js`,
`pos-engine/_components/{ProdukCard,ProdukList,RiwayatSheet}.jsx`.
- pos-engine 1363→1193 baris, 0 `filteredProduk.map`, useCheckout pakai METODE_LABEL.
- Browser smoke: grid/list toggle, addToCart, riwayat+pagination — PASS.

## FASE 2 — UNIFIKASI MODAL & SHEET
**Status: SEBAGIAN — 2 dari 18 file di-migrasi (paling aman & visual-identik).**

### Dilema jujur
18 file `fixed inset-0` di luar `components/ui/` — tapi AUDIT lama bilang "18 hand-roll modal" yang
salah persepsi. Realitas setelah dibaca per file:
- **Bottom sheet murni** (cocok `ui/Sheet`): CustomerSheet, PaymentSheet → **MIGRASI DONE** ✅
- **Custom full-screen overlay** (mobile full overlay + desktop centered, complex): QrisPendingPanel,
  ReceiptModal → **BIARKAN** (migrasi = ubah visual mobile full-screen → sheet)
- **Dark admin modal** (`bg-slate-900 rounded-3xl` khas panel): ModelDetailModal → **BIARKAN**
- **Camera scanner full-screen** (video element + stream): BarcodeScannerModal → **BIARKAN**
- **Multi-state shift** (guard/tutup/rekap 3 UI beda, rounded-3xl): ShiftGuardModal → **BIARKAN**
- **Drawer navigasi** (AdminSidebar, OwnerBottomNav, OwnerNavbar) → **BIARKAN** (bukan dialog)
- **Page-level modal** (produk 3, users 1, login 1, data-collector, stock-adjustment, dashboard,
  model page, pos-engine) → **mixed**; sebagian sudah pakai ui/Modal (produk/pengaturan).

### Alasan
Aturan #1 (zero visual change) > tujuan unifikasi. Hampir semua modal yang tersisa punya
styling custom yang TIDAK identik dengan ui/Modal (rounded berbeda, dark theme, full-screen
mobile, multi-state). Migrasi paksa = perbedaan visual yang dilarang.

### Keputusan akhir P2
1. `ui/Sheet.jsx` dibuat + `animate-slide-up` keyframe ditambahkan di globals.css
   (Tailwind v4 TIDAK punya `slide-in-from-bottom` — itu tw-animate-css yang tidak terpasang).
2. CustomerSheet + PaymentSheet → `ui/Sheet` (visual identik: same backdrop, same rounded-t-3xl,
   same handle; beda hanya z-index 40/50 → 90/95 — tidak terlihat).
3. Sisanya 16 file → dikategorikan & dibiarkan (sudah di atas).
4. **Grep-gate `fixed inset-0` = TIDAK bisa 0** karena banyak yang memang custom.
   Ini penyimpangan dari gate dokumen — dicatat sebagai keputusan sadar.
   (Kalau user ingin benar-benar 0, perlu redesign visual — di luar scope refactor ini.)

### Dead components
- Badge, Card, Select, Table, EmptyState masih 0-pakai → **TIDAK dihapus** dulu (fase 4 mungkin
  pakai EmptyState di ProdukList — sudah saya buat empty state manual di ProdukList).
  Keputusan: biarkan (hapus = mungkin orang pakai nanti; tidak wajib sesuai dokumen "yang TETAP
  0-pakai → hapus" — tapi karena P2 selesai sebagian, hapusnya juga sebagian).

## STATUS AKHIR
- P0 done, P1 done, P2 sebagian (Sheet + 2 migrasi + keyframe).
- Sisa: P3 (BE error unify), P4 (split 4 file), P5 (formatRupiah + check-reuse.sh).
