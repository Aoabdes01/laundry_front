import React from 'react';
import { LogIn, Bell, Search, Menu, Package, MoreVertical, LogOut, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { selectCurrentUser } from '../../store/auth/authSelector';
import { logoutThunk } from '../../store/auth/authThunk';
import { fetchPreteCount, fetchReadyOrders } from '../../store/livreur/livreurThunk';
import { selectPreteCount, selectReadyOrders, selectSeenNotificationIds } from '../../store/livreur/livreurSelectors';
import { markNotificationsAsSeen } from '../../store/livreur/livreurSlice';
import { fetchPendingCount, fetchPendingOrders } from '../../store/employe/employeThunk';
import { selectPendingCount, selectPendingOrders, selectSeenNotificationIdsEmploye } from '../../store/employe/employeSelectors';
import { markNotificationsAsSeen as markNotificationsAsSeenEmploye } from '../../store/employe/employeSlice';

const Header = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isLivreur = user?.role === 'livreur';
  const isEmploye = user?.role === 'employe';
  const isAdmin = user?.role === 'admin';

  // Livreur selectors
  const preteCount = useSelector(selectPreteCount);
  const readyOrders = useSelector(selectReadyOrders);
  const seenIdsLivreur = useSelector(selectSeenNotificationIds);

  // Employe selectors
  const pendingCount = useSelector(selectPendingCount);
  const pendingOrders = useSelector(selectPendingOrders);
  const seenIdsEmploye = useSelector(selectSeenNotificationIdsEmploye);

  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = React.useRef(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const mobileMenuRef = React.useRef(null);

  // Unified Notification Data & Daily Cleanup
  const notifications = React.useMemo(() => {
    const rawList = isLivreur ? readyOrders : (isEmploye || isAdmin ? pendingOrders : []);
    const today = new Date().setHours(0, 0, 0, 0);
    return rawList.filter(order => {
      const orderDate = new Date(order.createdAt || order.dateCreation).setHours(0, 0, 0, 0);
      return orderDate === today;
    });
  }, [isLivreur, isEmploye, isAdmin, readyOrders, pendingOrders]);

  const seenIds = isLivreur ? seenIdsLivreur : (isEmploye || isAdmin ? seenIdsEmploye : []);
  const unreadCount = notifications.filter(order => !seenIds.includes(order.id)).length;

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll notifications based on role
  React.useEffect(() => {
    if (!user?.role) return;
    const poll = () => {
      if (isLivreur) {
        dispatch(fetchPreteCount());
        dispatch(fetchReadyOrders());
      } else if (isEmploye || isAdmin) {
        dispatch(fetchPendingCount());
        dispatch(fetchPendingOrders());
      }
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [dispatch, user, isLivreur, isEmploye]);

  const handleToggleNotifications = () => {
    const nextState = !isNotificationsOpen;
    setIsNotificationsOpen(nextState);
    if (nextState && unreadCount > 0) {
      if (isLivreur) dispatch(markNotificationsAsSeen());
      else if (isEmploye || isAdmin) dispatch(markNotificationsAsSeenEmploye());
    }
  };

  const prevReadyOrdersIds = React.useRef(new Set());
  const isFirstLoad = React.useRef(true);

  // Toast alerts for NEW orders
  React.useEffect(() => {
    if (!user?.role || !notifications) return;
    const newItems = notifications.filter(order => !prevReadyOrdersIds.current.has(order.id));
    if (isFirstLoad.current) {
      notifications.forEach(o => prevReadyOrdersIds.current.add(o.id));
      seenIds.forEach(id => prevReadyOrdersIds.current.add(id));
      isFirstLoad.current = false;
      return;
    }
    newItems.forEach(order => {
      if (seenIds.includes(order.id)) return;
      const toastConfig = isLivreur ? {
        title: t('header.new_order_ready'),
        body: t('header.order_available', { number: order.numeroCommande }),
        path: '/livreur/delivery'
      } : {
        title: t('header.new_order'),
        body: t('header.order_created_by', { number: order.numeroCommande, name: order.livreur?.name || t('driver.canceled_deliveries.card.client_fallback', 'un livreur') }),
        path: '/employe/dashboard'
      };
      toast.info(
        <div onClick={() => navigate(toastConfig.path)} className="cursor-pointer">
          <p className="font-semibold text-sm">{toastConfig.title}</p>
          <p className="text-xs text-primary-600 mt-0.5">{toastConfig.body}</p>
          <p className="text-xs text-text-muted mt-1">{t('header.click_to_see')}</p>
        </div>,
        { icon: <Bell size={16} className="text-primary-600" />, toastId: `order-${order.id}` }
      );
    });
    prevReadyOrdersIds.current = new Set(notifications.map(o => o.id));
  }, [notifications, user, navigate, seenIds, isLivreur]);

  // Page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard'))         return t('nav.dashboard');
    if (path.includes('/admin/users-management'))  return t('nav.users');
    if (path.includes('/admin/commandes'))         return t('nav.orders');
    if (path.includes('/admin/clients'))           return t('nav.clients');
    if (path === '/livreur')                      return t('nav.dashboard');
    if (path.includes('/livreur/clients'))         return t('nav.clients');
    if (path.includes('/livreur/orders'))          return t('nav.collections');
    if (path.includes('/livreur/delivery'))        return t('nav.deliveries');
    if (path.includes('/livreur/canceled'))        return t('nav.canceled');
    if (path.includes('/employe/dashboard'))       return t('nav.workshop');
    if (path.includes('/employe/commandes'))       return t('nav.details');
    if (path.includes('/employe/retours'))         return t('nav.returns');
    return 'PureClean';
  };

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate("/");
  };

  return (
    <header className="fixed top-0 end-0 start-0 md:start-16 lg:start-60 h-16 bg-surface shadow-topbar px-4 md:px-8 flex items-center justify-between z-30 transition-all duration-300">
      
      {/* LEFT: Greeting / Title */}
      <div className="flex flex-col min-w-0 flex-1 me-2">
        {isAdmin ? (
          <>
            <h1 className="text-sm md:text-base font-bold text-text-primary flex items-center gap-2 truncate">
              <span className="hidden md:inline">{t('header.greeting')},</span> {user?.name || 'Administrateur'} 
              <span className="hidden md:inline text-xl">👋</span>
            </h1>
            <p className="text-[10px] md:text-xs text-text-muted hidden md:block">
              {t('header.welcome_back')}
            </p>
          </>
        ) : isLivreur ? (
          <>
            <h1 className="text-sm md:text-base font-bold text-text-primary truncate">
              {t('header.driver_dashboard')}
            </h1>
            <p className="text-[10px] md:text-xs text-text-muted hidden lg:block">
              {t('header.driver_subtitle')}
            </p>
          </>
        ) : (
          <h1 className="text-sm md:text-base font-bold text-text-primary truncate">
            {getPageTitle()}
          </h1>
        )}
      </div>

      {/* CENTER: Search Bar (Desktop) */}
      <div className="hidden lg:flex flex-1 max-w-md mx-8">
        <div className="w-full flex items-center gap-3 bg-background border border-border rounded-2xl px-4 py-2 hover:border-primary-300 transition-colors group">
          <Search size={18} className="text-text-muted group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder={t('common.search_placeholder')}
            className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted w-full"
          />
          <div className="flex items-center gap-1 bg-surface border border-border px-1.5 py-0.5 rounded-md text-[10px] text-text-muted font-bold shadow-sm">
            <span className="text-[8px]">⌘</span>K
          </div>
        </div>
      </div>

      {/* RIGHT: Actions & Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        
        {/* MOBILE SEARCH ICON */}
        <button className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:bg-background hover:text-text-primary transition-colors">
          <Search size={20} />
        </button>

        {/* NOTIFICATIONS BELL */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggleNotifications}
            className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200
              ${isNotificationsOpen 
                ? 'bg-primary-50 text-primary-600 shadow-sm' 
                : 'text-text-muted hover:bg-background hover:text-text-primary'}`}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-2 end-2 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface animate-pulse-dot">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute z-50 bg-surface rounded-2xl shadow-modal border border-border start-1/2 -translate-x-1/2 w-[90vw] top-12 md:start-auto md:end-0 md:translate-x-0 md:w-80 md:top-10 max-h-[80vh] overflow-y-auto animate-fade-in origin-top-right">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{t('common.notifications')}</h3>
                  <p className="text-[10px] text-text-muted">{t('header.notifications_count', { count: unreadCount })}</p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      if (isLivreur) dispatch(markNotificationsAsSeen());
                      else if (isEmploye || isAdmin) dispatch(markNotificationsAsSeenEmploye());
                    }}
                    className="text-[10px] font-bold text-primary-600 hover:text-primary-700 underline"
                  >
                    {t('common.mark_all_read')}
                  </button>
                )}
              </div>

              <div className="max-h-[70vh] overflow-y-auto md:max-h-96">
                {notifications.length > 0 ? (
                  notifications.map((order) => {
                    const isNew = !seenIds.includes(order.id);
                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          const target = isLivreur ? '/livreur/delivery' : (isAdmin ? '/admin/dashboard' : '/employe/dashboard');
                          navigate(target);
                          setIsNotificationsOpen(false);
                        }}
                        className={`px-5 py-4 border-b border-border last:border-0 hover:bg-background cursor-pointer flex items-start gap-4 transition-all
                          ${isNew ? 'bg-primary-50/30' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm
                          ${isNew ? 'bg-primary-100 text-primary-600' : 'bg-background text-text-muted'}`}>
                          <Package size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isNew ? 'text-primary-600' : 'text-text-muted'}`}>
                              {isLivreur ? t('header.new_order_ready') : t('header.new_order')}
                            </span>
                            <span className="text-[10px] text-text-muted">{t('header.today')}</span>
                          </div>
                          <p className="text-xs text-text-primary leading-snug">
                            {isLivreur ? (
                              t('header.order_available', { number: order.numeroCommande })
                            ) : (
                              t('header.order_created_by', { number: order.numeroCommande, name: order.livreur?.name })
                            )}
                          </p>
                        </div>
                        {isNew && (
                          <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell size={24} className="text-text-muted" />
                    </div>
                    <p className="text-sm font-medium text-text-primary">{t('common.no_notifications')}</p>
                    <p className="text-xs text-text-muted mt-1">Nous vous préviendrons dès qu'il y aura du nouveau.</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-5 py-3 border-t border-border bg-background/50 text-center">
                    <button
                    onClick={() => {
                      const target = isLivreur ? '/livreur/delivery' : (isAdmin ? '/admin/dashboard' : '/employe/dashboard');
                      navigate(target);
                      setIsNotificationsOpen(false);
                    }}
                    className="text-xs font-bold text-text-primary hover:text-primary-600 transition-colors"
                  >
                    {t('header.see_history')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* USER PROFILE */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr')}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:bg-background hover:text-text-primary transition-all active:scale-95 border border-transparent hover:border-border"
            title={i18n.language === 'fr' ? 'العربية' : 'Français'}
          >
            <Languages size={20} className="text-primary-500" />
          </button>

          {!user ? (
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all flex items-center gap-2 active:scale-95"
            >
              <LogIn size={18} />
              <span className="hidden sm:inline">{t('auth.login.submit')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 ps-2 md:ps-4 border-l border-border ms-2">
            <div className="hidden md:flex flex-col text-end">
              <span className="text-xs font-bold text-text-primary leading-none mb-1 truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[10px] font-medium text-text-muted capitalize">
                {isLivreur ? `ID: #${user.id || '---'}` : user.role}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-primary-100 p-0.5 cursor-pointer hover:border-primary-300 transition-colors">
              <div className="w-full h-full rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold shadow-inner">
                {initials}
              </div>
            </div>
          </div>
        )}
      </div>

        {/* MOBILE MENU (3 dots) */}
        {user && (
          <div className="md:hidden relative" ref={mobileMenuRef}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                isMobileMenuOpen ? 'bg-primary-50 text-primary-600' : 'text-text-muted hover:bg-gray-100'
              }`}
            >
              <MoreVertical size={20} />
            </button>

            {isMobileMenuOpen && (
              <div className="absolute top-12 end-0 w-56 bg-white rounded-2xl shadow-modal border border-border overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-4 border-b border-border bg-gray-50/50">
                  <p className="text-sm font-black text-text-primary truncate">{user.name}</p>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5 capitalize">{user.role}</p>
                </div>
                
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut size={18} />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

