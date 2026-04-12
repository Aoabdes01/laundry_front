import React from 'react';
import { LogIn, Bell, Search, Package, MoreVertical, LogOut, Languages, Moon, Sun, Clock, CheckCheck, BellOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/auth/authSelector';
import { logoutThunk } from '../../store/auth/authThunk';
import { fetchPreteCount, fetchReadyOrders } from '../../store/livreur/livreurThunk';
import { selectReadyOrders, selectSeenNotificationIds } from '../../store/livreur/livreurSelectors';
import { markNotificationsAsSeen } from '../../store/livreur/livreurSlice';
import { fetchPendingCount, fetchPendingOrders } from '../../store/employe/employeThunk';
import { selectPendingOrders, selectSeenNotificationIdsEmploye } from '../../store/employe/employeSelectors';
import { markNotificationsAsSeen as markNotificationsAsSeenEmploye } from '../../store/employe/employeSlice';
import { toast } from 'react-toastify';

// ─── Constants ──────────────────────────────────────────────────────────────
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

const Header = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = useSelector(selectCurrentUser);
  const isLivreur = user?.role === 'livreur';
  const isEmploye = user?.role === 'employe';
  const isAdmin = user?.role === 'admin';

  // State
  const [isDarkMode, setIsDarkMode] = React.useState(() => localStorage.getItem('theme') === 'dark');
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const mobileMenuRef = React.useRef(null);
  const audioRef = React.useRef(new Audio(NOTIFICATION_SOUND_URL));

  // Selectors
  const readyOrders = useSelector(selectReadyOrders);
  const seenIdsLivreur = useSelector(selectSeenNotificationIds);
  const pendingOrders = useSelector(selectPendingOrders);
  const seenIdsEmploye = useSelector(selectSeenNotificationIdsEmploye);

  // Theme logic
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Notifications logic
  const notifications = React.useMemo(() => {
    const rawList = isLivreur ? readyOrders : (isEmploye || isAdmin ? pendingOrders : []);
    // Professional sorting: Unread first, then by date
    return [...rawList].sort((a, b) => {
      const aSeen = (isLivreur ? seenIdsLivreur : seenIdsEmploye).includes(a.id);
      const bSeen = (isLivreur ? seenIdsLivreur : seenIdsEmploye).includes(b.id);
      if (aSeen !== bSeen) return aSeen ? 1 : -1;
      return new Date(b.createdAt || b.dateCreation) - new Date(a.createdAt || a.dateCreation);
    });
  }, [isLivreur, isEmploye, isAdmin, readyOrders, pendingOrders, seenIdsLivreur, seenIdsEmploye]);

  const seenIds = isLivreur ? seenIdsLivreur : (isEmploye || isAdmin ? seenIdsEmploye : []);
  const unreadCount = notifications.filter(order => !seenIds.includes(order.id)).length;

  // Browser Notification Request
  React.useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Poll & Title Pulse
  React.useEffect(() => {
    if (!user?.role) return;
    const poll = () => {
      if (isLivreur) { dispatch(fetchPreteCount()); dispatch(fetchReadyOrders()); }
      else if (isEmploye || isAdmin) { dispatch(fetchPendingOrders()); }
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [dispatch, user, isLivreur, isEmploye, isAdmin]);

  // Tab Title Pulse Logic
  React.useEffect(() => {
    const originalTitle = document.title;
    let pulseInterval;
    if (unreadCount > 0) {
      pulseInterval = setInterval(() => {
        document.title = document.title === originalTitle ? `(${unreadCount}) Nouveau message!` : originalTitle;
      }, 2000);
    } else {
      document.title = originalTitle;
    }
    return () => { clearInterval(pulseInterval); document.title = originalTitle; };
  }, [unreadCount]);

  // Toast & Sound Engine
  const prevIds = React.useRef(new Set());
  React.useEffect(() => {
    if (!notifications.length || !user) return;
    
    const currentIds = new Set(notifications.map(n => n.id));
    const newItems = notifications.filter(n => !prevIds.current.has(n.id) && !seenIds.includes(n.id));

    if (newItems.length > 0) {
      // 1. Play Sound
      audioRef.current.play().catch(() => {});

      // 2. Trigger Toasts & Browser Alerts
      newItems.forEach(item => {
        const title = isLivreur ? "Commande Prête" : "Nouvelle Commande";
        const body = `Commande #${item.numeroCommande} est disponible.`;
        
        toast.info(
          <div onClick={() => navigate(isLivreur ? '/livreur/delivery' : '/admin/dashboard')} className="cursor-pointer">
            <p className="font-bold text-sm">{title}</p>
            <p className="text-xs opacity-80">{body}</p>
          </div>
        );

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, icon: '/logo.png' });
        }
      });
    }
    prevIds.current = currentIds;
  }, [notifications, user, isLivreur, navigate, seenIds]);

  const handleMarkAllSeen = () => {
    if (isLivreur) dispatch(markNotificationsAsSeen());
    else dispatch(markNotificationsAsSeenEmploye());
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard'))         return t('nav.dashboard');
    if (path.includes('/admin/users-management'))  return t('nav.users');
    if (path.includes('/admin/commandes'))         return t('nav.orders');
    if (path.includes('/admin/clients'))           return t('nav.clients');
    if (path.includes('/admin/carpet-types'))      return t('nav.carpet_types');
    return 'PureClean';
  };

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <header className={`fixed top-0 end-0 z-30 bg-surface shadow-sm border-b border-border/40 px-4 md:px-8 flex items-center justify-between transition-all duration-300
      ${user ? 'start-0 md:start-16 lg:start-64' : 'start-0'}
      h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]`}>
      
      <div className="flex flex-col min-w-0 flex-1 me-2 text-start">
        <h1 className="text-sm md:text-base font-black text-text-primary uppercase tracking-tight truncate">
          {isAdmin ? `${t('header.greeting')}, ${user?.name}` : getPageTitle()}
        </h1>
        {isAdmin && <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest hidden md:block opacity-60">{t('header.welcome_back')}</p>}
      </div>

      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="w-full flex items-center gap-3 bg-background border border-border/60 rounded-xl px-4 py-2 group">
          <Search size={16} className="text-text-muted group-focus-within:text-primary-500" />
          <input type="text" placeholder={t('common.search_placeholder')} className="bg-transparent border-none outline-none text-xs font-bold text-text-primary w-full" />
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        {/* NOTIFICATIONS */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isNotificationsOpen ? 'bg-primary-50 text-primary-600' : 'text-text-muted hover:bg-background'}`}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-2 end-2 w-4 h-4 bg-primary-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-surface animate-bounce">{unreadCount}</span>}
          </button>

          {isNotificationsOpen && (
            <div className="absolute z-50 bg-surface rounded-[2rem] shadow-2xl border border-border start-1/2 -translate-x-1/2 w-[90vw] top-12 md:start-auto md:end-0 md:translate-x-0 md:w-96 md:top-11 max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-background/30 text-start">
                <div>
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-widest">{t('common.notifications')}</h3>
                  <p className="text-[9px] text-text-muted font-bold uppercase tracking-tighter mt-0.5">{unreadCount} non-lus sur {notifications.length}</p>
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllSeen} className="flex items-center gap-1.5 text-[9px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest">
                    <CheckCheck size={12}/> Tout marquer
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto divide-y divide-border/30">
                {notifications.length > 0 ? (
                  notifications.map((order) => {
                    const isNew = !seenIds.includes(order.id);
                    return (
                      <div key={order.id} onClick={() => { navigate(isLivreur ? '/livreur/delivery' : (isAdmin ? '/admin/dashboard' : '/employe/dashboard')); setIsNotificationsOpen(false); }}
                        className={`px-6 py-4 hover:bg-background/50 cursor-pointer flex items-start gap-4 transition-all ${isNew ? 'bg-primary-500/[0.03]' : 'opacity-60'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${isNew ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20 scale-110' : 'bg-background text-text-muted border-border'}`}>
                          <Package size={18} />
                        </div>
                        <div className="flex-1 min-w-0 text-start">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isNew ? 'text-primary-600' : 'text-text-muted'}`}>#{order.numeroCommande}</span>
                            <span className="text-[8px] font-bold text-text-muted uppercase flex items-center gap-1"><Clock size={10}/> {isNew ? 'Récent' : 'Lu'}</span>
                          </div>
                          <p className="text-xs font-bold text-text-primary leading-snug truncate">{isLivreur ? "Prête pour livraison" : "Nouvelle commande créée"}</p>
                          <p className="text-[10px] text-text-muted mt-0.5 truncate">{order.client?.name || order.clientNom || 'Client externe'}</p>
                        </div>
                        {isNew && <div className="w-2 h-2 rounded-full bg-primary-500 mt-4 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center opacity-40">
                    <BellOff size={40} className="mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aucune notification</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:bg-background">
          {isDarkMode ? <Sun size={20} className="text-primary-500" /> : <Moon size={20} className="text-primary-500" />}
        </button>

        <button onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr')} className="w-10 h-10 flex items-center justify-center rounded-xl text-text-muted hover:bg-background">
          <Languages size={20} className="text-primary-500" />
        </button>

        <div className="flex items-center gap-3 ps-3 border-l border-border/60">
          <div className="hidden lg:flex flex-col text-end">
            <span className="text-xs font-black text-text-primary uppercase tracking-tighter truncate max-w-[120px]">{user?.name}</span>
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{user?.role}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-black shadow-sm uppercase border border-primary-200">
            {initials}
          </div>
        </div>

        {user && (
          <div className="md:hidden" ref={mobileMenuRef}>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:bg-background">
              <MoreVertical size={20} />
            </button>
            {isMobileMenuOpen && (
              <div className="absolute top-14 end-4 w-56 bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden z-50">
                <div className="p-4 border-b border-border bg-background/30 text-start">
                  <p className="text-xs font-black text-text-primary uppercase tracking-tight">{user.name}</p>
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">{user.role}</p>
                </div>
                <div className="p-2">
                  <button onClick={async () => { await dispatch(logoutThunk()); navigate("/"); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-widest">
                    <LogOut size={16} /> <span>{t('common.logout')}</span>
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
