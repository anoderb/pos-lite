'use client';

import React from 'react';
import AdminLayout from '@/components/layout/admin/AdminLayout';
import {
  Cpu, UploadCloud, Layers, CheckCircle2, FlaskConical, Inbox,
  ChevronLeft, ChevronRight, Trash2, X,
} from 'lucide-react';

import ModelBanner from './_components/ModelBanner';
import TestingSandbox from './_components/TestingSandbox';
import TrainingPanel from './_components/TrainingPanel';
import ModelDetailModal from './_components/ModelDetailModal';
import RegisterModelModal from './_components/RegisterModelModal';
import ModelConfirmModals from './_components/ModelConfirmModals';
import Skeleton from '@/components/ui/Skeleton';
import { useModelAdmin } from './_hooks/useModelAdmin';

export default function AdminModelPage() {
  const {
    models, setModels, activeModel, testingModel, isLoading,
    loadedTfModel, classes, isModelLoading,
    threshold, setThreshold,
    predictionResult, setPredictionResult, inferenceMs, testImagePreview,
    isRegisterModal, setIsRegisterModal, uploadMethod, setUploadMethod,
    versi, setVersi, namaModel, setNamaModel, deskripsi, setDeskripsi,
    akurasi, setAkurasi, selectedFiles, selectedZipFile,
    uploadedFileSizeMb, setUploadedFileSizeMb,
    modelJsonUrl, setModelJsonUrl, weightsUrl, setWeightsUrl,
    deployModelTarget, setDeployModelTarget, versiOverride, setVersiOverride,
    deleteModelTarget, setDeleteModelTarget, detailModel, setDetailModel,
    currentPage, setCurrentPage, itemsPerPage, totalPages, currentModels,
    fetchInitialData, handleSelectModelForTesting, handleToggleWebcam,
    handleFileUploadTest, handleSaveThreshold, handleDeployToPOS,
    handleDeleteModel, handleRegisterModel, handleDirectFilesChange,
    handleZipFileChange, webcam,
  } = useModelAdmin();

  return (
    <AdminLayout title="AI Model Deployment & Testing Sandbox">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" /> AI Model Deployment & MLOps Sandbox
            </h2>
            <p className="text-xs text-slate-400">
              Pengujian Realtime TFJS Model • <strong>{classes.length} Class Labels Loaded</strong>
            </p>
          </div>
          <button onClick={() => setIsRegisterModal(true)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-500/20">
            <UploadCloud className="w-4 h-4" /> Upload Model TFJS / ZIP
          </button>
        </div>

        {/* Banner */}
        <ModelBanner
          model={activeModel} classes={classes} threshold={threshold} setThreshold={setThreshold}
          onSaveThreshold={handleSaveThreshold} inferenceMs={inferenceMs}
          modelLoaded={!!loadedTfModel} modelLoading={isModelLoading}
          onRegister={() => setIsRegisterModal(true)}
        />

        {/* Training Pipeline (Kaggle) */}
        <TrainingPanel onTrainingComplete={fetchInitialData} />

        {/* Testing Sandbox */}
        <TestingSandbox
          testingModel={testingModel} videoRef={webcam.videoRef}
          webcamActive={webcam.active} onToggleWebcam={handleToggleWebcam}
          prediction={predictionResult} threshold={threshold} inferenceMs={inferenceMs}
          onFileUpload={handleFileUploadTest} testImagePreview={testImagePreview}
        />

        {/* Model Registry Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-3">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" /> Registri Versi Model AI
            </h3>
            <p className="text-xs text-slate-400">Pilih model untuk diuji di Sandbox atau terapkan secara live ke POS</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Versi Model & Arsitektur</th>
                  <th className="px-6 py-4">Val Accuracy</th>
                  <th className="px-6 py-4">Threshold</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-9 h-9 rounded-2xl shrink-0" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-2.5 w-40" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><Skeleton className="h-3.5 w-14" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-3.5 w-12" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-xl" /></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Skeleton className="h-7 w-16 rounded-xl" />
                          <Skeleton className="h-7 w-20 rounded-xl" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : models.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">Belum Ada Model AI Terdaftar</p>
                  </td></tr>
                ) : currentModels.map((m) => {
                  const isAktif = m.status === 'aktif';
                  const isTesting = testingModel?.id === m.id;
                  return (
                    <tr key={m.id} onClick={() => setDetailModel(m)} className={`transition-colors cursor-pointer ${isTesting ? 'bg-emerald-500/5' : 'hover:bg-slate-800/40'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 ${isTesting ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-100">{m.nama || m.versi}</p>
                              {isTesting && <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">SANDBOX</span>}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">Versi: {m.versi} • {m.ukuran_mb || 0} MB</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-emerald-400 font-bold">{((m.akurasi || 0) * 100).toFixed(1)}%</td>
                      <td className="px-6 py-4 font-mono text-slate-300">{((m.confidence_threshold || 0.65) * 100).toFixed(0)}%</td>
                      <td className="px-6 py-4">
                        {isAktif ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> LIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 text-[11px] font-semibold border border-slate-700/50">STAGING</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => handleSelectModelForTesting(m)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${isTesting ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
                            <FlaskConical className="w-3.5 h-3.5" /> Uji
                          </button>
                          {!isAktif && (
                            <>
                              <button onClick={() => setDeployModelTarget(m)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20">
                                🚀 Deploy
                              </button>
                              <button onClick={() => setDeleteModelTarget(m)} title="Hapus"
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-400">
              <span>{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, models.length)} dari {models.length}</span>
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"><ChevronLeft className="w-4 h-4" /></button>
                <span className="font-bold text-slate-200 px-3">{currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Register Model */}
      <RegisterModelModal
        isOpen={isRegisterModal} onClose={() => setIsRegisterModal(false)}
        uploadMethod={uploadMethod} setUploadMethod={setUploadMethod}
        versi={versi} setVersi={setVersi} namaModel={namaModel} setNamaModel={setNamaModel}
        akurasi={akurasi} setAkurasi={setAkurasi}
        uploadedFileSizeMb={uploadedFileSizeMb} setUploadedFileSizeMb={setUploadedFileSizeMb}
        deskripsi={deskripsi} setDeskripsi={setDeskripsi}
        selectedFiles={selectedFiles} handleDirectFilesChange={handleDirectFilesChange}
        selectedZipFile={selectedZipFile} handleZipFileChange={handleZipFileChange}
        modelJsonUrl={modelJsonUrl} setModelJsonUrl={setModelJsonUrl}
        weightsUrl={weightsUrl} setWeightsUrl={setWeightsUrl}
        handleRegisterModel={handleRegisterModel}
      />

      {/* Modal: Detail Model (klik row) */}
      <ModelDetailModal model={detailModel} onClose={() => setDetailModel(null)} />

      {/* Modal: Deploy & Delete */}
      <ModelConfirmModals
        deployModelTarget={deployModelTarget} setDeployModelTarget={setDeployModelTarget}
        versiOverride={versiOverride} setVersiOverride={setVersiOverride}
        handleDeployToPOS={handleDeployToPOS}
        deleteModelTarget={deleteModelTarget} setDeleteModelTarget={setDeleteModelTarget}
        handleDeleteModel={handleDeleteModel}
      />

    </AdminLayout>
  );
}
