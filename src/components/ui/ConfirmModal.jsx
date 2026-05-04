import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Info, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'warning', // warning, danger, success, info
  confirmText,
  cancelText,
  loading = false
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const CONFIG = {
    warning: {
      icon: AlertTriangle,
      color: 'text-[#F59E0B]',
      bg: 'bg-[rgba(245,158,11,0.1)]',
      btn: 'bg-[#F59E0B] hover:bg-[#D97706] shadow-[0_4px_12px_rgba(245,158,11,0.2)]',
      border: 'border-[rgba(245,158,11,0.15)]'
    },
    danger: {
      icon: Trash2,
      color: 'text-[#EF4444]',
      bg: 'bg-[rgba(239,68,68,0.1)]',
      btn: 'bg-[#EF4444] hover:bg-[#DC2626] shadow-[0_4px_12px_rgba(239,68,68,0.2)]',
      border: 'border-[rgba(239,68,68,0.15)]'
    },
    success: {
      icon: CheckCircle2,
      color: 'text-[#10B981]',
      bg: 'bg-[rgba(16,185,129,0.1)]',
      btn: 'bg-[#10B981] hover:bg-[#059669] shadow-[0_4px_12px_rgba(16,185,129,0.2)]',
      border: 'border-[rgba(16,185,129,0.15)]'
    },
    info: {
      icon: Info,
      color: 'text-[var(--primary)]',
      bg: 'bg-[var(--primary-surface)]',
      btn: 'bg-[var(--primary)] hover:bg-[var(--primary-dark)] shadow-[var(--shadow-teal)]',
      border: 'border-[rgba(13,115,119,0.15)]'
    }
  };

  const cfg = CONFIG[type] || CONFIG.warning;
  const Icon = cfg.icon;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* BACKDROP */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={loading ? null : onClose} 
      />

      {/* MODAL CONTENT */}
      <div className="relative bg-white w-full max-w-md rounded-t-[20px] sm:rounded-[20px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        
        {/* DRAG HANDLE (Mobile) */}
        <div className="w-10 h-1 bg-[rgba(0,0,0,0.15)] rounded-full mx-auto mt-3 sm:hidden" />

        <div className="p-6 sm:p-8 text-center">
          
          {/* ICON BOX */}
          <div className={`w-16 h-16 ${cfg.bg} rounded-[18px] flex items-center justify-center mx-auto mb-6 border ${cfg.border}`}>
            <Icon className={cfg.color} size={32} strokeWidth={2.5} />
          </div>

          {/* TEXT CONTENT */}
          <h3 className="font-['Plus_Jakarta_Sans'] text-[20px] font-bold text-[var(--text)] mb-2">
            {title || t('common.confirm_title')}
          </h3>
          <p className="font-['Inter'] text-[14px] text-[var(--text-secondary)] leading-relaxed mb-8 px-2">
            {message}
          </p>

          {/* ACTIONS */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`w-full ${cfg.btn} text-white rounded-[12px] py-4 text-[14px] font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                confirmText || t('common.confirm')
              )}
            </button>
            
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.06)] text-[var(--text-secondary)] rounded-[12px] py-4 text-[14px] font-bold uppercase tracking-wider transition-all active:scale-95 hover:bg-white disabled:opacity-50"
            >
              {cancelText || t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmModal;

