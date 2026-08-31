'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/ToastProvider';

/**
 * useCart — state & operasi keranjang POS.
 * Return nama variabel SAMA dengan yang lama di pos-engine.jsx agar call-site tak berubah.
 * resetCart() menggantikan panggilan setCart([]) di handler luar (newTransaction/approve/cancel).
 */
export function useCart() {
  const [cart, setCart] = useState([]);
  const [diskon, setDiskon] = useState(0);

  // 🔊 Beeper POS Scanner (Web Audio API) — sebelumnya di dalam pos-engine.jsx
  const playBeepSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.085);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.085);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const addToCart = (produk) => {
    if (!produk || !produk.id) return false;
    const maxStok = Number(produk.stok ?? 0);
    if (maxStok <= 0) {
      toast.info(`${produk.nama} sedang habis. Silakan restok dulu.`, { title: 'Stok Habis' });
      return false;
    }
    let added = false;
    setCart((prevCart) => {
      const idx = prevCart.findIndex(i => i.id === produk.id);
      if (idx > -1) {
        added = false; // Sudah ada — jangan auto qty++, kasir manual
        return prevCart;
      }
      added = true;
      playBeepSound();
      return [{ ...produk, qty: 1 }, ...prevCart]; // prepend = terbaru di atas
    });
    return added;
  };

  const updateQty = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map(i => {
          if (i.id !== id) return i;
          const maxStok = Number(i.stok ?? 0);
          const nextQty = i.qty + delta;
          if (nextQty > maxStok) {
            toast.warning(`${i.nama} hanya tersisa ${maxStok} pcs di stok.`, { title: 'Stok Tidak Mencukupi' });
            return i;
          }
          return { ...i, qty: Math.max(0, nextQty) };
        })
        .filter(i => i.qty > 0)
    );
  };

  const clearCart = () => setCart([]);
  const resetCart = () => setCart([]);

  const subtotal = cart.reduce((s, i) => s + i.harga * i.qty, 0);
  const total = Math.max(0, subtotal - diskon);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return {
    cart,
    diskon,
    setDiskon,
    addToCart,
    updateQty,
    clearCart,
    resetCart,
    subtotal,
    total,
    cartCount,
  };
}
