'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/ToastProvider';

/**
 * useDataCollector — state & operasi halaman Data Collector & Master Class AI (admin).
 * Return nama identik dengan page lama agar wiring drop-in.
 */
export function useDataCollector() {
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

  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [unmappedDeleteTarget, setUnmappedDeleteTarget] = useState(null);
  const showFeedback = useCallback((type, title, message) => toast[type](message, { title }), []);
  const [isSyncConfigModal, setIsSyncConfigModal] = useState(false);
  const [syncConfigForm, setSyncConfigForm] = useState({
    auto_sync_enabled: false,
    threshold_count: 500,
    cron_enabled: false,
    cron_expression: '0 2 * * *',
  });

  const [isMapModal, setIsMapModal] = useState(false);
  const [selectedUnmappedProduct, setSelectedUnmappedProduct] = useState(null);
  const [mapMode, setMapMode] = useState('existing'); // 'existing' | 'new'
  const [targetClassId, setTargetClassId] = useState('');
  const [mapBarcode, setMapBarcode] = useState('');
  const [newClassName, setNewClassName] = useState('');

  const [classPage, setClassPage] = useState(1);
  const classesPerPage = 8;
  const [unmappedPage, setUnmappedPage] = useState(1);
  const unmappedPerPage = 10;
  const [galleryPage, setGalleryPage] = useState(1);
  const photosPerPage = 20;

  const [addClassName, setAddClassName] = useState('');
  const [addClassBarcode, setAddClassBarcode] = useState('');
  const [addClassDesc, setAddClassDesc] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [isEditModal, setIsEditModal] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', nama: '', barcode: '', deskripsi: '' });
  const [selectedClassForAction, setSelectedClassForAction] = useState(null);

  const [isFormScannerOpen, setIsFormScannerOpen] = useState(false);
  const [isSearchScannerOpen, setIsSearchScannerOpen] = useState(false);

  const [selectedClassIds, setSelectedClassIds] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchSyncStatus();
    fetchUnmapped();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleToggleAktif = async (cls) => {
    setSelectedClassForAction(cls);
    setEditForm({ id: cls.id, nama: cls.nama, barcode: cls.barcode, deskripsi: cls.deskripsi || '' });
    setIsEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/dataset/class/${selectedClassForAction.id}`, editForm);
      setIsEditModal(false);
      fetchClasses();
    } catch (err) {
      showFeedback('error', 'Gagal Update', err.response?.data?.pesan || err.message);
    }
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

  const handleFormBarcodeDetected = (code) => { setAddClassBarcode(code); };
  const handleSearchBarcodeDetected = (code) => { setSearchTerm(code); };

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  // Filtered & Paginated
  const filteredClasses = classes.filter((c) =>
    c.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || c.barcode?.includes(searchTerm)
  );
  const totalClassPages = Math.ceil(filteredClasses.length / classesPerPage) || 1;
  const currentClasses = filteredClasses.slice((classPage - 1) * classesPerPage, classPage * classesPerPage);

  const filteredUnmapped = unmappedProducts.filter((p) =>
    p.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm) || p.toko?.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalUnmappedPages = Math.ceil(filteredUnmapped.length / unmappedPerPage) || 1;
  const currentUnmapped = filteredUnmapped.slice((unmappedPage - 1) * unmappedPerPage, unmappedPage * unmappedPerPage);

  const totalGalleryPhotos = classPhotos.length;
  const totalGalleryPages = Math.ceil(totalGalleryPhotos / photosPerPage) || 1;
  const currentGalleryPhotos = classPhotos.slice((galleryPage - 1) * photosPerPage, galleryPage * photosPerPage);

  return {
    activeTab, setActiveTab,
    classes, setClasses,
    unmappedProducts, setUnmappedProducts,
    selectedClass, setSelectedClass,
    classPhotos, setClassPhotos,
    isLoading, setIsLoading,
    isUnmappedLoading, setIsUnmappedLoading,
    isPhotoLoading, setIsPhotoLoading,
    searchTerm, setSearchTerm,
    isAddClassModal, setIsAddClassModal,
    syncStatus, setSyncStatus,
    isSyncing, setIsSyncing,
    unmappedDeleteTarget, setUnmappedDeleteTarget,
    showFeedback,
    isSyncConfigModal, setIsSyncConfigModal,
    syncConfigForm, setSyncConfigForm,
    isMapModal, setIsMapModal,
    selectedUnmappedProduct, setSelectedUnmappedProduct,
    mapMode, setMapMode,
    targetClassId, setTargetClassId,
    mapBarcode, setMapBarcode,
    newClassName, setNewClassName,
    classPage, setClassPage,
    classesPerPage,
    unmappedPage, setUnmappedPage,
    unmappedPerPage,
    galleryPage, setGalleryPage,
    photosPerPage,
    addClassName, setAddClassName,
    addClassBarcode, setAddClassBarcode,
    addClassDesc, setAddClassDesc,
    previewPhoto, setPreviewPhoto,
    openMenuId, setOpenMenuId,
    isEditModal, setIsEditModal,
    isDeleteModal, setIsDeleteModal,
    editForm, setEditForm,
    selectedClassForAction, setSelectedClassForAction,
    isFormScannerOpen, setIsFormScannerOpen,
    isSearchScannerOpen, setIsSearchScannerOpen,
    selectedClassIds, setSelectedClassIds,
    fetchClasses, fetchUnmapped, fetchSyncStatus,
    handleOpenGallery, handleTriggerSync, handleSaveSyncConfig,
    handleAddClass, handleOpenMapModal, handleExecuteMapping,
    handleDeleteUnmapped, confirmDeleteUnmapped,
    handleToggleAktif, handleSaveEdit, handleConfirmDelete,
    handleSyncSelected,
    handleFormBarcodeDetected, handleSearchBarcodeDetected,
    filteredClasses, totalClassPages, currentClasses,
    filteredUnmapped, totalUnmappedPages, currentUnmapped,
    totalGalleryPhotos, totalGalleryPages, currentGalleryPhotos,
  };
}
