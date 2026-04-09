import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logoutThunk } from '../store/auth/authThunk';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-card border border-border/50 p-8 w-full max-w-md text-center space-y-6 mx-4">
        <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 mx-auto shadow-sm">
          <ShieldAlert size={40} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight">Accès Refusé</h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Vous n'avez pas les autorisations nécessaires pour accéder à cette section.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95"
          >
            <Home size={18} />
            Retour
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50 text-text-muted rounded-2xl text-sm font-black uppercase tracking-widest border border-border/50 hover:bg-gray-100 transition-all active:scale-95"
          >
            <LogOut size={18} />
            Changer de compte
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;

