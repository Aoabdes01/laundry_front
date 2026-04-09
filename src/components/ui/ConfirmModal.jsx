import React from 'react';
import { AlertTriangle, CheckCircle, Info, X, Sparkles } from 'lucide-react';

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
          iconBg: 'bg-red-50',
          iconColor: 'text-red-500',
          confirmBtn: 'bg-red-500 hover:bg-red-600',
          Icon: AlertTriangle,
          accent: 'border-red-200'
        };
      case 'success':
        return {
          iconBg: 'bg-green-50',
          iconColor: 'text-green-500',
          confirmBtn: 'bg-green-500 hover:bg-green-600',
          Icon: CheckCircle,
          accent: 'border-green-200'
        };
      case 'info':
        return {
          iconBg: 'bg-laundry-sky/50',
          iconColor: 'text-laundry-primary',
          confirmBtn: 'bg-laundry-primary hover:bg-laundry-deep',
          Icon: Info,
          accent: 'border-laundry-sky'
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-500',
          confirmBtn: 'bg-laundry-deep hover:bg-laundry-primary',
          Icon: AlertTriangle,
          accent: 'border-amber-200'
        };
    }
  };

  const { iconBg, iconColor, confirmBtn, Icon, accent } = getStyles();

  return (
    <div className="fixed inset-0 bg-laundry-deep/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className={`glass rounded-[2.5rem] w-full max-w-md overflow-hidden animate-scale-up border-2 ${accent} shadow-2xl shadow-laundry-deep/20`}>

        {/* DECORATIVE HEADER */}
        <div className={`h-2 w-full ${confirmBtn.split(' ')[0]}`}></div>

        <div className="p-8 sm:p-10 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 end-0 w-32 h-32 bg-laundry-fresh/5 rounded-full -me-16 -mt-16 animate-pulse"></div>

          <div className="flex flex-col items-center text-center gap-6 relative z-10">
            <div className={`${iconBg} p-5 rounded-[1.5rem] border-2 ${accent} text-laundry-deep shadow-inner animate-float`}>
              <Icon className={iconColor} size={32} strokeWidth={2.5} />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-laundry-deep uppercase tracking-tighter leading-none">
                {title}
              </h3>
              <p className="text-[10px] font-black text-laundry-primary uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <Sparkles size={12} className="animate-pulse" /> Confirmation Requise <Sparkles size={12} className="animate-pulse" />
              </p>
            </div>

            <p className="text-laundry-deep/60 font-bold text-sm leading-relaxed lowercase first-letter:uppercase">
              {message}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4 relative z-10">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-white/50 text-laundry-deep/40 font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-laundry-deep rounded-2xl border-2 border-laundry-sky transition-all active:scale-95"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-6 py-4 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 ${confirmBtn}`}
            >
              <CheckCircle size={14} strokeWidth={3} />
              <span>Confirmer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
