import React from 'react';
import { X, AlertTriangle, Info, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
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
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      btn: 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20',
      border: 'border-orange-100'
    },
    danger: {
      icon: Trash2,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      btn: 'bg-red-600 hover:bg-red-700 shadow-red-500/20',
      border: 'border-red-100'
    },
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
      border: 'border-emerald-100'
    },
    info: {
      icon: Info,
      color: 'text-primary-500',
      bg: 'bg-primary-500/10',
      btn: 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20',
      border: 'border-primary-100'
    }
  };

  const cfg = CONFIG[type] || CONFIG.warning;
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* BACKDROP */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={loading ? null : onClose} 
      />

      {/* MODAL CONTENT */}
      <div className="relative bg-surface w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2rem] shadow-modal overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 border-t sm:border border-border/50">
        
        {/* MOBILE HANDLE */}
        <div className="w-12 h-1.5 bg-border/40 rounded-full mx-auto mt-4 mb-2 sm:hidden" />

        <div className="p-8 md:p-10 text-center">
          
          {/* ICON BOX */}
          <div className={`w-20 h-20 ${cfg.bg} rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border ${cfg.border}`}>
            <Icon className={cfg.color} size={40} strokeWidth={2.5} />
          </div>

          {/* TEXT CONTENT */}
          <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-3">
            {title || t('common.confirm_title')}
          </h3>
          <p className="text-sm text-text-muted font-bold leading-relaxed mb-10 px-2">
            {message}
          </p>

          {/* ACTIONS */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`w-full ${cfg.btn} text-white rounded-2xl py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                confirmText || t('common.confirm')
              )}
            </button>
            
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-background border border-border/50 text-text-muted rounded-2xl py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 hover:bg-surface disabled:opacity-50"
            >
              {cancelText || t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
