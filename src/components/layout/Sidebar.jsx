import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Truck, 
  ClipboardList, 
  Package, 
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
    <aside className="fixed start-0 top-0 h-screen bg-surface border-r border-border/60 z-40 transition-all duration-300 shadow-[2px_0_15px_rgba(0,0,0,0.02)] flex flex-col hidden md:flex md:w-16 lg:w-64">
      {/* LOGO SECTION */}
      <div className="h-16 flex items-center px-4 lg:px-6 mb-4 mt-[env(safe-area-inset-top)]">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-primary-500/10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-primary-500/20 border border-primary-500/20">
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
                  ? 'bg-primary-500/10 text-primary-600 dark:text-primary-500 font-bold shadow-sm border border-primary-500/10'
                  : 'text-text-secondary hover:bg-background hover:text-primary-600 dark:hover:text-primary-400'
                }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`${isActive ? 'text-primary-500' : 'text-text-muted group-hover:text-primary-500 transition-transform group-hover:scale-110'}`} />
              <span className="text-sm hidden lg:inline-block truncate font-semibold">{link.name}</span>
              
              {isActive && (
                <div className="absolute end-2 w-1.5 h-1.5 rounded-full bg-primary-500 hidden lg:block" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* SUPPORT WIDGET (Livreur desktop only) */}
      {user?.role === 'livreur' && (
        <div className="px-4 mb-6 hidden lg:block text-start">
          <div className="bg-background/80 rounded-2xl p-4 border border-border/60">
            <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center mb-3 shadow-sm border border-border/40 text-primary-500">
              <HelpCircle size={18} />
            </div>
            <h4 className="text-xs font-bold text-text-primary mb-1 uppercase tracking-wider">{t('common.need_help')}</h4>
            <p className="text-xs text-text-secondary mb-3 font-medium">Consultez notre guide livreur pour plus d'infos.</p>
            <button className="w-full py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary hover:text-primary-600 hover:border-primary-200 transition-all flex items-center justify-center gap-2 shadow-sm">
              {t('common.open_guide')} <ChevronRight size={12} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* ADMIN SUPPORT WIDGET */}
      {user?.role === 'admin' && (
        <div className="px-4 mb-6 hidden lg:block text-start">
          <div className="bg-primary-500/5 rounded-2xl p-4 border border-primary-500/10">
            <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center mb-3 shadow-sm border border-border text-primary-500">
              <HelpCircle size={18} />
            </div>
            <h4 className="text-xs font-bold text-text-primary mb-1 uppercase tracking-wider">{t('common.support_admin')}</h4>
            <p className="text-xs text-text-secondary mb-3 font-medium">Accédez aux outils d'administration et d'aide.</p>
            <button className="w-full py-2 bg-surface border border-primary-500/20 rounded-lg text-xs font-bold text-text-primary hover:text-primary-600 hover:border-primary-200 transition-all flex items-center justify-center gap-2 shadow-sm">
              {t('common.open_guide')} <ChevronRight size={12} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* USER FOOTER */}
      <div className="mt-auto p-3 lg:p-4 border-t border-border/60 bg-surface mb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-3 p-2 lg:p-2.5 rounded-xl hover:bg-background transition-colors cursor-pointer group mb-2 border border-transparent hover:border-border/40">
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-primary-500/10 text-primary-600 dark:text-primary-500 rounded-xl flex items-center justify-center font-bold shadow-sm transition-all group-hover:scale-105 border border-primary-500/20">
            {user?.name?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden hidden lg:flex text-start">
            <span className="text-xs font-bold text-text-primary truncate">{user?.name}</span>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{user?.role}</span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
};

export default Sidebar;
