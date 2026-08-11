'use client';

import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  Plus,
  Minus,
  Search,
  Package,
  History,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import FeedbackModal from '@/components/ui/FeedbackModal';
import { useAuthStore } from '@/store/authStore';

const SATUAN_GROSIR_OPTIONS = [
  { value: 'Dus', label: 'Dus / Karton' },
  { value: 'Slop', label: 'Slop / Press' },
  { value: 'Bal', label: 'Bal / Karung Plastik' },
  { value: 'Renceng', label: 'Renceng / Gantung' },
  { value: 'Karung', label: 'Karung 25kg/50kg' },
  { value: 'Pak', label: 'Pak / Box Kecil' },
];

export default function OwnerStockAdjustmentPage() {
  const { user } = useAuthStore();
  const [logList, setLogList] = useState([]);
  const [produkList, setProdukList] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Feedback modal state
  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const showFeedback = (type, title, message) => setFeedback({ isOpen: true, type, title, message });

  const [formData, setFormData] = useState({
    produkNama: '',
    tipe: 'tambah',
    unitMode: 'grosir',
    satuanGrosir: 'Dus',
    jumlahKemasan: 0,
    isiPerKemasan: 40,
    jumlahPcs: 0,
    alasan: '',
  });

  useEffect(() => {
    api.get('/owner/produk').then(res => {
      const data = res?.berhasil ? res.data : (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(data)) setProdukList(data);
    }).catch(() => {});

    api.get('/owner/stock-adjustment').then(res => {
      const data = res?.berhasil ? res.data : (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(data)) setLogList(data);
    }).catch(() => {});
  }, []);

  const totalCalculatedPcs = formData.unitMode === 'grosir'
    ? (Number(formData.jumlahKemasan) || 0) * (Number(formData.isiPerKemasan) || 1)
    : Number(formData.jumlahPcs) || 0;

  const handleSave = async (e) => {
    e.preventDefault();
    const descInfo = formData.unitMode === 'grosir'
      ? `${formData.alasan} (${formData.jumlahKemasan} ${formData.satuanGrosir} @${formData.isiPerKemasan} pcs)`
      : formData.alasan;

    try {
      const selectedProduk = produkList.find(p => p.nama?.toLowerCase() === formData.produkNama?.toLowerCase());
      if (!selectedProduk) return showFeedback('info', 'Perhatian', 'Produk tidak ditemukan. Pilih dari daftar.');

      // Validasi stok: kurangi tidak boleh melebihi stok tersedia
      if (formData.tipe === 'kurang' && totalCalculatedPcs > Number(selectedProduk.stok || 0)) {
        return showFeedback('info', 'Stok Tidak Mencukupi', `Stok ${selectedProduk.nama} tersedia ${selectedProduk.stok}, tapi diminta kurangi ${totalCalculatedPcs}.`);
      }

      await api.post('/owner/stock-adjustment', {
        produk_id: selectedProduk.id,
        tipe: formData.tipe,
        qty: totalCalculatedPcs,
        alasan: descInfo,
      });

      setIsModalOpen(false);
      // Refresh log
      const res = await api.get('/owner/stock-adjustment');
      const data = res?.berhasil ? res.data : (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(data)) setLogList(data);
    } catch (err) {
      showFeedback('error', 'Gagal', err?.message || 'Terjadi kesalahan');
    }
  };

  const filteredLogs = logList.filter(l =>
    (l.produk?.nama || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.alasan || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1 border-b border-gray-100">
        <div>
          <h1 className="text-lg font-bold text-gray-900 font-[family-name:var(--font-poppins)]">
            Penyesuaian & Tambah Stok Manual
          </h1>
          <p className="text-xs text-gray-500">Tambah stok barang instan & log riwayat pergerakan stok manual (+/-)</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#16A34A] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#15803D] active:scale-95 transition-all"
        >
          <PackagePlus className="w-4 h-4" />
          <span>+ Tambah / Adjust Stok</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari riwayat produk / alasan penyesuaian..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:border-[#16A34A] focus:ring-1 focus:ring-[#16A34A]/30"
        />
      </div>

      {/* History Log List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Histori Penyesuaian Stok</h3>
        {filteredLogs.map((item) => {
          const isTambah = item.tipe === 'tambah';
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs flex items-center justify-between gap-3 hover:border-[#16A34A] transition-all"
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border',
                isTambah ? 'bg-emerald-50 text-[#16A34A] border-emerald-100' : 'bg-red-50 text-[#EF4444] border-red-100'
              )}>
                {isTambah ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-900 truncate">{item.produk?.nama || '-'}</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">{item.alasan}</p>
                <p className="text-[10px] text-gray-500 mt-1">{new Date(item.created_at).toLocaleDateString('id-ID')} • {item.pembuat?.nama || '-'}</p>
              </div>

              <div className="text-right shrink-0">
                <span className={cn(
                  'text-sm font-extrabold px-2.5 py-1 rounded-xl border',
                  isTambah ? 'bg-emerald-50 text-[#16A34A] border-emerald-200' : 'bg-red-50 text-[#EF4444] border-red-200'
                )}>
                  {isTambah ? `+${item.qty}` : `-${item.qty}`} pcs
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form Adjustment */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Formulir Tambah / Adjust Stok Manual"
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-gray-700 block">Pilih Produk</label>
            <select
              value={formData.produkNama}
              onChange={e => setFormData({ ...formData, produkNama: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
              required
            >
              <option value="">Pilih Produk...</option>
              {produkList.map(p => (
                <option key={p.id} value={p.nama}>{p.nama} (Stok: {p.stok})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-gray-700 block">Tipe Penyesuaian</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipe: 'tambah' })}
                className={cn(
                  'py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                  formData.tipe === 'tambah'
                    ? 'bg-[#16A34A] text-white border-[#16A34A]'
                    : 'bg-white text-gray-600 border-gray-200'
                )}
              >
                <Plus className="w-4 h-4" /> Stok Masuk (+)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipe: 'kurang' })}
                className={cn(
                  'py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                  formData.tipe === 'kurang'
                    ? 'bg-[#EF4444] text-white border-[#EF4444]'
                    : 'bg-white text-gray-600 border-gray-200'
                )}
              >
                <Minus className="w-4 h-4" /> Stok Keluar (-)
              </button>
            </div>
          </div>

          {/* Unit Selector & Multi-Satuan Conversion */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-900 block">Input Berdasarkan Satuan</label>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200 text-[10px]">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, unitMode: 'grosir' })}
                  className={cn(
                    'px-2 py-1 rounded-md font-bold transition-all',
                    formData.unitMode === 'grosir' ? 'bg-[#16A34A] text-white' : 'text-gray-600'
                  )}
                >
                  📦 Kemasan Grosir
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, unitMode: 'ecer' })}
                  className={cn(
                    'px-2 py-1 rounded-md font-bold transition-all',
                    formData.unitMode === 'ecer' ? 'bg-[#16A34A] text-white' : 'text-gray-600'
                  )}
                >
                  🏷️ Unit Eceran (Pcs)
                </button>
              </div>
            </div>

            {formData.unitMode === 'grosir' ? (
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Jumlah Kemasan"
                  type="number"
                  placeholder="10"
                  value={formData.jumlahKemasan}
                  onChange={e => setFormData({ ...formData, jumlahKemasan: e.target.value })}
                />
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700 block">Satuan Kemasan</label>
                  <select
                    value={formData.satuanGrosir}
                    onChange={e => setFormData({ ...formData, satuanGrosir: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#16A34A] font-semibold"
                  >
                    {SATUAN_GROSIR_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label={`Rasio Isi per 1 ${formData.satuanGrosir} (Pcs)`}
                  type="number"
                  value={formData.isiPerKemasan}
                  onChange={e => setFormData({ ...formData, isiPerKemasan: e.target.value })}
                />
              </div>
            ) : (
              <Input
                label="Jumlah Eceran (Pcs)"
                type="number"
                value={formData.jumlahPcs}
                onChange={e => setFormData({ ...formData, jumlahPcs: e.target.value })}
              />
            )}

            {/* Total Auto Calculated Result Badge */}
            <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200 text-center">
              <span className="text-[11px] text-gray-600">Total Stok Ditambahkan Ke Sistem: </span>
              <span className="text-sm font-extrabold text-[#16A34A]">
                {formData.tipe === 'tambah' ? '+' : '-'}{totalCalculatedPcs} Pcs
              </span>
            </div>
          </div>

          <Input
            label="Alasan Penyesuaian Stok"
            placeholder="Restok langsung gudang / Bonus supplier / Rusak"
            value={formData.alasan}
            onChange={e => setFormData({ ...formData, alasan: e.target.value })}
            required
          />

          <Button variant="primary" fullWidth size="lg" type="submit">
            Simpan Perubahan Stok
          </Button>
        </form>
      </Modal>
      {/* Feedback Modal */}
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
