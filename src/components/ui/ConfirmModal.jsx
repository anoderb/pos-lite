import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

/**
 * Reusable Confirmation Modal Template
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  title = 'Konfirmasi Aksi',
  message = 'Apakah Anda yakin ingin melanjutkan?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  isLoading = false,
  isDanger = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center p-2">
        <div className={`p-3 rounded-full mb-3 ${isDanger ? 'bg-red-100 text-[#EF4444]' : 'bg-amber-100 text-amber-600'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 mb-6">{message}</p>
        <div className="flex items-center space-x-3 w-full">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            fullWidth
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
