// Konstanta bersama POS — satu sumber label/badge/ikon metode pembayaran.
// Konsumen: pos-engine.jsx, useCheckout.js (hapus hardcode lokal).

export const METODE_LABEL = { cash: 'Tunai', qris: 'QRIS' };

export const METODE_BADGE = {
  cash: 'bg-[#E8FAF0] text-[#087A4B]',
  qris: 'bg-[#F3EEFF] text-violet-600',
};

export const METODE_ICON_BG = {
  cash: 'bg-[#E8FAF0] text-[#0CAF60]',
  qris: 'bg-[#F3EEFF] text-violet-600',
};
