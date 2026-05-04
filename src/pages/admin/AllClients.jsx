import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Loader2, ChevronRight, Phone, 
  MapPin, Calendar, RefreshCw, Star, 
  TrendingUp, ShieldAlert, ArrowUpRight,
  ShoppingCart, SlidersHorizontal, ChevronLeft,
  Mail, Package
} from 'lucide-react';
import { fetchAllClients, fetchClientStatistics } from '../../store/admin/adminThunk';
import { selectAllClients, selectAdminLoading, selectClientStatistics } from '../../store/admin/adminSelectors';
import { useTranslation } from 'react-i18next';

export default function AllClients() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clients = useSelector(selectAllClients);
  const statistics = useSelector(selectClientStatistics);
  const loading = useSelector(selectAdminLoading);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = useCallback(() => {
    dispatch(fetchAllClients({ search: search || undefined }));
    dispatch(fetchClientStatistics());
  }, [dispatch, search]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  const colorArray = [
    'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
    'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    'bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
  ];

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const paginatedClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return clients.slice(startIndex, startIndex + itemsPerPage);
  }, [clients, currentPage]);

  const totalPages = Math.ceil((clients?.length || 0) / itemsPerPage);

  const getClientPhone = (client) => {
    if (!client) return '—';
    if (client.phone) return client.phone;
    if (client.telephone) return client.telephone;
    if (Array.isArray(client.phones) && client.phones.length > 0) {
      return client.phones[0].phoneNumber || client.phones[0].phone || '—';
    }
    if (Array.isArray(client.telephones) && client.telephones.length > 0) {
      return client.telephones[0].numero || client.telephones[0].phone || '—';
    }
    return '—';
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-start">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[var(--text)] tracking-[-0.02em]">
            {t('admin.pro_ui.client_portfolio')}
          </h1>
          <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] mt-1">
            {t('admin.clients.subtitle')}
          </p>
        </div>
        <button 
          onClick={loadData} 
          className="w-full flex items-center justify-center gap-2 px-4 py-[10px] bg-white border border-[rgba(0,0,0,0.08)] rounded-[10px] shadow-[var(--shadow-sm)] text-[13px] font-medium text-[var(--text-secondary)] active:scale-95 transition-all"
        >
          <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''} text-[var(--primary)]`} /> 
          {t('admin.pro_ui.refresh')}
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: t('admin.clients.stats.total'), value: statistics?.totalClients || clients?.length || 0, icon: Users, type: 'clients' },
          { label: t('admin.clients.stats.orders_month'), value: statistics?.commandesCeMois || 0, icon: ShoppingCart, type: 'orders' },
          { label: t('admin.clients.stats.new_month'), value: `+${statistics?.nouveauxCeMois || 0}`, icon: TrendingUp, type: 'new', sub: `${Math.round(statistics?.pourcentageNouveaux || 0)}% ${t('admin.pro_ui.growth')}` },
        ].map((stat, i) => {
          const colors = {
            clients: { accent: '#0D7377', bg: 'rgba(13,115,119,0.1)' },
            orders: { accent: '#C9A84C', bg: 'rgba(201,168,76,0.1)' },
            new: { accent: '#10B981', bg: 'rgba(16,185,129,0.1)' }
          }[stat.type] || { accent: '#0D7377', bg: 'rgba(13,115,119,0.1)' };

          return (
            <div key={i} className="bg-white rounded-[16px] border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-sm)] p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: colors.accent }} />
              <div className="w-11 h-11 rounded-[10px] flex items-center justify-center mb-4" style={{ backgroundColor: colors.bg }}>
                <stat.icon size={22} style={{ color: colors.accent }} />
              </div>
              <p className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] truncate">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[var(--text)] tracking-tight">{stat.value}</p>
                {stat.sub && <span className="font-['Inter'] text-[11px] font-bold text-[#10B981]">{stat.sub}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* SEARCH BAR */}
      <div className="relative group">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input 
          type="text" 
          placeholder={t('admin.clients.search_placeholder')} 
          value={search} 
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
          className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] py-3.5 pl-11 pr-4 text-sm font-medium text-[var(--text)] outline-none focus:ring-4 focus:ring-[var(--primary-glow)] focus:border-[var(--primary)] focus:bg-white transition-all" 
        />
      </div>

      {/* CLIENTS LIST */}
      <div className="bg-white rounded-[20px] border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-sm)] overflow-hidden">
        {/* MOBILE CARDS (Main view for mobile-first) */}
        <div className="divide-y divide-[rgba(0,0,0,0.05)]">
          {loading && paginatedClients.length === 0 ? (
             <div className="py-20 flex flex-col items-center gap-4">
               <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
               <p className="font-['Inter'] text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('admin.clients.loading_db')}</p>
             </div>
          ) : paginatedClients.length > 0 ? (
            paginatedClients.map((client, i) => {
              const roleColors = ['#0D7377', '#C9A84C', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
              const accentColor = roleColors[i % roleColors.length];
              
              return (
                <div key={client.id} onClick={() => navigate(`/admin/clients/${client.id}`)} className="p-5 active:bg-[var(--bg)] transition-colors flex flex-col gap-4 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center font-['Plus_Jakarta_Sans'] font-bold text-lg text-white shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
                      >
                        {(client.name || client.nom || 'C')[0]}
                      </div>
                      <div className="text-start">
                        <p className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)] tracking-tight leading-tight">
                          {client.name || client.nom}
                        </p>
                        <p className="font-['Inter'] text-[12px] text-[var(--text-muted)] mt-0.5">
                          {t('admin.pro_ui.last_visit')}: {formatRelativeDate(client.lastOrderDate)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-[var(--primary-surface)] text-[var(--primary)] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[rgba(13,115,119,0.1)]">
                      {client.totalCommandes || 0} CMD
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1.5 font-['Inter'] text-[13px] font-medium">
                      <Phone size={14} className="text-[#10B981]" /> 
                      {getClientPhone(client)}
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-1.5 font-['Inter'] text-[13px] font-medium truncate">
                        <Mail size={14} className="text-[var(--primary)]" /> 
                        {client.email}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center opacity-40 px-6">
              <Users size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
              <p className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)]">{t('admin.clients.no_clients')}</p>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="p-5 bg-[var(--bg)] border-t border-[rgba(0,0,0,0.05)] flex flex-col gap-4">
            <p className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center">
              {currentPage} {t('admin.pro_ui.page_of')} {totalPages}
            </p>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className="flex-1 py-3 rounded-[12px] bg-white border border-[rgba(0,0,0,0.08)] text-[13px] font-bold text-[var(--text-secondary)] disabled:opacity-40 active:scale-95 transition-all"
              >
                {t('admin.clients.pagination.prev')}
              </button>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className="flex-1 py-3 rounded-[12px] bg-white border border-[rgba(0,0,0,0.08)] text-[13px] font-bold text-[var(--text-secondary)] disabled:opacity-40 active:scale-95 transition-all"
              >
                {t('admin.clients.pagination.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
