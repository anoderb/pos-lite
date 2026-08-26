'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/admin/AdminLayout';
import { api } from '@/lib/api';
import { HF_REPO, HF_DATASET_URL } from '@/lib/config';
import {
  FolderKanban, Search, Plus, Image as ImageIcon, Tag, X, CheckCircle2,
  ChevronLeft, ChevronRight, Maximize2, RefreshCw, Sliders,
  CloudUpload, Link as LinkIcon, Check, Layers, AlertCircle, ShoppingBag,
  MoreVertical, Pencil, Trash2, Power, ScanBarcode, ExternalLink,
} from 'lucide-react';
import BarcodeScannerModal from '@/components/admin/BarcodeScannerModal';
import { toast } from '@/components/ui/ToastProvider';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminDataCollectorPage() {
  const [activeTab, setActiveTab] = useState('classes'); // 'classes' | 'unmapped'
  const [classes, setClasses] = useState([]);
  const [unmappedProducts, setUnmappedProducts] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classPhotos, setClassPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnmappedLoading, setIsUnmappedLoading] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddClassModal, setIsAddClassModal] = useState(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [unmappedDeleteTarget, setUnmappedDeleteTarget] = useState(null);
  const showFeedback = (type, title, message) => toast[type](message, { title });
  const [isSyncConfigModal, setIsSyncConfigModal] = useState(false);
  const [syncConfigForm, setSyncConfigForm] = useState({
    auto_sync_enabled: false,
    threshold_count: 500,
    cron_enabled: false,
    cron_expression: '0 2 * * *',
  });

  // Mapping Modal state
  const [isMapModal, setIsMapModal] = useState(false);
  const [selectedUnmappedProduct, setSelectedUnmappedProduct] = useState(null);
  const [mapMode, setMapMode] = useState('existing'); // 'existing' | 'new'
  const [targetClassId, setTargetClassId] = useState('');
  const [mapBarcode, setMapBarcode] = useState('');
  const [newClassName, setNewClassName] = useState('');

  // Pagination
  const [classPage, setClassPage] = useState(1);
  const classesPerPage = 8;
  const [unmappedPage, setUnmappedPage] = useState(1);
  const unmappedPerPage = 10;
  const [galleryPage, setGalleryPage] = useState(1);
  const photosPerPage = 20;

  // Form State for Add Class
  const [addClassName, setAddClassName] = useState('');
  const [addClassBarcode, setAddClassBarcode] = useState('');
  const [addClassDesc, setAddClassDesc] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Class management state
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isEditModal, setIsEditModal] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', nama: '', barcode: '', deskripsi: '' });
  const [selectedClassForAction, setSelectedClassForAction] = useState(null);

  // Barcode scanner state
  const [isFormScannerOpen, setIsFormScannerOpen] = useState(false);
  const [isSearchScannerOpen, setIsSearchScannerOpen] = useState(false);

  // Selective sync state
  const [selectedClassIds, setSelectedClassIds] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchSyncStatus();
    fetchUnmapped();
  }, []);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/dataset/class');
      if (res?.berhasil && Array.isArray(res.data)) setClasses(res.data);
    } catch {
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnmapped = async () => {
    setIsUnmappedLoading(true);
    try {
      const res = await api.get('/admin/dataset/unmapped');
      if (res?.berhasil && Array.isArray(res.data)) setUnmappedProducts(res.data);
    } catch {
      setUnmappedProducts([]);
    } finally {
      setIsUnmappedLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await api.get('/admin/dataset/sync-status');
      if (res?.berhasil && res.data) {
        setSyncStatus(res.data);
        if (res.data.config) setSyncConfigForm(res.data.config);
      }
    } catch {}
  };

  const handleOpenGallery = async (cls) => {
    setSelectedClass(cls);
    setGalleryPage(1);
    setIsPhotoLoading(true);
    setClassPhotos([]);
    try {
      const res = await api.get(`/admin/dataset/foto?class_id=${cls.id}&limit=200`);
      if (res?.berhasil && Array.isArray(res.data)) setClassPhotos(res.data);
    } catch {} finally {
      setIsPhotoLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.post('/admin/dataset/sync-huggingface', {});
      showFeedback('success', 'Sync Berhasil', res?.pesan || 'Batch sync ke HuggingFace berhasil!');
      fetchSyncStatus();
      fetchClasses();
    } catch (err) {
      showFeedback('error', 'Sync Gagal', err.response?.data?.pesan || err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSyncConfig = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/dataset/sync-config', syncConfigForm);
      showFeedback('success', 'Tersimpan', 'Pengaturan auto-sync berhasil disimpan!');
      setIsSyncConfigModal(false);
      fetchSyncStatus();
    } catch (err) {
      showFeedback('error', 'Gagal Simpan', err.message);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!addClassName) return;
    try {
      await api.post('/admin/dataset/class', {
        nama: addClassName, barcode: addClassBarcode, deskripsi: addClassDesc,
      });
      setIsAddClassModal(false);
      setAddClassName(''); setAddClassBarcode(''); setAddClassDesc('');
      fetchClasses();
    } catch (err) {
      showFeedback('error', 'Gagal Tambah Class', err.message);
    }
  };

  const handleOpenMapModal = (prod) => {
    setSelectedUnmappedProduct(prod);
    setMapBarcode(prod.barcode || '');
    setTargetClassId(classes[0]?.id || '');
    setNewClassName(prod.nama.toUpperCase());
    setMapMode('existing');
    setIsMapModal(true);
  };

  const handleExecuteMapping = async (e) => {
    e.preventDefault();
    if (!selectedUnmappedProduct) return;
    try {
      if (mapMode === 'existing') {
        if (!targetClassId) return showFeedback('info', 'Perhatian', 'Pilih class target');
        await api.post('/admin/dataset/map-class', {
          produk_ids: [selectedUnmappedProduct.id],
          class_id: targetClassId,
          barcode: mapBarcode,
          nama_varian: selectedUnmappedProduct.nama,
        });
      } else {
        if (!newClassName) return showFeedback('info', 'Perhatian', 'Nama class baru wajib diisi');
        await api.post('/admin/dataset/create-class-and-map', {
          nama_class: newClassName,
          barcode: mapBarcode,
          produk_ids: [selectedUnmappedProduct.id],
        });
      }

      showFeedback('success', 'Berhasil Dipetakan', `Produk ${selectedUnmappedProduct.nama} berhasil dipetakan ke Class!`);
      setIsMapModal(false);
      fetchUnmapped();
      fetchClasses();
    } catch (err) {
      showFeedback('error', 'Gagal Mapping', err.message);
    }
  };

  const handleDeleteUnmapped = async (prod) => {
    setUnmappedDeleteTarget(prod);
  };

  const confirmDeleteUnmapped = async () => {
    if (!unmappedDeleteTarget) return;
    try {
      await api.delete('/admin/dataset/unmapped/' + unmappedDeleteTarget.id);
      fetchUnmapped();
    } catch (err) {
      showFeedback('error', 'Gagal Hapus', err.response?.data?.pesan || err.message);
    }
  };

  // Class management handlers
  const handleToggleAktif = async (cls) => {
    setOpenMenuId(null);
    try {
      await api.put(`/admin/dataset/class/${cls.id}/toggle-aktif`, {});
      fetchClasses();
    } catch (err) {
      showFeedback('error', 'Gagal Ubah Status', err.response?.data?.pesan || err.message);
    }
  };

  const handleOpenEdit = (cls) => {
    setOpenMenuId(null);
    setEditForm({ id: cls.id, nama: cls.nama || '', barcode: cls.barcode || '', deskripsi: cls.deskripsi || '' });
    setSelectedClassForAction(cls);
    setIsEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/dataset/class/${editForm.id}`, {
        nama: editForm.nama, barcode: editForm.barcode, deskripsi: editForm.deskripsi,
      });
      setIsEditModal(false);
      fetchClasses();
    } catch (err) {
      showFeedback('error', 'Gagal Edit Class', err.response?.data?.pesan || err.message);
    }
  };

  const handleOpenDelete = (cls) => {
    setOpenMenuId(null);
    setSelectedClassForAction(cls);
    setIsDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/admin/dataset/class/${selectedClassForAction.id}`);
      setIsDeleteModal(false);
      setSelectedClassForAction(null);
      fetchClasses();
    } catch (err) {
      showFeedback('error', 'Gagal Hapus Class', err.response?.data?.pesan || err.message);
    }
  };

  // Selective sync handler
  const handleSyncSelected = async () => {
    setIsSyncing(true);
    try {
      const res = await api.post('/admin/dataset/sync-huggingface', { class_ids: selectedClassIds });
      showFeedback('success', 'Sync Berhasil', res?.pesan || `Sync ${selectedClassIds.length} class berhasil!`);
      setSelectedClassIds([]);
      fetchSyncStatus();
      fetchClasses();
    } catch (err) {
      showFeedback('error', 'Sync Gagal', err.response?.data?.pesan || err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Barcode scanner callbacks
  const handleFormBarcodeDetected = (code) => { setAddClassBarcode(code); };
  const handleSearchBarcodeDetected = (code) => { setSearchTerm(code); };

  // Close menu on outside click
  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  // Filtered & Paginated Classes
  const filteredClasses = classes.filter((c) =>
    c.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || c.barcode?.includes(searchTerm)
  );
  const totalClassPages = Math.ceil(filteredClasses.length / classesPerPage) || 1;
  const currentClasses = filteredClasses.slice((classPage - 1) * classesPerPage, classPage * classesPerPage);

  // Filtered & Paginated Unmapped
  const filteredUnmapped = unmappedProducts.filter((p) =>
    p.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm) || p.toko?.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalUnmappedPages = Math.ceil(filteredUnmapped.length / unmappedPerPage) || 1;
  const currentUnmapped = filteredUnmapped.slice((unmappedPage - 1) * unmappedPerPage, unmappedPage * unmappedPerPage);

  // Gallery Photos
  const totalGalleryPhotos = classPhotos.length;
  const totalGalleryPages = Math.ceil(totalGalleryPhotos / photosPerPage) || 1;
  const currentGalleryPhotos = classPhotos.slice((galleryPage - 1) * photosPerPage, galleryPage * photosPerPage);

  return (
    <AdminLayout title="Data Collector & Master Class AI">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-emerald-400" /> Data Collector & Master Class AI
            </h2>
            <p className="text-xs text-slate-400">
              Katalog Master Class • Batch Sync HuggingFace Hub • Smart Barcode Mapping
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari class / barcode..."
                className="w-full pl-10 pr-10 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              <button type="button" onClick={() => setIsSearchScannerOpen(true)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors" title="Scan Barcode">
                <ScanBarcode className="w-3.5 h-3.5" />
              </button>
            </div>

            <button onClick={() => setIsAddClassModal(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-500/20">
              <Plus className="w-4 h-4" /> Tambah Class
            </button>
          </div>
        </div>

        {/* HuggingFace Sync Status & Control Banner */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">HuggingFace Dataset Sync Engine</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold border border-slate-700">
                  Repo: {syncStatus?.stats?.hf_repo || HF_REPO}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono mt-1">
                <span className="text-emerald-400 font-bold">🟢 Supabase Pending: {syncStatus?.stats?.pending_sync_count || 0} foto</span>
                <span className="text-teal-400 font-bold">🔵 HuggingFace Synced: {syncStatus?.stats?.synced_count || 0} foto</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleTriggerSync} disabled={isSyncing}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing Single Commit...' : 'Sync ke HuggingFace Now'}
            </button>
            <button onClick={() => setIsSyncConfigModal(true)}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700" title="Pengaturan Auto-Sync">
              <Sliders className="w-4 h-4" />
            </button>
            <a href={HF_DATASET_URL} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700 flex items-center gap-2" title="Buka Repository HuggingFace">
              <ExternalLink className="w-4 h-4" /> HF Repo
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 space-x-6 text-sm font-bold">
          <button onClick={() => setActiveTab('classes')}
            className={`pb-3 flex items-center gap-2 transition-colors relative ${activeTab === 'classes' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>
            <Layers className="w-4 h-4" /> Master Class AI ({classes.length})
            {activeTab === 'classes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />}
          </button>

          <button onClick={() => setActiveTab('unmapped')}
            className={`pb-3 flex items-center gap-2 transition-colors relative ${activeTab === 'unmapped' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>
            <ShoppingBag className="w-4 h-4" /> Produk Belum Ter-mapping ({unmappedProducts.length})
            {unmappedProducts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/30">
                {unmappedProducts.length} NEED MAP
              </span>
            )}
            {activeTab === 'unmapped' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />}
          </button>
        </div>

        {/* TAB 1: MASTER CLASS GRID */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between space-y-3">
                    <Skeleton className="w-full h-32 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                    <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                      <Skeleton className="h-2.5 w-20" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                ))
              ) : filteredClasses.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                  Tidak ada class produk AI yang cocok.
                </div>
              ) : (
                currentClasses.map((cls) => {
                  const photoCount = cls.total_foto !== undefined ? cls.total_foto : 0;
                  const coverPhotoUrl = cls.thumbnail_url;
                  const isAktif = cls.aktif !== false;
                  const isSelected = selectedClassIds.includes(cls.id);
                  return (
                    <div key={cls.id}
                      onClick={() => handleOpenGallery(cls)}
                      className={`p-4 rounded-3xl bg-slate-900/90 border ${isSelected ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800/80'} hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between ${!isAktif ? 'opacity-50' : ''}`}>
                      
                      {/* Checkbox for selective sync */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) setSelectedClassIds([...selectedClassIds, cls.id]);
                          else setSelectedClassIds(selectedClassIds.filter(id => id !== cls.id));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 left-2 z-20 w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                      />

                      {/* 3-dot menu */}
                      <div className="absolute top-2 right-2 z-20" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === cls.id ? null : cls.id)}
                          className="p-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors backdrop-blur-md">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {openMenuId === cls.id && (
                          <div className="absolute right-0 mt-1 w-44 rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-30 py-1">
                            <button onClick={() => handleToggleAktif(cls)}
                              className="w-full px-3 py-2 text-left text-[11px] font-semibold text-slate-200 hover:bg-slate-700 flex items-center gap-2 transition-colors">
                              <Power className="w-3.5 h-3.5" /> {isAktif ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button onClick={() => handleOpenEdit(cls)}
                              className="w-full px-3 py-2 text-left text-[11px] font-semibold text-slate-200 hover:bg-slate-700 flex items-center gap-2 transition-colors">
                              <Pencil className="w-3.5 h-3.5" /> Edit Class
                            </button>
                            <button onClick={() => handleOpenDelete(cls)}
                              className="w-full px-3 py-2 text-left text-[11px] font-semibold text-rose-400 hover:bg-slate-700 flex items-center gap-2 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Hapus Class
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="w-full h-32 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 mb-3 relative">
                          {coverPhotoUrl ? (
                            <img src={coverPhotoUrl} alt={cls.nama} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-500">
                              <ImageIcon className="w-6 h-6 mb-1 text-slate-600" />
                              <span className="text-[9px] font-mono text-slate-600">HF DATASET</span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-xs text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">{cls.nama}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                          <Tag className="w-3 h-3 text-slate-500" /> {cls.barcode || 'NO-BARCODE'}
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span className={`flex items-center gap-1 ${isAktif ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isAktif ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {isAktif ? 'Aktif' : 'Nonaktif'} · {photoCount} Foto
                        </span>
                        <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">Galeri →</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {totalClassPages > 1 && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                <span>Menampilkan {(classPage - 1) * classesPerPage + 1} - {Math.min(classPage * classesPerPage, filteredClasses.length)} dari {filteredClasses.length} Class</span>
                <div className="flex items-center gap-2">
                  <button disabled={classPage === 1} onClick={() => setClassPage((p) => Math.max(p - 1, 1))} className="p-2 rounded-xl bg-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="font-bold text-slate-200 px-3">{classPage} / {totalClassPages}</span>
                  <button disabled={classPage === totalClassPages} onClick={() => setClassPage((p) => Math.min(p + 1, totalClassPages))} className="p-2 rounded-xl bg-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UNMAPPED PRODUCTS TABLE */}
        {activeTab === 'unmapped' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-3">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" /> Produk Toko Belum Ter-mapping ke Class AI
                </h3>
                <p className="text-xs text-slate-400">Petakan produk baru dari toko ke Class AI existing atau buat Class baru</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Nama Produk Toko</th>
                    <th className="px-6 py-4">Toko Owner</th>
                    <th className="px-6 py-4">Barcode</th>
                    <th className="px-6 py-4">Status Mapping</th>
                    <th className="px-6 py-4 text-right">Aksi Mapping</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {isUnmappedLoading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Memuat produk unmapped...</td></tr>
                  ) : currentUnmapped.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Semua produk toko telah ter-mapping ke Class AI! 🎉</td></tr>
                  ) : (
                    currentUnmapped.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-100">{p.nama}</td>
                        <td className="px-6 py-4 text-slate-300 font-medium">{p.toko?.nama || 'Toko'}</td>
                        <td className="px-6 py-4 font-mono text-slate-400">{p.barcode || 'TANPA BARCODE'}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">UNMAPPED</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleOpenMapModal(p)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                              <LinkIcon className="w-3.5 h-3.5" /> Petakan
                            </button>
                            <button onClick={() => handleDeleteUnmapped(p)}
                              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all" title="Hapus Produk">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalUnmappedPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-400">
                <span>{(unmappedPage - 1) * unmappedPerPage + 1} - {Math.min(unmappedPage * unmappedPerPage, filteredUnmapped.length)} dari {filteredUnmapped.length} Produk</span>
                <div className="flex items-center gap-2">
                  <button disabled={unmappedPage === 1} onClick={() => setUnmappedPage((p) => Math.max(p - 1, 1))} className="p-2 rounded-xl bg-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="font-bold text-slate-200 px-3">{unmappedPage} / {totalUnmappedPages}</span>
                  <button disabled={unmappedPage === totalUnmappedPages} onClick={() => setUnmappedPage((p) => Math.min(p + 1, totalUnmappedPages))} className="p-2 rounded-xl bg-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GALLERY MODAL WITH BADGES */}
      {selectedClass && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-400" /> Galeri Dataset: {selectedClass.nama}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Slug: {selectedClass.slug || selectedClass.nama} • Total: {totalGalleryPhotos} Foto
                </p>
              </div>
              <button onClick={() => setSelectedClass(null)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
              {isPhotoLoading ? (
                <div className="col-span-full py-16 text-center text-slate-500 text-xs">Memuat foto dataset...</div>
              ) : totalGalleryPhotos === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 text-xs">Tidak ada foto dataset untuk class ini.</div>
              ) : (
                currentGalleryPhotos.map((p, idx) => {
                  const isHf = p.lokasi === 'huggingface';
                  return (
                    <div key={p.id || idx} onClick={() => setPreviewPhoto(p)}
                      className="group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square cursor-pointer hover:border-emerald-500/50 transition-all">
                      <img src={p.foto_url} alt={p.file_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold backdrop-blur-md border ${isHf ? 'bg-teal-500/80 text-white border-teal-400' : 'bg-emerald-500/80 text-slate-950 border-emerald-400'}`}>
                        {isHf ? '🔵 HuggingFace' : '🟢 Supabase'}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                        <p className="text-[9px] font-mono text-slate-100 truncate">{p.file_name || 'foto.jpg'}</p>
                        <span className="text-[8px] text-emerald-400 font-semibold flex items-center gap-1"><Maximize2 className="w-2.5 h-2.5" /> Preview</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {totalGalleryPhotos > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 gap-2">
                <span>Foto #{(galleryPage - 1) * photosPerPage + 1} - {Math.min(galleryPage * photosPerPage, totalGalleryPhotos)} dari {totalGalleryPhotos} Foto</span>
                <div className="flex items-center gap-2">
                  <button disabled={galleryPage === 1} onClick={() => setGalleryPage((p) => Math.max(p - 1, 1))} className="px-3 py-1.5 rounded-xl bg-slate-800 disabled:opacity-40">Prev</button>
                  <span className="font-bold text-slate-200 px-2">{galleryPage} / {totalGalleryPages}</span>
                  <button disabled={galleryPage === totalGalleryPages} onClick={() => setGalleryPage((p) => Math.min(p + 1, totalGalleryPages))} className="px-3 py-1.5 rounded-xl bg-slate-800 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-emerald-400">{previewPhoto.file_name}</span>
              <button onClick={() => setPreviewPhoto(null)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden">
              <img src={previewPhoto.foto_url} alt={previewPhoto.file_name} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* SYNC CONFIG MODAL */}
      {isSyncConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Pengaturan HuggingFace Auto-Sync</h3>
              <button onClick={() => setIsSyncConfigModal(false)} className="p-1 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveSyncConfig} className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-200">Auto-Sync by Threshold</p>
                  <p className="text-[10px] text-slate-400">Trigger sync otomatis saat foto mencapai threshold</p>
                </div>
                <input type="checkbox" checked={syncConfigForm.auto_sync_enabled}
                  onChange={(e) => setSyncConfigForm({ ...syncConfigForm, auto_sync_enabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Threshold Jumlah Foto</label>
                <input type="number" value={syncConfigForm.threshold_count}
                  onChange={(e) => setSyncConfigForm({ ...syncConfigForm, threshold_count: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono" />
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-200">Scheduled Sync (Cron Job)</p>
                  <p className="text-[10px] text-slate-400">Jadwal rutin sync pada jam tertentu</p>
                </div>
                <input type="checkbox" checked={syncConfigForm.cron_enabled}
                  onChange={(e) => setSyncConfigForm({ ...syncConfigForm, cron_enabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ekspresi Cron (Default: jam 2 pagi)</label>
                <input type="text" value={syncConfigForm.cron_expression}
                  onChange={(e) => setSyncConfigForm({ ...syncConfigForm, cron_expression: e.target.value })}
                  placeholder="0 2 * * *"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setIsSyncConfigModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20">Simpan Config</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAPPING MODAL FOR UNMAPPED PRODUCTS */}
      {isMapModal && selectedUnmappedProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Pemetaan Produk ke Class AI</h3>
              <button onClick={() => setIsMapModal(false)} className="p-1 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">Produk Toko:</p>
              <p className="font-bold text-slate-100">{selectedUnmappedProduct.nama}</p>
              <p className="font-mono text-slate-400 text-[11px]">Barcode: {selectedUnmappedProduct.barcode || 'TANPA BARCODE'}</p>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button type="button" onClick={() => setMapMode('existing')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold ${mapMode === 'existing' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>
                Class Existing
              </button>
              <button type="button" onClick={() => setMapMode('new')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold ${mapMode === 'new' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>
                + Buat Class Baru
              </button>
            </div>

            <form onSubmit={handleExecuteMapping} className="space-y-3">
              {mapMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Class AI Target</label>
                  <select value={targetClassId} onChange={(e) => setTargetClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-bold focus:outline-none">
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.nama} ({c.barcode || 'No Barcode'})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Class AI Baru</label>
                  <input type="text" required value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Barcode Varian (Otomatis ditautkan)</label>
                <input type="text" value={mapBarcode} onChange={(e) => setMapBarcode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setIsMapModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20">Eksekusi Pemetaan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CLASS MODAL */}
      {isAddClassModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Tambah Master Class Produk AI</h3>
            <form onSubmit={handleAddClass} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Class Produk</label>
                <input type="text" required value={addClassName} onChange={(e) => setAddClassName(e.target.value)}
                  placeholder="Misal: INDOMIE GORENG JUMBO 120G"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Barcode (EAN-13)</label>
                <div className="flex gap-2">
                  <input type="text" value={addClassBarcode} onChange={(e) => setAddClassBarcode(e.target.value)}
                    placeholder="8998866200112"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none" />
                  <button type="button" onClick={() => setIsFormScannerOpen(true)}
                    className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors shrink-0" title="Scan Barcode">
                    <ScanBarcode className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi / Brand</label>
                <textarea rows={2} value={addClassDesc} onChange={(e) => setAddClassDesc(e.target.value)}
                  placeholder="Indofood Mie Instan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setIsAddClassModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">Simpan Class</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Class Modal */}
      {isEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2"><Pencil className="w-4 h-4 text-emerald-400" /> Edit Master Class</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Class Produk</label>
                <input type="text" required value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Barcode</label>
                <div className="flex gap-2">
                  <input type="text" value={editForm.barcode} onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none" />
                  <button type="button" onClick={() => setIsFormScannerOpen(true)}
                    className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 shrink-0">
                    <ScanBarcode className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi / Brand</label>
                <textarea rows={2} value={editForm.deskripsi} onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setIsEditModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {isDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Hapus Class "{selectedClassForAction?.nama}"?</h3>
              <p className="text-xs text-slate-400 mt-1">Jika class memiliki foto dataset, hapus atau pindahkan foto terlebih dahulu.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsDeleteModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Batal</button>
              <button onClick={handleConfirmDelete} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner — Form Tambah Class */}
      <BarcodeScannerModal
        isOpen={isFormScannerOpen}
        onClose={() => setIsFormScannerOpen(false)}
        onDetected={handleFormBarcodeDetected}
        title="Scan Barcode untuk Class"
      />

      {/* Barcode Scanner — Search */}
      <BarcodeScannerModal
        isOpen={isSearchScannerOpen}
        onClose={() => setIsSearchScannerOpen(false)}
        onDetected={handleSearchBarcodeDetected}
        title="Scan Barcode untuk Cari"
      />

      {/* Floating Action Bar — Selective Sync */}
      {selectedClassIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-200">{selectedClassIds.length} Class Dipilih</span>
          <button onClick={handleSyncSelected} disabled={isSyncing}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Selected ke HF
          </button>
          <button onClick={() => setSelectedClassIds([])} className="text-slate-400 hover:text-slate-200 text-xs font-semibold">Batal</button>
        </div>
      )}

      {/* Confirm Hapus Produk Unmapped */}
      <ConfirmModal
        isOpen={!!unmappedDeleteTarget}
        onClose={() => setUnmappedDeleteTarget(null)}
        title="Hapus Produk Unmapped"
        message={`Hapus produk "${unmappedDeleteTarget?.nama || ''}" dari daftar?`}
        confirmText="Ya, Hapus"
        isDanger
        onConfirm={async () => {
          await confirmDeleteUnmapped();
          setUnmappedDeleteTarget(null);
        }}
      />

      {/* Feedback Modal (replaces native alert) */}

    </AdminLayout>
  );
}
