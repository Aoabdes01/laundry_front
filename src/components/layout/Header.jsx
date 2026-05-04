import React from 'react';
import { Bell, Search, Package, MoreVertical, LogOut, Languages, Moon, Sun, Clock, CheckCheck, BellOff, DollarSign, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/auth/authSelector';
import { logoutThunk } from '../../store/auth/authThunk';
import { toast } from 'react-toastify';

// ─── Notification Imports ───────────────────────────────────────────────────
import { 
  fetchNotifications, 
  markAsReadThunk, 
  markAllAsReadThunk 
} from '../../store/notifications/notificationThunks';
import { 
  selectNotifications, 
  selectUnreadCount 
} from '../../store/notifications/notificationSelectors';

// ─── Constants ──────────────────────────────────────────────────────────────
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

// ─── Helpers ────────────────────────────────────────────────────────────────
const getNotificationStyles = (type, title = '') => {
  const text = (type || title || '').toUpperCase();
  if (text.includes('ORDER_CREATED') || text.includes('CRÉÉE') || text.includes('NOUVELLE')) {
    return { bg: 'rgba(13,115,119,0.1)', emoji: '📦', color: '#0D7377' };
  }
  if (text.includes('ORDER_RECEIVED') || text.includes('RÉCEPTIONNÉE')) {
    return { bg: 'rgba(59,130,246,0.1)', emoji: '✅', color: '#3B82F6' };
  }
  if (text.includes('ORDER_READY') || text.includes('PRÊTE')) {
    return { bg: 'rgba(16,185,129,0.1)', emoji: '🎉', color: '#10B981' };
  }
  if (text.includes('ORDER_DELIVERED') || text.includes('LIVRÉE')) {
    return { bg: 'rgba(201,168,76,0.1)', emoji: '🚚', color: '#C9A84C' };
  }
  if (text.includes('ORDER_PAID') || text.includes('PAYÉE')) {
    return { bg: 'rgba(201,168,76,0.15)', emoji: '💰', color: '#C9A84C' };
  }
  if (text.includes('ORDER_CANCELLED') || text.includes('ANNULÉE')) {
    return { bg: 'rgba(239,68,68,0.1)', emoji: '❌', color: '#EF4444' };
  }
  if (text.includes('ORDER_RETURNED') || text.includes('RETOURNÉE')) {
    return { bg: 'rgba(245,158,11,0.1)', emoji: '↩️', color: '#F59E0B' };
  }
  return { bg: 'rgba(13,115,119,0.08)', emoji: '🔔', color: '#0D7377' };
};

const formatRelativeTime = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return 'À l\'instant';
  if (diffInMins < 60) return `Il y a ${diffInMins} min`;
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  if (diffInDays === 1) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const Header = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === 'admin';

  // State
  const [isDarkMode, setIsDarkMode] = React.useState(() => localStorage.getItem('theme') === 'dark');
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const mobileMenuRef = React.useRef(null);
  const audioRef = React.useRef(new Audio(NOTIFICATION_SOUND_URL));

  // Notification Selectors
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  // Theme logic
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Initial Fetch & Polling
  React.useEffect(() => {
    if (!user) return;
    dispatch(fetchNotifications());
    const interval = setInterval(() => {
      dispatch(fetchNotifications());
    }, 10000); // Poll every 10s for Pro feel
    return () => clearInterval(interval);
  }, [dispatch, user]);

  // Browser Notification Permission
  React.useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Tab Title Pulse
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

  // Alerts Engine (Sound & Browser Popups)
  const alertedIdsRef = React.useRef(new Set(JSON.parse(sessionStorage.getItem('alerted_notifs') || '[]')));
  
  React.useEffect(() => {
    if (!notifications.length || !user) return;
    
    // Find truly new notifications that we haven't alerted for yet in this session
    const newItems = notifications.filter(n => !n.read && !alertedIdsRef.current.has(n.id));

    if (newItems.length > 0) {
      audioRef.current.play().catch(() => {}); // Audible alert

      newItems.forEach(item => {
        // UI Toast
        toast.info(
          <div onClick={() => { handleNotificationClick(item); setIsNotificationsOpen(false); }} className="cursor-pointer text-start">
            <p className="font-bold text-sm">{item.title}</p>
            <p className="text-xs opacity-80">{item.message}</p>
          </div>
        );

        // System Browser Alert
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(item.title, { body: item.message, icon: '/logo.png' });
        }
        
        // Mark as alerted
        alertedIdsRef.current.add(item.id);
      });
      
      // Persist alerted IDs for this session to prevent re-toasts on refresh
      sessionStorage.setItem('alerted_notifs', JSON.stringify(Array.from(alertedIdsRef.current)));
    }
  }, [notifications, user]);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleNotificationClick = (notif) => {
    // Smart Routing based on type
    if (notif.type === 'NEW_ORDER' || notif.type === 'ORDER_READY' || notif.type === 'PAYMENT_RECEIVED' || notif.type === 'ORDER_DELIVERING') {
      let target = '/admin/commandes';
      if (user?.role === 'livreur') target = '/livreur/delivery';
      if (user?.role === 'employe') target = '/employe/dashboard';
      navigate(target);
    }
    
    if (!notif.read) {
        dispatch(markAsReadThunk(notif.id));
    }
    setIsNotificationsOpen(false);
  };

  const handleMarkAllSeen = (e) => {
    e.stopPropagation();
    dispatch(markAllAsReadThunk());
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard') || path === '/livreur') return t('nav.dashboard');
    if (path.includes('users-management')) return t('nav.users');
    if (path.includes('commandes') || path.includes('orders')) return t('nav.orders');
    if (path.includes('clients')) return t('nav.clients');
    if (path.includes('carpet-types')) return t('nav.carpet_types');
    if (path.includes('delivery')) return t('nav.deliveries');
    if (path.includes('canceled')) return t('nav.canceled');
    if (path.includes('retours')) return t('nav.returns');
    return 'PureClean';
  };

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <header className={`fixed top-0 left-0 right-0 z-30 bg-white border-b border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-[calc(60px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-5 flex items-center justify-between transition-all duration-300`}>
      
      <div className="flex items-center min-w-0 flex-1 me-2">
        <h1 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[var(--text)] tracking-[-0.01em] truncate">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* SEARCH ICON */}
        <button className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[var(--bg)] border border-[rgba(0,0,0,0.06)] text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200">
          <Search size={18} />
        </button>

        {/* NOTIFICATIONS */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={toggleNotifications} 
            className="relative w-[40px] h-[40px] flex items-center justify-center rounded-[12px] bg-[var(--primary)] shadow-[0_4px_12px_rgba(13,115,119,0.3)] border-none active:scale-95 transition-all"
          >
            <Bell size={20} color="white" />
            {unreadCount > 0 && (
              <span className="absolute top-[-6px] right-[-6px] min-w-[20px] h-[20px] bg-[#EF4444] text-white rounded-full flex items-center justify-center border-[2px] border-[var(--bg)] font-['Inter'] text-[11px] font-bold text-center px-1 animate-in zoom-in-50 duration-300">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute z-[1000] bg-[#FFFFFF] rounded-[16px] shadow-[0_12px_48px_rgba(0,0,0,0.14)] border border-[rgba(0,0,0,0.08)] right-0 w-[300px] top-[52px] max-h-[420px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right flex flex-col">
              <div className="p-[16px] border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between shrink-0">
                <h3 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#0D1B2A] m-0">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllSeen} className="font-['Inter'] text-[12px] font-semibold text-[#0D7377] hover:underline bg-transparent border-none p-0 cursor-pointer">
                    Tout lire
                  </button>
                )}
              </div>

              <div className="overflow-y-auto max-h-[320px] scrollbar-thin flex-1" style={{ scrollbarColor: 'rgba(13,115,119,0.2) transparent' }}>
                {notifications.length > 0 ? (
                  notifications.map((notif) => {
                    const styles = getNotificationStyles(notif.type, notif.title);
                    return (
                      <div key={notif.id} onClick={() => handleNotificationClick(notif)}
                        className={`p-[12px_16px] flex gap-[10px] items-start border-b border-[rgba(0,0,0,0.04)] cursor-pointer transition-colors duration-150 hover:bg-[#F7F8FA] text-start ${!notif.isRead ? 'bg-[rgba(13,115,119,0.04)] border-l-[3px] border-l-[#0D7377] pl-[13px]' : 'bg-white border-l-0'}`}>
                        <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 text-[18px]" style={{ backgroundColor: styles.bg }}>
                          {styles.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-['Inter'] text-[13px] font-semibold text-[#0D1B2A] whitespace-nowrap overflow-hidden text-ellipsis m-0">{notif.title}</p>
                          <p className="font-['Inter'] text-[12px] text-[#4A5568] leading-[1.4] mt-[2px] overflow-hidden m-0" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{notif.message}</p>
                          <p className="font-['Inter'] text-[11px] text-[#94A3B8] m-0 mt-[4px]">{formatRelativeTime(notif.createdAt)}</p>
                        </div>
                        {!notif.isRead && (
                           <div className="shrink-0 w-[8px] h-[8px] rounded-full bg-[#0D7377] mt-[4px]" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-[40px] px-[20px] text-center flex flex-col items-center">
                    <div className="text-[40px] mb-[12px]">🔔</div>
                    <p className="font-['Inter'] text-[14px] font-medium text-[#94A3B8] m-0">Aucune notification</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <button 
                  onClick={() => { navigate('/notifications'); setIsNotificationsOpen(false); }}
                  className="w-full p-[12px_16px] font-['Inter'] text-[12px] font-bold text-[#0D7377] hover:bg-[rgba(13,115,119,0.04)] transition-colors tracking-[0.04em] border-t border-[rgba(0,0,0,0.06)] text-center bg-transparent shrink-0"
                >
                  TOUTES LES NOTIFICATIONS
                </button>
              )}
            </div>
          )}
        </div>

        {/* THEME */}
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[var(--bg)] border border-[rgba(0,0,0,0.06)] text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* LANGUAGE */}
        <button onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr')} className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[var(--bg)] border border-[rgba(0,0,0,0.06)] text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200">
          <Languages size={18} />
        </button>

        {/* THREE DOTS MENU (Mobile) */}
        <div className="relative md:hidden" ref={mobileMenuRef}>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[var(--bg)] border border-[rgba(0,0,0,0.06)] text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200">
            <MoreVertical size={18} />
          </button>
          {isMobileMenuOpen && (
            <div className="absolute top-11 right-0 w-48 bg-white rounded-xl shadow-[var(--shadow-lg)] border border-[rgba(0,0,0,0.06)] overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-[rgba(0,0,0,0.04)]">
                <p className="text-xs font-bold text-[var(--text)] truncate">{user?.name}</p>
                <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{user?.role}</p>
              </div>
              <div className="p-1">
                <button onClick={async () => { await dispatch(logoutThunk()); navigate("/"); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white rounded-lg transition-colors">
                  <LogOut size={14} /> <span>{t('common.logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AVATAR */}
        <div className="hidden md:flex w-9 h-9 rounded-full bg-gradient-to-br from-[#0D7377] to-[#14A3A8] text-white items-center justify-center text-[14px] font-bold shadow-[0_2px_8px_rgba(13,115,119,0.3)] cursor-pointer">
          {initials}
        </div>
      </div>
    </header>
  );
};

export default Header;
