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
    <aside className="fixed start-0 top-0 h-screen bg-white border-r border-[rgba(0,0,0,0.06)] z-40 transition-all duration-300 shadow-[2px_0_15px_rgba(0,0,0,0.02)] flex flex-col hidden md:flex md:w-16 lg:w-64">
      {/* LOGO SECTION */}
      <div className="h-[60px] flex items-center px-4 lg:px-6 mb-6 mt-[env(safe-area-inset-top)] border-b border-[rgba(0,0,0,0.04)]">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-gradient-to-br from-[#0D7377] to-[#14A3A8] rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(13,115,119,0.3)]">
            <img src={logo} alt="Logo" className="h-5 w-5 object-contain brightness-0 invert" />
          </div>
          <span className="font-['Plus_Jakarta_Sans'] font-bold text-lg lg:text-xl tracking-tight text-[var(--text)] hidden lg:inline-block">
            Pure<span className="text-[var(--primary)]">Clean</span>
          </span>
        </Link>
      </div>

      {/* LINKS SECTION */}
      <nav className="flex-1 px-3 lg:px-4 space-y-1 overflow-y-auto no-scrollbar">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              title={link.name}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all duration-200 group relative
                ${isActive
                  ? 'bg-[var(--primary-surface)] text-[var(--primary)] font-bold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg)] hover:text-[var(--text)]'
                }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
              <span className="font-['Inter'] text-[14px] hidden lg:inline-block truncate font-semibold">{link.name}</span>
              
              {isActive && (
                <div className="absolute end-2 w-1 h-1 rounded-full bg-[var(--primary)] hidden lg:block" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* SUPPORT WIDGET (Livreur desktop only) */}
      {user?.role === 'livreur' && (
        <div className="px-4 mb-6 hidden lg:block text-start">
          <div className="bg-[var(--bg)] rounded-[16px] p-4 border border-[rgba(0,0,0,0.06)] shadow-sm">
            <div className="w-8 h-8 bg-white rounded-[8px] flex items-center justify-center mb-3 shadow-sm border border-[rgba(0,0,0,0.06)] text-[var(--primary)]">
              <HelpCircle size={18} />
            </div>
            <h4 className="font-['Plus_Jakarta_Sans'] text-[12px] font-bold text-[var(--text)] mb-1 uppercase tracking-wider">{t('common.need_help')}</h4>
            <p className="font-['Inter'] text-[11px] text-[var(--text-secondary)] mb-3 font-medium">Consultez notre guide livreur pour plus d'infos.</p>
            <button className="w-full py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-[8px] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all flex items-center justify-center gap-2 shadow-sm">
              {t('common.open_guide')} <ChevronRight size={12} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* ADMIN SUPPORT WIDGET */}
      {user?.role === 'admin' && (
        <div className="px-4 mb-6 hidden lg:block text-start">
          <div className="bg-[var(--primary-surface)] rounded-[16px] p-4 border border-[rgba(13,115,119,0.1)] shadow-sm">
            <div className="w-8 h-8 bg-white rounded-[8px] flex items-center justify-center mb-3 shadow-sm border border-[rgba(0,0,0,0.06)] text-[var(--primary)]">
              <HelpCircle size={18} />
            </div>
            <h4 className="font-['Plus_Jakarta_Sans'] text-[12px] font-bold text-[var(--text)] mb-1 uppercase tracking-wider">{t('common.support_admin')}</h4>
            <p className="font-['Inter'] text-[11px] text-[var(--text-secondary)] mb-3 font-medium">Accédez aux outils d'administration et d'aide.</p>
            <button className="w-full py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-[8px] text-[11px] font-bold text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all flex items-center justify-center gap-2 shadow-sm">
              {t('common.open_guide')} <ChevronRight size={12} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* USER FOOTER */}
      <div className="mt-auto p-3 lg:p-4 border-t border-[rgba(0,0,0,0.06)] bg-white mb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-3 p-2 lg:p-2.5 rounded-[12px] hover:bg-[var(--bg)] transition-colors cursor-pointer group mb-2">
          <div className="w-8 h-8 lg:w-9 lg:h-9 bg-gradient-to-br from-[#0D7377] to-[#14A3A8] text-white rounded-full flex items-center justify-center font-bold shadow-[0_2px_8px_rgba(13,115,119,0.3)] transition-all group-hover:scale-105">
            {user?.name?.[0].toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden hidden lg:flex text-start">
            <span className="font-['Plus_Jakarta_Sans'] text-[13px] font-bold text-[var(--text)] truncate">{user?.name}</span>
            <span className="font-['Inter'] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{user?.role}</span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
};

export default Sidebar;
