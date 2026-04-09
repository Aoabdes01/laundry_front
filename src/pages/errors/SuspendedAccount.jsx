import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoUrl from '../../assets/logo.png';

const SuspendedAccount = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-10 border border-border/50 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">

        {/* Logo */}
        <div className="mb-10 w-48">
          <img src={logoUrl} alt="PureClean Logo" className="w-full object-contain" />
        </div>

        {/* Lock Graphic */}
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-8 shadow-inner border border-orange-100">
          <Lock size={40} className="text-primary-500" />
        </div>

        {/* Text Group */}
        <h1 className="text-3xl font-black text-text-primary mb-3 uppercase tracking-tight">
          {t('errors.suspended.title')}
        </h1>
        <h2 className="text-sm font-black text-text-secondary mb-4 tracking-widest uppercase px-4">
          {t('errors.suspended.subtitle')}
        </h2>
        <p className="text-xs font-medium text-text-muted mb-10 leading-relaxed px-6">
          {t('errors.suspended.body')}
        </p>

        {/* Action */}
        <button
          onClick={() => navigate('/')}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white transition-all rounded-2xl py-4 flex items-center justify-center shadow-lg shadow-primary-500/20 text-xs font-black uppercase tracking-widest active:scale-95"
        >
          {t('errors.suspended.back_to_login')}
        </button>
      </div>
    </div>
  );
};

export default SuspendedAccount;

