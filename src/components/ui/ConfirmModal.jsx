import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, title = 'Konfirmasi Aksi', message = 'Apakah Anda yakin ingin melanjutkan?', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', onConfirm, isLoading = false, isDanger = false }) {
  return <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex flex-col items-center text-center">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${isDanger ? 'bg-[#FFF0F0] text-[#D94850]' : 'bg-[#FFF8D9] text-amber-600'}`}><AlertTriangle className="w-6 h-6" /></div>
      <p className="text-[12px] leading-5 text-[#68758A] max-w-[300px]">{message}</p>
      <div className="flex flex-col-reverse sm:flex-row gap-2 w-full mt-6"><Button variant="secondary" fullWidth onClick={onClose} disabled={isLoading}>{cancelText}</Button><Button variant={isDanger ? 'danger' : 'primary'} fullWidth onClick={onConfirm} isLoading={isLoading}>{confirmText}</Button></div>
    </div>
  </Modal>;
}

