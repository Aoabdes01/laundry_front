import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Loader2, ChevronRight, Phone, 
  MapPin, Calendar, RefreshCw, Star, 
  TrendingUp, ShieldAlert, ArrowUpRight,
  ShoppingCart, SlidersHorizontal, ChevronLeft
} from 'lucide-react';
import { fetchAllClients, fetchClientStatistics } from '../../store/admin/adminThunk';
import { selectAllClients, selectAdminLoading, selectClientStatistics } from '../../store/admin/adminSelectors';
import { selectCurrentUser } from '../../store/auth/authSelector';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export default function AllClients() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clients = useSelector(selectAllClients);
  const statistics = useSelector(selectClientStatistics);
  const loading = useSelector(selectAdminLoading);
  const user = useSelector(selectCurrentUser);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = useCallback(() => {
    dispatch(fetchAllClients({ search: search || undefined }));
    dispatch(fetchClientStatistics());
  }, [dispatch, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const colorArray = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-yellow-100 text-yellow-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
  ]

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return t('admin.clients.not_specified')
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor(
      (now - date) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === 0) return t('admin.clients.relative_dates.today')
    if (diffDays === 1) return t('admin.clients.relative_dates.yesterday')
    if (diffDays < 7) return t('admin.clients.relative_dates.days_ago', { count: diffDays })
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const paginatedClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return clients.slice(startIndex, startIndex + itemsPerPage);
  }, [clients, currentPage]);

  const totalPages = Math.ceil((clients?.length || 0) / itemsPerPage);

  return (
    <div className="space-y-6 pb-20 px-4 md:px-0 animate-fade-in">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-start">
          <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight">{t('admin.clients.title')}</h1>
          <p className="text-[10px] text-text-muted mt-0.5 font-bold uppercase tracking-widest">{t('admin.clients.subtitle')}</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-2xl shadow-card px-5 py-4 border border-border/50 flex items-center gap-4 hover:border-primary-100 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <div className="text-start">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">{t('admin.clients.stats.total')}</p>
            <p className="text-2xl font-black text-text-primary tracking-tight">{statistics?.totalClients || clients?.length || 0}</p>
          </div>
        </div>
        
        <div className="bg-surface rounded-2xl shadow-card px-5 py-4 border border-border/50 flex items-center gap-4 hover:border-primary-100 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingCart size={24} />
          </div>
          <div className="text-start">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">{t('admin.clients.stats.orders_month')}</p>
            <p className="text-2xl font-black text-text-primary tracking-tight">{statistics?.commandesCeMois || 0}</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl shadow-card px-5 py-4 border border-border/50 flex items-center gap-4 hover:border-primary-100 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <div className="text-start">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-0.5">{t('admin.clients.stats.new_month')}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-text-primary tracking-tight">{statistics?.nouveauxCeMois || 0}</p>
              <span className="text-[10px] font-black text-green-600">+{Math.round(statistics?.pourcentageNouveaux || 0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm group focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/5 transition-all">
        <Search size={20} className="text-text-muted group-focus-within:text-primary-500 transition-colors" />
        <input 
          type="text" 
          placeholder={t('admin.clients.search_placeholder')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1 text-sm font-bold text-text-primary placeholder:text-text-muted placeholder:font-medium outline-none bg-transparent text-start"
        />
        <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-background rounded-lg transition-all">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* TABLE SECTION */}
      <div className="space-y-4">
        
        {/* Mobile card list (md:hidden) */}
        <div className="md:hidden space-y-3">
          {loading && paginatedClients.length === 0 ? (
             <div className="py-10 text-center bg-white rounded-2xl border border-border/50 shadow-sm">
                <Loader2 size={32} className="animate-spin text-primary-400 mx-auto mb-3" />
                <p className="text-xs font-black text-text-muted uppercase tracking-widest">{t('common.loading')}</p>
             </div>
          ) : paginatedClients.length > 0 ? (
            paginatedClients.map((client, index) => (
              <div key={client.id}
                className="bg-white rounded-2xl shadow-card p-4 border border-border hover:border-primary-200 transition-all active:scale-[0.98]"
              >
                {/* Top row: avatar + name + since date */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${colorArray[index % colorArray.length]}`}>
                    {getInitials(client.nom || client.name)}
                  </div>
                   <div className="flex-1 min-w-0 text-start">
                    <p className="text-sm font-bold text-text-primary truncate">
                      {client.nom || client.name || 'Client #' + client.id}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5 font-bold uppercase tracking-tight">
                      {t('admin.clients.client_since')} {formatDate(client.createdAt)}
                    </p>
                  </div>
                  {/* Orders count badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${client.totalCommandes > 0 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-text-muted'}`}>
                    {client.totalCommandes || 0}
                  </div>
                </div>

                {/* Middle row: phone */}
                <div className="flex items-center gap-2 mb-3 text-sm text-text-secondary font-bold">
                  <Phone className="w-3.5 h-3.5 text-text-muted flex-shrink-0"/>
                   <span>
                    {client.telephones?.[0]?.numero 
                     || client.telephone 
                     || client.phones?.[0]?.phoneNumber
                     || t('admin.clients.not_specified')}
                  </span>
                </div>

                {/* Bottom row: last order + action button */}
                 <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-[10px] text-text-muted font-bold uppercase tracking-tight text-start">
                    <span className="opacity-60">{t('admin.clients.last_order')}</span>{' '}
                    <span className="text-text-secondary">
                      {client.lastOrderDate ? formatRelativeDate(client.lastOrderDate) : t('admin.clients.not_specified')}
                    </span>
                  </div>
                   <button
                    onClick={() => navigate(`/admin/clients/${client.id}`)}
                    className="flex items-center gap-1 text-primary-500 text-xs font-black uppercase tracking-widest hover:text-primary-600"
                  >
                    {t('admin.clients.view_orders')}
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" strokeWidth={3}/>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 bg-white rounded-2xl border border-dashed border-border text-center">
               <Search size={24} className="text-text-muted opacity-20 mx-auto mb-3" />
               <p className="text-xs font-black text-text-muted uppercase tracking-widest">{t('admin.clients.no_clients')}</p>
            </div>
          )}
        </div>

        {/* Desktop/Tablet table (hidden on mobile) */}
        <div className="hidden md:block overflow-hidden bg-surface rounded-2xl shadow-card border border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.clients.table.client')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.clients.table.contact')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.clients.table.last_order')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.clients.table.orders')}</th>
                  <th className="px-6 py-4 text-end text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-end">{t('admin.clients.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading && paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <Loader2 size={32} className="animate-spin text-primary-400 mx-auto mb-3" />
                      <p className="text-xs font-black text-text-muted uppercase tracking-widest">{t('admin.clients.loading_db')}</p>
                    </td>
                  </tr>
                ) : paginatedClients.length > 0 ? (
                  paginatedClients.map((client, index) => (
                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${colorArray[index % colorArray.length]}`}>
                            {getInitials(client.name || client.nom)}
                          </div>
                          <div className="text-start">
                            <p className="text-sm font-black text-text-primary tracking-tight">
                              {client.name || client.nom || `Client #${client.id}`}
                            </p>
                            <p className="text-[10px] text-text-muted mt-0.5 font-bold uppercase tracking-tight">
                              {t('admin.clients.client_since')} {formatDate(client.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
                           <Phone size={14} className="text-text-muted" />
                           {(client.phones && client.phones[0]?.phoneNumber) || client.telephone || '—'}
                        </div>
                        {client.email && (
                          <p className="text-[10px] text-text-muted mt-1 font-bold lowercase opacity-60 truncate max-w-[200px] text-start">{client.email}</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-tight">
                          {formatRelativeDate(client.lastOrderDate)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs
                          ${client.totalCommandes > 0 
                            ? 'bg-primary-100 text-primary-600' 
                            : 'bg-gray-100 text-text-muted border border-border/50'}`}>
                          {client.totalCommandes || 0}
                        </div>
                      </td>
                       <td className="px-6 py-5 text-end">
                        <button 
                          onClick={() => navigate(`/admin/clients/${client.id}`)}
                                                  className="inline-flex items-center gap-2 text-primary-500 text-[10px] font-black uppercase tracking-widest hover:text-primary-600 active:scale-95 transition-all"
                        >
                          {t('admin.clients.details')} <ChevronRight size={14} strokeWidth={3} className="rtl:rotate-180" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                     <td colSpan="5" className="py-24 text-center">
                      <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-border opacity-30">
                        <Search size={24} />
                      </div>
                      <p className="text-sm font-black text-text-primary uppercase tracking-tight">{t('admin.clients.no_results')}</p>
                      <p className="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-widest">{t('admin.clients.adjust_search')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
         <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-border/40">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
            {t('admin.clients.pagination.display')} <span className="text-text-primary">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-text-primary">{Math.min(currentPage * itemsPerPage, clients?.length || 0)}</span> {t('admin.clients.pagination.of')} <span className="text-text-primary">{clients?.length || 0}</span>
          </p>
          <div className="flex items-center gap-3">
            <button               disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-[10px] font-black uppercase tracking-widest text-text-secondary hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft size={16} strokeWidth={3} className="rtl:rotate-180" />
              {t('admin.clients.pagination.prev')}
            </button>
            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all active:scale-95 ${currentPage === i + 1 ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-surface border border-border text-text-secondary hover:bg-slate-50'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button               disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-[10px] font-black uppercase tracking-widest text-text-secondary hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {t('admin.clients.pagination.next')}
              <ChevronRight size={16} strokeWidth={3} className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

