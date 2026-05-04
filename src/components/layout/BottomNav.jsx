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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] h-[calc(72px+env(safe-area-inset-bottom))] bg-white border-t border-[rgba(0,0,0,0.06)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-evenly h-full px-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`relative flex flex-col items-center justify-center min-w-[60px] gap-1 px-4 py-2 rounded-xl transition-all duration-200 active:scale-[0.92] ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className="transition-transform"
              />
              
              <span className={`font-['Inter'] text-[10px] uppercase tracking-[0.02em] transition-all duration-200 ${
                isActive ? 'font-bold' : 'font-medium'
              }`}>
                {link.name}
              </span>

              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
