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

const getNotificationStyles = (type) => {
  switch (type) {
    case 'NEW_ORDER':       return { icon: Package, color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' };
    case 'ORDER_READY':     return { icon: CheckCheck, color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
    case 'PAYMENT_RECEIVED': return { icon: DollarSign, color: 'bg-purple-500', text: 'text-purple-600', bg: 'bg-purple-50' };
    case 'ORDER_CANCELLED':  return { icon: BellOff, color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' };
    default:                return { icon: Bell, color: 'bg-primary-500', text: 'text-primary-600', bg: 'bg-primary-50' };
  }
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
    <div className="max-w-4xl mx-auto pb-12 space-y-6 animate-fade-in text-start px-4 md:px-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight">{t('admin.pro_ui.notifications_center')}</h1>
          <p className="text-sm text-text-muted font-bold uppercase tracking-widest opacity-60">Gérez vos alertes et l'historique d'activité</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => dispatch(fetchNotifications())}
            className="p-2.5 bg-surface border border-border/50 rounded-xl text-text-muted hover:text-primary-500 transition-all shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => dispatch(markAllAsReadThunk())}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
          >
            <CheckCheck size={14} /> Tout marquer comme lu
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative group">
          <Search size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Rechercher dans les notifications..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border/50 rounded-2xl ps-12 pe-4 py-3.5 text-sm font-bold text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
          />
        </div>
        <div className="flex bg-surface p-1 rounded-2xl border border-border/50 shadow-sm">
          <button 
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-background text-primary-600 shadow-inner' : 'text-text-muted hover:text-text-primary'}`}
          >
            Toutes
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'unread' ? 'bg-background text-primary-600 shadow-inner' : 'text-text-muted hover:text-text-primary'}`}
          >
            Non-lues
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-surface rounded-[2rem] border border-border/50 shadow-card overflow-hidden">
        {filteredNotifs.length > 0 ? (
          <div className="divide-y divide-border/30">
            {filteredNotifs.map((notif) => {
              const styles = getNotificationStyles(notif.type);
              const Icon = styles.icon;
              return (
                <div 
                  key={notif.id}
                  onClick={() => handleAction(notif)}
                  className={`p-5 md:p-6 flex items-start gap-4 md:gap-6 cursor-pointer hover:bg-background/50 transition-all relative group ${!notif.read ? 'bg-primary-500/[0.02]' : ''}`}
                >
                  {!notif.read && <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary-500" />}
                  
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${!notif.read ? `${styles.color} text-white border-transparent shadow-lg shadow-current/20 scale-105` : 'bg-background text-text-muted border-border'}`}>
                    <Icon size={24} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-black uppercase tracking-widest ${!notif.read ? styles.text : 'text-text-muted'}`}>
                          {notif.type.replace('_', ' ')}
                        </span>
                        {!notif.read && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs font-black uppercase tracking-tighter animate-pulse">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted uppercase">
                        <Clock size={12} />
                        {formatFullDate(notif.createdAt)}
                      </div>
                    </div>
                    <h3 className={`text-base font-black tracking-tight mb-1 ${!notif.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {notif.title}
                    </h3>
                    <p className="text-sm text-text-muted font-medium leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-text-muted">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center px-6 opacity-40">
            <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mb-6">
              <BellOff size={48} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mb-2">{t('common.no_notifications')}</h3>
            <p className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Votre boîte de réception est vide</p>
          </div>
        )}
      </div>
    </div>
  );
}
