import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Bell, Clock, CheckCheck, Package, DollarSign, 
  BellOff, Search, Trash2, Filter, ChevronRight,
  ArrowLeft, RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  fetchNotifications, 
  markAsReadThunk, 
  markAllAsReadThunk 
} from '../../store/notifications/notificationThunks';
import { 
  selectNotifications, 
  selectNotificationsLoading 
} from '../../store/notifications/notificationSelectors';
import { selectCurrentUser } from '../../store/auth/authSelector';

const getNotificationStyles = (type, title = '') => {
  const text = (type || title || '').toUpperCase();
  if (text.includes('ORDER_CREATED') || text.includes('CRÉÉE') || text.includes('NOUVELLE')) {
    return { bg: 'rgba(13,115,119,0.1)', emoji: '📦', border: '#0D7377' };
  }
  if (text.includes('ORDER_RECEIVED') || text.includes('RÉCEPTIONNÉE')) {
    return { bg: 'rgba(59,130,246,0.1)', emoji: '✅', border: '#3B82F6' };
  }
  if (text.includes('ORDER_READY') || text.includes('PRÊTE')) {
    return { bg: 'rgba(16,185,129,0.1)', emoji: '🎉', border: '#10B981' };
  }
  if (text.includes('ORDER_DELIVERED') || text.includes('LIVRÉE')) {
    return { bg: 'rgba(201,168,76,0.1)', emoji: '🚚', border: '#C9A84C' };
  }
  if (text.includes('ORDER_PAID') || text.includes('PAYÉE')) {
    return { bg: 'rgba(201,168,76,0.15)', emoji: '💰', border: '#C9A84C' };
  }
  if (text.includes('ORDER_CANCELLED') || text.includes('ANNULÉE')) {
    return { bg: 'rgba(239,68,68,0.1)', emoji: '❌', border: '#EF4444' };
  }
  if (text.includes('ORDER_RETURNED') || text.includes('RETOURNÉE')) {
    return { bg: 'rgba(245,158,11,0.1)', emoji: '↩️', border: '#F59E0B' };
  }
  return { bg: 'rgba(13,115,119,0.08)', emoji: '🔔', border: '#0D7377' };
};

const formatFullDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const notifications = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationsLoading);

  const [filter, setFilter] = useState('all'); // all, unread
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const filteredNotifs = useMemo(() => {
    return notifications.filter(n => {
      const matchesFilter = filter === 'all' || !n.read;
      const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                           n.message.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [notifications, filter, search]);

  const handleAction = (notif) => {
    if (!notif.read) dispatch(markAsReadThunk(notif.id));
    // Dynamic routing
    const target = user?.role === 'livreur' ? '/livreur/delivery' : 
                  (user?.role === 'employe' ? '/employe/dashboard' : '/admin/commandes');
    navigate(target);
  };

  return (
    <div className="max-w-2xl mx-auto pb-12 space-y-6 animate-fade-in text-start px-5 md:px-0">
      
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[var(--text)] tracking-tight uppercase">{t('admin.pro_ui.notifications_center')}</h1>
          <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] font-medium mt-1">Gérez vos alertes et l'historique d'activité</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => dispatch(fetchNotifications())}
            className="flex-1 flex items-center justify-center gap-2 py-[10px] bg-white border border-[rgba(0,0,0,0.08)] rounded-[10px] text-[13px] font-bold text-[var(--text-secondary)] shadow-sm active:scale-95 transition-all"
          >
            <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''} text-[var(--primary)]`} />
            {t('admin.pro_ui.refresh')}
          </button>
          <button 
            onClick={() => dispatch(markAllAsReadThunk())}
            className="flex-1 flex items-center justify-center gap-2 py-[10px] bg-[var(--primary)] text-white rounded-[10px] text-[13px] font-bold uppercase tracking-wider shadow-[var(--shadow-teal)] active:scale-95 transition-all"
          >
            <CheckCheck size={16} /> {t('header.notifications.mark_all')}
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3">
        <div className="relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Rechercher dans les notifications..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] py-3.5 pl-11 pr-4 text-sm font-medium text-[var(--text)] outline-none focus:ring-4 focus:ring-[var(--primary-glow)] focus:border-[var(--primary)] focus:bg-white transition-all shadow-sm"
          />
        </div>
        <div className="flex bg-white p-1 rounded-[12px] border border-[rgba(0,0,0,0.08)] shadow-sm">
          <button 
            onClick={() => setFilter('all')}
            className={`flex-1 py-2.5 rounded-[10px] text-[12px] font-bold uppercase tracking-wider transition-all duration-200 ${filter === 'all' ? 'bg-[var(--primary)] text-white shadow-[0_2px_8px_rgba(13,115,119,0.3)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
          >
            Toutes
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2.5 rounded-[10px] text-[12px] font-bold uppercase tracking-wider transition-all duration-200 ${filter === 'unread' ? 'bg-[var(--primary)] text-white shadow-[0_2px_8px_rgba(13,115,119,0.3)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
          >
            Non-lues
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-[20px] border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-sm)] overflow-hidden">
        {filteredNotifs.length > 0 ? (
          <div className="divide-y divide-[rgba(0,0,0,0.05)]">
            {filteredNotifs.map((notif) => {
              const styles = getNotificationStyles(notif.type, notif.title);
              return (
                <div 
                  key={notif.id}
                  onClick={() => handleAction(notif)}
                  className={`p-5 md:p-6 flex items-start gap-4 md:gap-5 cursor-pointer transition-colors duration-150 hover:bg-[#F7F8FA] relative group ${!notif.read ? 'bg-[rgba(13,115,119,0.04)] border-l-[4px] border-l-[#0D7377] pl-[16px] md:pl-[20px]' : 'bg-white'}`}
                >
                  <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 text-[20px] shadow-sm border border-[rgba(0,0,0,0.04)]" style={{ backgroundColor: styles.bg }}>
                    {styles.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                       <div className="flex items-center gap-2">
                          <span className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                             {notif.type.replace('_', ' ')}
                          </span>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0D7377] animate-pulse"></span>
                          )}
                       </div>
                       <span className="font-['Inter'] text-[11px] font-medium text-[var(--text-muted)] uppercase">
                          {formatFullDate(notif.createdAt)}
                       </span>
                    </div>
                    <h3 className="font-['Inter'] text-[15px] font-bold text-[var(--text)] tracking-tight mb-1">
                      {notif.title}
                    </h3>
                    <p className="font-['Inter'] text-[13px] text-[var(--text-secondary)] leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  <div className="self-center hidden md:block">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--bg)] border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-all">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center px-6 opacity-40">
            <div className="w-20 h-20 bg-[var(--bg)] rounded-[24px] flex items-center justify-center mb-6 border border-dashed border-[rgba(0,0,0,0.1)]">
              <Bell size={40} className="text-[var(--text-muted)]" />
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)] mb-1">{t('common.no_notifications')}</h3>
            <p className="font-['Inter'] text-[13px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Votre boîte de réception est vide</p>
          </div>
        )}
      </div>
    </div>
  );
}
