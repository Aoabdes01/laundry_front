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
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight">{t('admin.pro_ui.client_portfolio')}</h1>
          <p className="text-sm text-text-muted font-bold uppercase tracking-widest opacity-60">{t('admin.clients.subtitle')}</p>
        </div>
        <button onClick={loadData} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface border border-border/50 text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-background transition-all shadow-sm">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {t('admin.pro_ui.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { label: t('admin.clients.stats.total'), value: statistics?.totalClients || clients?.length || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t('admin.clients.stats.orders_month'), value: statistics?.commandesCeMois || 0, icon: ShoppingCart, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: t('admin.clients.stats.new_month'), value: `+${statistics?.nouveauxCeMois || 0}`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10', sub: `${Math.round(statistics?.pourcentageNouveaux || 0)}% ${t('admin.pro_ui.growth')}` },
        ].map((stat, i) => (
          <div key={i} className="bg-surface p-5 rounded-[2rem] border border-border/50 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-2xl font-black text-text-primary tracking-tight">{stat.value}</p>
              {stat.sub && <p className="text-[10px] font-bold text-green-600 uppercase tracking-tighter mt-0.5">{stat.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="relative group">
        <Search size={20} className="absolute start-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors" />
        <input type="text" placeholder={t('admin.clients.search_placeholder')} value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full bg-surface border border-border/50 rounded-2xl ps-12 pe-4 py-4 text-sm font-bold text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all shadow-sm" />
      </div>

      <div className="bg-surface rounded-[2rem] border border-border/50 shadow-card overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-background/50 border-b border-border/50">
                <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('admin.clients.table.client')}</th>
                <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('admin.clients.table.contact')}</th>
                <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('admin.clients.table.last_order')}</th>
                <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">{t('admin.clients.table.orders')}</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading && paginatedClients.length === 0 ? (
                <tr><td colSpan="5" className="py-20 text-center"><Loader2 size={32} className="animate-spin text-primary-500 mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('admin.clients.loading_db')}</p></td></tr>
              ) : paginatedClients.length > 0 ? (
                paginatedClients.map((client, i) => (
                  <tr key={client.id} className="group hover:bg-background/40 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${colorArray[i % colorArray.length]}`}>{ (client.name || client.nom || 'C')[0] }</div>
                        <div className="text-start">
                          <p className="text-sm font-black text-text-primary tracking-tight">{client.name || client.nom}</p>
                          <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{t('admin.pro_ui.member_since')} {new Date(client.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-text-primary"><Phone size={12} className="text-text-muted" /> {getClientPhone(client)}</div>
                        {client.email && <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted opacity-60"><Mail size={10} /> {client.email}</div>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-text-primary uppercase tracking-tight">{formatRelativeDate(client.lastOrderDate)}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-background border border-border/50 text-xs font-black text-primary-600 shadow-sm">{client.totalCommandes || 0}</span>
                    </td>
                    <td className="px-8 py-5 text-end">
                      <button onClick={() => navigate(`/admin/clients/${client.id}`)} className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-text-muted group-hover:text-primary-500 group-hover:bg-surface transition-all active:scale-90 shadow-sm border border-border/50"><ChevronRight size={18} className="rtl:rotate-180" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="py-20 text-center opacity-40"><Users size={48} className="mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">{t('admin.clients.no_clients')}</p></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="lg:hidden divide-y divide-border/30">
          {paginatedClients.map((client, i) => (
            <div key={client.id} onClick={() => navigate(`/admin/clients/${client.id}`)} className="p-5 active:bg-background transition-colors flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${colorArray[i % colorArray.length]}`}>{ (client.name || client.nom || 'C')[0] }</div>
                  <div className="text-start">
                    <p className="text-base font-black text-text-primary tracking-tight">{client.name || client.nom}</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{t('admin.pro_ui.last_visit')}: {formatRelativeDate(client.lastOrderDate)}</p>
                  </div>
                </div>
                <div className="bg-primary-500/10 text-primary-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-500/20">{client.totalCommandes || 0} CMD</div>
              </div>
              <div className="flex items-center gap-4 text-text-muted">
                <div className="flex items-center gap-1.5 text-[10px] font-bold"><Phone size={14} /> {getClientPhone(client)}</div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold truncate"><Mail size={14} /> {client.email || '—'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="p-6 bg-background/30 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{currentPage} {t('admin.pro_ui.page_of')} {totalPages} {t('admin.pro_ui.pages')} • {clients?.length} {t('admin.nav.clients').toLowerCase()}</p>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 rounded-xl bg-surface border border-border/50 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 active:scale-95 transition-all">{t('admin.clients.pagination.prev')}</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 rounded-xl bg-surface border border-border/50 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 active:scale-95 transition-all">{t('admin.clients.pagination.next')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
