import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoUrl from '../../assets/logo.png';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { t } = useTranslation();

  const handleReturn = () => {
    if (!user) {
      navigate('/');
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
          navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-card p-10 border border-border/50 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-500">

        {/* Logo */}
        <div className="mb-8 w-48">
          <img src={logoUrl} alt="PureClean Logo" className="w-full object-contain" />
        </div>

        {/* 404 Text */}
        <div className="relative mb-6">
          <h1 className="text-8xl font-black text-primary-500 tracking-tighter drop-shadow-sm select-none">
            404
          </h1>
          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent" />
        </div>

        <h2 className="text-2xl font-black text-text-primary mb-3 uppercase tracking-tight line-clamp-1">
          {t('errors.not_found.title')}
        </h2>
        <p className="text-xs font-bold text-text-muted mb-10 tracking-widest uppercase leading-relaxed">
          {t('errors.not_found.subtitle')}
        </p>

        {/* Action */}
        <button
          onClick={handleReturn}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white transition-all rounded-2xl py-3 sm:py-4 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 text-xs font-black uppercase tracking-widest active:scale-95">
          <Home size={18} />
          {t('errors.not_found.back_to_prev')}
        </button>
      </div>
    </div>
  );
};

export default NotFound;

