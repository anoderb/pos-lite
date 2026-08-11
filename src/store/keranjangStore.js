import { create } from 'zustand';

export const useKeranjangStore = create((set, get) => ({
  items: [],
  diskonTransaksi: 0,
  pelanggan: null,

  tambahItem: (produk, satuanJual) => {
    const { items } = get();
    const index = items.findIndex(
      (item) => item.produk.id === produk.id && item.satuanJual.id === satuanJual.id
    );

    if (index > -1) {
      const updated = [...items];
      updated[index].qty += 1;
      set({ items: updated });
    } else {
      set({
        items: [
          ...items,
          {
            produk,
            satuanJual,
            qty: 1,
            hargaSatuan: satuanJual.harga_ecer,
            diskonItem: 0,
          },
        ],
      });
    }
  },

  updateQty: (produkId, satuanJualId, qty) => {
    if (qty <= 0) {
      get().hapusItem(produkId, satuanJualId);
      return;
    }
    const updated = get().items.map((item) =>
      item.produk.id === produkId && item.satuanJual.id === satuanJualId
        ? { ...item, qty }
        : item
    );
    set({ items: updated });
  },

  hapusItem: (produkId, satuanJualId) => {
    set({
      items: get().items.filter(
        (item) => !(item.produk.id === produkId && item.satuanJual.id === satuanJualId)
      ),
    });
  },

  setPelanggan: (pelanggan) => set({ pelanggan }),
  setDiskonTransaksi: (diskon) => set({ diskonTransaksi: diskon }),
  kosongkanKeranjang: () => set({ items: [], diskonTransaksi: 0, pelanggan: null }),

  hitungsSubtotal: () => {
    return get().items.reduce((total, item) => {
      const sub = (item.hargaSatuan - item.diskonItem) * item.qty;
      return total + Math.max(0, sub);
    }, 0);
  },

  hitungTotal: () => {
    const subtotal = get().hitungsSubtotal();
    return Math.max(0, subtotal - get().diskonTransaksi);
  },
}));
