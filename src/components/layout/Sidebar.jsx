import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Truck, 
  ClipboardList, 
  UserPlus, 
  Package, 
  Home, 
  Settings, 
  LogOut, 
  Wrench, 
  Users, 
  LayoutDashboard,
  XCircle, 
  RefreshCw,
  HelpCircle,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo.png';
import LogoutButton from '../../Auth/Logout';

const Sidebar = ({ user }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const adminLinks = [
    { name: t('nav.dashboard'), path: '/admin/dashboard', icon: LayoutDashboard },
    { name: t('nav.users'), path: '/admin/users-management', icon: Shield },
    { name: t('nav.orders'), path: '/admin/commandes', icon: ClipboardList },
    { name: t('nav.clients'), path: '/admin/clients', icon: Users },
    { name: t('nav.carpet_types'), path: '/admin/carpet-types', icon: Layers },
  ];

  const livreurLinks = [
    { name: t('nav.dashboard'), path: '/livreur', icon: LayoutDashboard },
    { name: t('nav.deliveries'), path: '/livreur/delivery', icon: Truck },
    { name: t('nav.orders'), path: '/livreur/orders', icon: Package },
    { name: t('nav.clients'), path: '/livreur/clients', icon: Users },
    { name: t('nav.canceled'), path: '/livreur/canceled', icon: XCircle },
  ];

  const employeLinks = [
    { name: t('nav.workshop'), path: '/employe/dashboard', icon: Wrench },
    { name: t('nav.returns'), path: '/employe/retours', icon: RefreshCw },
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'livreur' ? livreurLinks : user?.role === 'employe' ? employeLinks : [];

  return (
    <aside className="fixed start-0 top-0 h-screen bg-surface border-r border-border z-40 transition-all duration-300 shadow-sidebar flex flex-col hidden md:flex w-16 lg:w-60">
      {/* LOGO SECTION */}
      <div className="h-16 flex items-center px-4 lg:px-6 mb-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105">
            <img src={logo} alt="Logo" className="h-5 w-5 lg:h-6 lg:w-6 object-contain" />
          </div>
          <span className="font-bold text-lg lg:text-xl tracking-tight text-text-primary hidden lg:inline-block">
            Pure<span className="text-primary-500">Clean</span>
          </span>
        </Link>
      </div>

      {/* LINKS SECTION */}
      <nav className="flex-1 px-3 lg:px-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              title={link.name}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${isActive
                  ? 'bg-primary-50 text-primary-600 font-semibold'
                  : 'text-text-secondary hover:bg-background hover:text-primary-600'
                }`}
            >
              <Icon size={20} className={`${isActive ? 'text-primary-500' : 'group-hover:scale-110 transition-transform text-text-muted group-hover:text-primary-500'}`} />
              <span className="text-sm hidden lg:inline-block truncate">{link.name}</span>
              
              {isActive && (
                <div className="absolute end-2 w-1.5 h-1.5 rounded-full bg-primary-500 hidden lg:block" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* SUPPORT WIDGET (Livreur desktop only) */}
      {user?.role === 'livreur' && (
        <div className="px-4 mb-6 hidden lg:block">
          <div className="bg-primary-50 rounded-2xl p-4 border border-primary-100">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm">
              <HelpCircle size={18} className="text-primary-500" />
            </div>
            <h4 className="text-xs font-bold text-primary-600 mb-1 uppercase tracking-wider">{t('common.need_help')}</h4>
            <p className="text-[10px] text-text-muted mb-3 italic">"{t('common.guide')} Livreur"</p>
            <button className="w-full py-2 bg-white border border-border rounded-lg text-[10px] font-bold text-text-primary hover:bg-white hover:text-primary-600 transition-colors flex items-center justify-center gap-2 shadow-sm">
              {t('common.open_guide')} <ChevronRight size={12} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* ADMIN SUPPORT WIDGET (Hidden on tablet) */}
      {user?.role === 'admin' && (
        <div className="px-4 mb-6 hidden lg:block">
          <div className="bg-background rounded-2xl p-4 border border-border">
            <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center mb-3 shadow-sm">
              <HelpCircle size={18} className="text-primary-500" />
            </div>
            <h4 className="text-xs font-bold text-text-primary mb-1">{t('common.support_admin')}</h4>
            <p className="text-[10px] text-text-muted mb-3">Consultez notre guide ou contactez le support.</p>
            <button className="w-full py-2 bg-surface border border-border rounded-lg text-[10px] font-semibold text-text-primary hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
              {t('common.open_guide')} <ChevronRight size={12} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* USER FOOTER */}
      <div className="mt-auto p-3 lg:p-4 border-t border-border bg-surface">
        <div className="flex items-center gap-3 p-2 lg:p-3 rounded-xl hover:bg-background transition-colors cursor-pointer group mb-2">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105">
            {user?.name?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden hidden lg:flex">
            <span className="text-xs font-bold text-text-primary truncate">{user?.name}</span>
            <span className="text-[10px] font-medium text-text-muted capitalize">{user?.role}</span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
};

export default Sidebar;

