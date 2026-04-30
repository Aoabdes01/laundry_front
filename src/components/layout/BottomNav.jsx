import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Truck, Users, Package, Wrench, XCircle, Shield, RefreshCw, ClipboardList, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BottomNav = ({ user }) => {
  const { t } = useTranslation();
  const location = useLocation();

  if (!user) return null;

  const adminLinks = [
    { name: t('nav.dashboard'), path: '/admin/dashboard', icon: Home },
    { name: t('nav.users'), path: '/admin/users-management', icon: Shield },
    { name: t('nav.orders'), path: '/admin/commandes', icon: ClipboardList },
    { name: t('nav.clients'), path: '/admin/clients', icon: Users },
    { name: t('nav.carpet_types'), path: '/admin/carpet-types', icon: Layers },
  ];

  const livreurLinks = [
    { name: t('nav.dashboard'), path: '/livreur', icon: Home },
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
    <div className="md:hidden fixed bottom-0 start-0 end-0 z-[100] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pointer-events-none">
      <nav className="pointer-events-auto bg-surface/95 backdrop-blur-md border border-border/60 flex items-center justify-evenly px-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl h-[72px]">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`relative flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 transition-all duration-300 ${isActive
                ? 'text-primary-600'
                : 'text-text-muted hover:text-text-primary'
                }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-500/10 scale-105' : 'active:scale-90'}`}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-transform"
                />
              </div>
              
              <span className={`text-xs font-bold mt-0.5 uppercase tracking-wider transition-all duration-300 ${isActive ? 'opacity-100 text-primary-700 dark:text-primary-500' : 'opacity-60 font-medium'}`}>
                {link.name}
              </span>

              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary-500 shadow-sm" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
