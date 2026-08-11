'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Zap, RefreshCw, CheckCircle2, AlertCircle, Loader2,
  TrendingUp, Target, Clock, Cpu, AlertTriangle, ExternalLink,
} from 'lucide-react';

export default function TrainingPanel({ onTrainingComplete }) {
  const [trainStatus, setTrainStatus] = useState('idle'); // idle | running | complete | error
  const [trainResult, setTrainResult] = useState(null);
  const [trainError, setTrainError] = useState(null);
  const [kaggleUrl, setKaggleUrl] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  const getToken = () => localStorage.getItem('tokiva_admin_token') || localStorage.getItem('tokiva_jwt_token');

  // Elapsed timer
  useEffect(() => {
    if (trainStatus === 'running') {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [trainStatus]);

  // Cleanup poll on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const res = await api.get('/admin/model/train/status', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res?.berhasil) {
        setTrainStatus('error');
        setTrainError(res?.pesan || 'Unknown error');
        return;
      }

      const { status, kaggle_url } = res.data;
      if (kaggle_url) setKaggleUrl(kaggle_url);

      if (status === 'running') {
        setTrainStatus('running');
        // Poll again in 15s
        pollRef.current = setTimeout(pollStatus, 15000);
      } else if (status === 'complete') {
        setTrainStatus('complete');
        setTrainResult(res.data);
        if (onTrainingComplete) onTrainingComplete();
      } else if (status === 'error') {
        setTrainStatus('error');
        setTrainError(res.data?.raw || 'Kaggle kernel error');
      } else {
        // unknown — keep polling
        pollRef.current = setTimeout(pollStatus, 15000);
      }
    } catch (err) {
      setTrainStatus('error');
      setTrainError(err.response?.data?.pesan || err.message);
    }
  }, []);

  const handleTriggerTrain = async () => {
    if (!confirm('Trigger training di Kaggle? GPU T4x2 aktif. Estimasi 30-40 menit.')) return;

    setTrainStatus('running');
    setTrainResult(null);
    setTrainError(null);
    setElapsed(0);

    try {
      const res = await api.post('/admin/model/train', {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res?.berhasil) {
        setTrainStatus('error');
        setTrainError(res?.pesan || 'Gagal trigger training');
        return;
      }

      if (res.data?.kaggle_url) setKaggleUrl(res.data.kaggle_url);

      // Start polling after 30s (give Kaggle time to spin up)
      pollRef.current = setTimeout(pollStatus, 30000);
    } catch (err) {
      setTrainStatus('error');
      setTrainError(err.response?.data?.pesan || err.message);
    }
  };

  const handleManualPoll = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollStatus();
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Training Pipeline (Kaggle GPU)
          </h3>
          <p className="text-xs text-slate-400">Trigger training otomatis • Dataset dari HuggingFace • Export TFJS</p>
        </div>
        {trainStatus === 'idle' && (
          <button onClick={handleTriggerTrain}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
            <Zap className="w-4 h-4" /> Train Model
          </button>
        )}
        {trainStatus === 'running' && (
          <button onClick={handleManualPoll}
            className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Cek Status
          </button>
        )}
        {(trainStatus === 'complete' || trainStatus === 'error') && (
          <button onClick={() => { setTrainStatus('idle'); setTrainResult(null); setTrainError(null); }}
            className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold">
            Reset
          </button>
        )}
      </div>

      {/* Status Body */}
      <div className="p-4 space-y-4">
        {/* IDLE */}
        {trainStatus === 'idle' && (
          <div className="text-center py-6">
            <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-semibold">Siap Training</p>
            <p className="text-xs text-slate-500 mt-1">
              Notebook: MobileNetV3Large + CBAM • 24 Class • 4800 Foto
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> GPU T4x2</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Internet ON</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> HF Dataset</span>
            </div>
          </div>
        )}

        {/* RUNNING */}
        {trainStatus === 'running' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              <div>
                <p className="text-sm font-bold text-amber-400">Training Berjalan...</p>
                <p className="text-xs text-slate-400">Elapsed: {formatTime(elapsed)} • Auto-poll setiap 15s</p>
              </div>
            </div>
            <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Estimasi waktu</span>
                <span className="text-slate-300 font-mono">~30-40 menit</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full animate-pulse"
                  style={{ width: `${Math.min((elapsed / 2400) * 100, 95)}%` }} />
              </div>
            </div>
            {kaggleUrl && (
              <a href={kaggleUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300">
                <ExternalLink className="w-3.5 h-3.5" /> Lihat di Kaggle
              </a>
            )}
          </div>
        )}

        {/* COMPLETE */}
        {trainStatus === 'complete' && trainResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-emerald-400">Training Selesai!</p>
                <p className="text-xs text-slate-400">Model otomatis terdaftar di registry</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard icon={Target} label="Accuracy" value={`${((trainResult.akurasi || 0) * 100).toFixed(2)}%`} color="emerald" />
              <MetricCard icon={TrendingUp} label="F1 Macro" value={trainResult.f1_macro ? (trainResult.f1_macro * 100).toFixed(2) + '%' : '-'} color="sky" />
              <MetricCard icon={AlertTriangle} label="Misclassified" value={trainResult.num_misclassified ?? '-'} color="amber" />
              <MetricCard icon={Clock} label="Train Time" value={trainResult.training_time_s ? formatTime(Math.round(trainResult.training_time_s)) : '-'} color="slate" />
            </div>

            {/* Model Info */}
            <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Versi</span>
                <span className="text-slate-200 font-mono">{trainResult.versi}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Best Epoch</span>
                <span className="text-slate-200 font-mono">{trainResult.best_epoch ?? '-'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Test Images</span>
                <span className="text-slate-200 font-mono">{trainResult.num_test_images ?? '-'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Inference</span>
                <span className="text-slate-200 font-mono">{trainResult.inference_ms ? trainResult.inference_ms.toFixed(2) + ' ms' : '-'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Classes</span>
                <span className="text-slate-200 font-mono">{trainResult.num_classes ?? '-'}</span>
              </div>
            </div>

            {/* Error Summary */}
            {trainResult.error_summary && trainResult.error_summary.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Kesalahan Model per Class
                </p>
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Class</th>
                        <th className="px-3 py-2 text-center">Errors</th>
                        <th className="px-3 py-2">Most Confused</th>
                        <th className="px-3 py-2 text-center">Avg Conf</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {trainResult.error_summary.map((e, i) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          <td className="px-3 py-2 text-slate-200 font-mono">{e.true_label}</td>
                          <td className="px-3 py-2 text-center text-rose-400 font-bold">{e.total_errors}</td>
                          <td className="px-3 py-2 text-amber-400 font-mono">→ {e.most_confused_with}</td>
                          <td className="px-3 py-2 text-center text-slate-400 font-mono">{((e.avg_confidence || 0) * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {kaggleUrl && (
              <a href={kaggleUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300">
                <ExternalLink className="w-3.5 h-3.5" /> Lihat detail di Kaggle
              </a>
            )}
          </div>
        )}

        {/* ERROR */}
        {trainStatus === 'error' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400" />
              <div>
                <p className="text-sm font-bold text-rose-400">Training Gagal</p>
                <p className="text-xs text-slate-400">{trainError}</p>
              </div>
            </div>
            {kaggleUrl && (
              <a href={kaggleUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300">
                <ExternalLink className="w-3.5 h-3.5" /> Cek log di Kaggle
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    slate: 'text-slate-300 bg-slate-700/20 border-slate-600/30',
  };
  return (
    <div className={`rounded-2xl p-3 border ${colors[color] || colors.slate}`}>
      <Icon className="w-4 h-4 mb-1 opacity-80" />
      <p className="text-[10px] uppercase tracking-wider opacity-60">{label}</p>
      <p className="text-lg font-bold font-mono">{value}</p>
    </div>
  );
}
