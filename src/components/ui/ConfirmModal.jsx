import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning'
}) => {

  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-50 dark:bg-red-500/10',
          iconColor: 'text-red-500',
          confirmBtn: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
          Icon: AlertTriangle,
          accent: 'border-red-100'
        };
      case 'success':
        return {
          iconBg: 'bg-teal-50 dark:bg-teal-500/10',
          iconColor: 'text-teal-600',
          confirmBtn: 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20',
          Icon: CheckCircle,
          accent: 'border-teal-100'
        };
      case 'info':
        return {
          iconBg: 'bg-primary-50 dark:bg-primary-500/10',
          iconColor: 'text-primary-600',
          confirmBtn: 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20',
          Icon: Info,
          accent: 'border-primary-100'
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-amber-50 dark:bg-amber-500/10',
          iconColor: 'text-amber-600',
          confirmBtn: 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/20',
          Icon: AlertTriangle,
          accent: 'border-amber-100'
        };
    }
  };

  const { iconBg, iconColor, confirmBtn, Icon, accent } = getStyles();

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center animate-fade-in">
      {/* OVERLAY */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      {/* MODAL CONTENT */}
      <div className={`relative bg-surface w-full max-w-md overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 shadow-2xl
        rounded-t-3xl sm:rounded-2xl border-t sm:border border-border/60`}>

        {/* MOBILE HANDLE */}
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mt-3 mb-1 sm:hidden"></div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center gap-5">
            <div className={`${iconBg} w-16 h-16 rounded-2xl border border-border/10 flex items-center justify-center shadow-sm`}>
              <Icon className={iconColor} size={32} strokeWidth={2.5} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-text-primary tracking-tight leading-tight">
                {title}
              </h3>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">
                Confirmation Requise
              </p>
            </div>

            <p className="text-text-secondary font-medium text-sm leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-background text-text-secondary font-bold text-sm hover:bg-background/80 rounded-xl transition-all active:scale-95 border border-border/50"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-6 py-3.5 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${confirmBtn}`}
            >
              <CheckCircle size={18} strokeWidth={2.5} />
              <span>Confirmer</span>
            </button>
          </div>
        </div>

        {/* CLOSE BUTTON (Desktop only) */}
        <button 
          onClick={onClose}
          className="absolute top-4 end-4 p-2 text-text-muted hover:text-text-primary hover:bg-background rounded-lg transition-colors hidden sm:block"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ConfirmModal;
