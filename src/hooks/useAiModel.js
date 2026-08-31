'use client';

import { useState } from 'react';
import { api, getApiBaseUrl } from '@/lib/api';
import { getTf } from '@/lib/tf';

/**
 * useAiModel — muat model TFJS aktif + class labels + mapping barcode AI.
 * Mengisolasi bagian AI-model agar pos-engine.jsx lebih ramping.
 * TIDAK menangani: camera, AI loop, barcode scan — itu tetap di screen (coupling UI state).
 */
export function useAiModel() {
  // TFJS Model & Mapping States
  const [modelInfo, setModelInfo] = useState(null);
  const [modelMapping, setModelMapping] = useState([]);
  const [tfModel, setTfModel] = useState(null);
  const [modelError, setModelError] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [classLabels, setClassLabels] = useState([]);

  const fetchActiveModel = async () => {
    setIsModelLoading(true);
    setModelError(null);
    try {
      const res = await api.get('/kasir/ai/active-model');
      if (res?.berhasil && res.data) {
        const { model, mappings } = res.data;
        setModelInfo(model);
        setModelMapping(mappings);

        const tf = await getTf();
        await tf.ready();

        // 1. Try loading from local IndexedDB cache for instant speed
        const cacheKey = `indexeddb://tokiva-model-${model.id || model.versi || 'v1'}`;
        let loadedModel = null;
        try {
          loadedModel = await tf.loadGraphModel(cacheKey + "-graph");
          console.log('⚡ Model AI berhasil dimuat dari IndexedDB local cache!');
        } catch {
          // 2. Download from remote Supabase bucket
          if (model.model_json_url) {
            // Dev-local rewrite: production host blocked by CORS from localhost origin.
            let modelUrl = model.model_json_url;
            const apiOrigin = (() => {
              try { return new URL(getApiBaseUrl()).origin; } catch { return null; }
            })();
            if (apiOrigin && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
              modelUrl = modelUrl.replace(/^https?:\/\/[^/]+/, apiOrigin);
            }
            console.log('📥 Mengunduh model AI:', modelUrl);
            loadedModel = await tf.loadGraphModel(modelUrl);
            // Save to IndexedDB cache
            try {
              await loadedModel.save(cacheKey + '-graph');
              console.log('💾 Model AI berhasil disimpan ke IndexedDB cache!');
            } catch (saveErr) {
              console.warn('Gagal menyimpan model ke IndexedDB cache:', saveErr);
            }
          }
        }

        if (loadedModel) {
          setTfModel(loadedModel);
        }

        // Fetch class labels from class.json (derived from model_json_url path)
        try {
          let modelDir = model.model_json_url.replace(/\/model\.json$/, '');
          const apiOrigin = (() => {
            try { return new URL(getApiBaseUrl()).origin; } catch { return null; }
          })();
          if (apiOrigin && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            modelDir = modelDir.replace(/^https?:\/\/[^/]+/, apiOrigin);
          }
          const resp = await fetch(modelDir + '/class.json');
          const classesJson = await resp.json();
          const labels = Array.isArray(classesJson)
            ? classesJson
            : Object.keys(classesJson).sort((a,b) => Number(a)-Number(b)).map(k => classesJson[k]);
          if (labels.length > 0) {
            setClassLabels(labels);
            console.log('📋 Class labels loaded:', labels.length);
          }
        } catch (e) {
          console.warn('Gagal memuat class labels:', e);
        }
      } else {
        setModelError(res?.pesan || 'Model AI aktif tidak ditemukan.');
      }
    } catch (err) {
      console.warn('Gagal memuat model AI aktif:', err.message);
      setModelError(err.message || 'Terjadi kesalahan saat mengunduh model AI.');
    } finally {
      setIsModelLoading(false);
    }
  };

  return {
    modelInfo, setModelInfo,
    modelMapping, setModelMapping,
    tfModel, setTfModel,
    modelError, setModelError,
    isModelLoading, setIsModelLoading,
    classLabels, setClassLabels,
    fetchActiveModel,
  };
}
