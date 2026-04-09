import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoUrl from '../../assets/logo.png';

const Forbidden = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { t } = useTranslation();

  const handleHome = () => {
    if (!user) {
      navigate('/login');
    } else {
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'livreur':
          navigate('/livreur');
          break;
        case 'employe':
          navigate('/employe/dashboard');
          break;
        default:
          navigate('/login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-10 border border-border/50 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-400">
        
        {/* Logo */}
        <div className="mb-6 w-48">
          <img src={logoUrl} alt="PureClean Logo" className="w-full object-contain" />
        </div>

        {/* 403 Graphic */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-orange-100 rounded-full blur-3xl opacity-50"></div>
          <div className="relative z-10 w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2 shadow-inner border border-red-100 mx-auto">
             <ShieldAlert size={40} />
          </div>
          <h1 className="text-5xl font-black text-text-primary tracking-tighter drop-shadow-sm select-none">
            403
          </h1>
        </div>

        <h2 className="text-2xl font-black text-text-primary mb-3 uppercase tracking-tight">
          {t('errors.forbidden.title')}
        </h2>
        <p className="text-xs font-bold text-text-muted mb-10 tracking-widest uppercase leading-relaxed">
          {t('errors.forbidden.subtitle')}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
           <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-primary transition-all rounded-2xl py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest active:scale-95 border border-border"
          >
            <ArrowLeft size={16} />
            {t('common.back')}
          </button>
          <button
             onClick={handleHome}
             className="flex-1 bg-primary-600 hover:bg-primary-700 text-white transition-all rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 text-xs font-black uppercase tracking-widest active:scale-95"
          >
            <Home size={16} />
            {t('errors.forbidden.dashboard')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;

