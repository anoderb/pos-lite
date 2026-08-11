import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

/**
 * Reusable Feedback & Notification Modal (Success / Error / Info)
 */
export default function FeedbackModal({
  isOpen,
  onClose,
  type = 'success', // 'success' | 'error' | 'info'
  title,
  message,
  buttonText = 'OK, Mengerti',
}) {
  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center p-3">
        <div
          className={`p-3.5 rounded-full mb-3 shadow-xs ${
            isSuccess
              ? 'bg-emerald-100 text-[#16A34A]'
              : isError
              ? 'bg-red-100 text-[#EF4444]'
              : 'bg-sky-100 text-sky-600'
          }`}
        >
          {isSuccess && <CheckCircle2 className="w-8 h-8" />}
          {isError && <AlertCircle className="w-8 h-8" />}
          {!isSuccess && !isError && <Info className="w-8 h-8" />}
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-1">
          {title || (isSuccess ? 'Berhasil!' : isError ? 'Terjadi Kesalahan' : 'Informasi')}
        </h3>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed max-w-xs">{message}</p>

        <Button
          variant={isError ? 'danger' : 'primary'}
          fullWidth
          onClick={onClose}
        >
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
}
