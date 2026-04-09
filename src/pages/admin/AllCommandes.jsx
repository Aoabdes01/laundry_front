import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Search, Loader2, Download,
  Filter, Calendar, X, RefreshCw, FileText,
  Clock, Users, Phone, Package, ChevronRight
} from 'lucide-react';
import { fetchAllCommandes, downloadCommandesCsv } from '../../store/admin/adminThunk';
import { selectAllCommandes, selectAdminLoading } from '../../store/admin/adminSelectors';
import { StatusBadge } from '../../components/StatusBadge';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const formatDateTime = (dateStr, lng) => {
  if (!dateStr) return { date: 'N/A', time: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return {
    date: 'N/A', time: ''
  };
  return {
    date: d.toLocaleDateString(lng === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    time: d.toLocaleTimeString(lng === 'ar' ? 'ar-MA' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
};

export default function AllCommandes() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const commandes = useSelector(selectAllCommandes);
  const loading = useSelector(selectAdminLoading);

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(() => {
    const params = {
      search: search || undefined,
      status: status !== 'all' ? status : undefined,
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined
    };
    dispatch(fetchAllCommandes(params));
  }, [dispatch, search, status, dateDebut, dateFin]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleExportCSV = async () => {
    try {
      await dispatch(downloadCommandesCsv()).unwrap();
      toast.success(t('admin.orders.export_success'));
    } catch (err) {
      toast.error(t('admin.orders.export_error'));
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setDateDebut('');
    setDateFin('');
  };

  const getClientDisplayName = (order) => {
    return order.client?.name || order.clientNom || order.client?.nom || 'Client #' + (order.client?.id || order.clientId || '?');
  };

  const getClientPhone = (order) => {
    return order.client?.phones?.[0]?.phoneNumber
      || order.client?.telephone
      || order.client?.telephones?.[0]?.numero
      || order.numeroTelephone
      || 'N/A';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-indigo-100 text-indigo-600', 'bg-rose-100 text-rose-600', 'bg-purple-100 text-purple-600'];
    const index = name ? name.length % colors.length : 0;
    return colors[index];
  };

  // KPI Calculations
  const totalAmount = Array.isArray(commandes) ? commandes.reduce((acc, c) => acc + (c.montantTotal || 0), 0) : 0;
  const pendingCount = Array.isArray(commandes) ? commandes.filter(c => c.status === 'en_attente').length : 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-start">
          <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">{t('admin.orders.title')}</h1>
          <p className="text-sm text-text-muted font-bold uppercase tracking-widest opacity-60">{t('admin.orders.subtitle')}</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95"
        >
          <Download size={16} />
          <span>{t('admin.orders.export_csv')}</span>
        </button>
      </div>

      {/* MINI KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4 group hover:border-primary-200 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ClipboardList size={22} />
          </div>
          <div className="text-start">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('admin.orders.kpi.global')}</p>
            <p className="text-xl font-black text-text-primary tracking-tight">{commandes?.length || 0}</p>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <RefreshCw size={22} />
          </div>
          <div className="text-start">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('admin.orders.kpi.value')}</p>
            <p className="text-xl font-black text-text-primary tracking-tight">{totalAmount.toLocaleString()} <span className="text-[10px] text-text-muted font-bold">{t('admin.orders.kpi.unit_dh')}</span></p>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4 group hover:border-amber-200 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock size={22} />
          </div>
          <div className="text-start">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('admin.orders.kpi.urgent')}</p>
            <p className="text-xl font-black text-text-primary tracking-tight">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={22} />
          </div>
          <div className="text-start">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('admin.orders.kpi.volumes')}</p>
            <p className="text-xl font-black text-text-primary tracking-tight">
              {commandes?.reduce((acc, c) => acc + (c.commandeTapis?.reduce((sum, item) => sum + (item.quantite || 1), 0) || 0), 0) || 0} <span className="text-[10px] text-text-muted font-bold">ARC</span>
            </p>
          </div>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-surface rounded-2xl border border-border/50 shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center bg-gray-50/20">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={t('admin.orders.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-xl ps-10 pe-4 py-3 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none placeholder:text-text-muted placeholder:font-normal text-start"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showFilters ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-background text-text-secondary border border-border hover:bg-border/30'}`}
            >
              <Filter size={16} />
              <span>{t('admin.orders.advanced_filters')}</span>
              {(status !== 'all' || dateDebut || dateFin) && <div className="w-1.5 h-1.5 rounded-full bg-current ms-1" />}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-3 bg-background border border-border text-text-secondary rounded-xl hover:bg-border/30 transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* EXPANDABLE FILTERS */}
        {showFilters && (
          <div className="p-8 bg-gray-50/50 border-b border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-slide-down">
            <div className="space-y-3 text-start">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block">{t('admin.orders.filter_labels.status')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-surface border border-border/80 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-tighter outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all"
              >
                {[
                  { value: 'all', label: t('admin.orders.status_options.all') },
                  { value: 'en_attente', label: t('status.en_attente') },
                  { value: 'validee', label: t('status.validee') },
                  { value: 'en_traitement', label: t('status.en_traitement') },
                  { value: 'prete', label: t('status.prete') },
                  { value: 'livree', label: t('status.livree') },
                  { value: 'payee', label: t('status.payee') },
                  { value: 'annulee', label: t('status.annulee') },
                  { value: 'retournee', label: t('status.retournee') }
                ].map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-3 text-start">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block">{t('admin.orders.filter_labels.from')}</label>
              <div className="relative">
                <Calendar size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full bg-surface border border-border/80 rounded-xl ps-10 pe-4 py-2.5 text-xs font-black outline-none focus:border-primary-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-3 text-start">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block">{t('admin.orders.filter_labels.to')}</label>
              <div className="relative">
                <Calendar size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full bg-surface border border-border/80 rounded-xl ps-10 pe-4 py-2.5 text-xs font-black outline-none focus:border-primary-500 transition-all"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="flex-1 bg-white border-2 border-dashed border-border text-text-secondary px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary-300 hover:text-primary-600 transition-all flex items-center justify-center gap-2 group"
              >
                <X size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                {t('admin.orders.filter_labels.reset')}
              </button>
            </div>
          </div>
        )}

        {/* MOBILE CARDS VIEW */}
        <div className="lg:hidden divide-y divide-border/30 bg-white">
          {loading && Array.isArray(commandes) && commandes.length === 0 ? (
            <div className="py-20 text-center">
              <Loader2 size={32} className="animate-spin text-primary-500 mx-auto mb-3" />
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('admin.orders.loading_data')}</p>
            </div>
          ) : Array.isArray(commandes) && commandes.length > 0 ? (
            commandes.map((c) => {
              const { date, time } = formatDateTime(c.updatedAt || c.dateCreation || c.createdAt || c.dateDernierStatut);
              const clientName = getClientDisplayName(c);

              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/admin/commandes/${c.id}`)}
                  className="p-5 active:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary-500 border border-border/50">
                        <FileText size={18} />
                      </div>
                      <div className="text-start">
                        <p className="text-sm font-black text-text-primary tracking-tight">#{c.numeroCommande}</p>
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{date} • {time}</p>
                      </div>
                    </div>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-start">
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">{t('admin.orders.card.recipient')}</p>
                      <p className="text-xs font-black text-text-primary truncate">{clientName}</p>
                      <p className="text-[9px] text-text-muted font-bold mt-0.5">{getClientPhone(c)}</p>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-start">
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">{t('admin.orders.card.billing')}</p>
                      <p className="text-xs font-black text-primary-600">{c.montantTotal?.toLocaleString()} {t('admin.orders.kpi.unit_dh')}</p>
                      <p className="text-[9px] text-text-muted font-bold mt-0.5 uppercase">{c.modePaiement || t('admin.orders.card.cash')}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted bg-gray-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package size={12} />
                      <span>{c.commandeTapis?.reduce((sum, item) => sum + (item.quantite || 1), 0) || 0} {t('admin.orders.kpi.articles')}</span>
                    </div>
                    <ChevronRight size={14} className="text-primary-500 rtl:rotate-180" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center opacity-40">
              <ClipboardList size={40} className="mx-auto mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest">{t('admin.orders.no_match').split('.')[0]}</p>
            </div>
          )}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden lg:block overflow-x-auto min-h-[400px]">
          <table className="w-full text-start border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.orders.table.ref')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.orders.table.contact')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.orders.table.timestamp')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">{t('admin.orders.table.volume')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{t('admin.orders.table.billing')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">{t('admin.orders.table.status')}</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 relative">
              {loading && Array.isArray(commandes) && commandes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-32 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                        <Loader2 size={32} className="animate-spin text-primary-500" />
                      </div>
                      <p className="text-xs font-black text-text-muted uppercase tracking-widest">{t('admin.orders.loading_data')}</p>
                    </div>
                  </td>
                </tr>
              ) : Array.isArray(commandes) && commandes.length > 0 ? (
                commandes.map((c) => {
                  const { date, time } = formatDateTime(c.updatedAt || c.dateCreation || c.createdAt || c.dateDernierStatut);
                  const clientName = getClientDisplayName(c);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/admin/commandes/${c.id}`)}
                      className="group hover:bg-gray-50/80 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary-500"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-border group-hover:bg-primary-50 group-hover:border-primary-100 flex items-center justify-center text-text-muted group-hover:text-primary-600 transition-all">
                            <FileText size={18} />
                          </div>
                          <div className="text-start">
                            <p className="text-sm font-black text-text-primary tracking-tight group-hover:text-primary-600 transition-colors">#{c.numeroCommande}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Package size={10} className="text-text-muted" />
                              <span className="text-[9px] text-text-muted font-black uppercase tracking-widest">{c.id.toString().substring(0, 8)}...</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-[10px] font-black shadow-inner ${getAvatarColor(clientName)}`}>
                            {getInitials(clientName)}
                          </div>
                          <div className="text-start font-black">
                            <p className="text-sm font-black text-text-primary tracking-tight truncate max-w-[140px]">{clientName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 group/phone">
                              <Phone size={10} className="text-text-muted group-hover/phone:text-primary-500 transition-colors" />
                              <p className="text-[10px] text-text-muted font-bold group-hover/phone:text-text-secondary transition-colors">{getClientPhone(c)}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-start">
                          <p className="text-sm font-black text-text-primary tracking-tight">{date}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock size={10} className="text-text-muted" />
                            <p className="text-[10px] text-text-muted font-bold tracking-widest opacity-80 uppercase">{time}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1.5 rounded-xl bg-gray-50 border border-border/80 text-[11px] font-black text-text-secondary shadow-sm">
                          {c.commandeTapis?.reduce((sum, item) => sum + (item.quantite || 1), 0) || 0}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="bg-gray-50 px-3 py-2 rounded-xl border border-border/50 inline-block shadow-sm text-start">
                          <p className="text-sm font-black text-text-primary">{c.montantTotal?.toLocaleString()} <span className="text-[10px] text-text-muted">{t('admin.orders.kpi.unit_dh')}</span></p>
                        </div>
                        <p className="text-[9px] text-text-muted font-black uppercase tracking-[0.1em] mt-1.5 px-1 text-start">{c.modePaiement || t('admin.orders.card.cash')}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center scale-90 group-hover:scale-100 transition-transform">
                          <StatusBadge status={c.status} />
                        </div>
                      </td>
                      <td className="px-6 py-5 text-end">
                        <div className="flex items-center justify-end">
                          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-text-muted group-hover:bg-primary-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-all active:scale-90">
                            <ChevronRight size={18} className="rtl:rotate-180" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-32 text-center bg-gray-50/20">
                    <div className="max-w-[200px] mx-auto opacity-40">
                      <ClipboardList size={48} className="text-text-muted mx-auto mb-4" />
                      <p className="text-xs font-black text-text-primary uppercase tracking-widest mb-1">{t('admin.orders.empty_db')}</p>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-relaxed">{t('admin.orders.no_match')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION / FOOTER INFO */}
        <div className="p-5 bg-gray-50/50 border-t border-border flex items-center justify-between">
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.1em]">
            {t('admin.orders.pagination.index')} <span className="text-text-primary font-black px-2 py-1 bg-white border border-border rounded-lg ms-1">01 - {commandes?.length || 0}</span>
          </p>
          <div className="flex gap-2">
            <button disabled className="px-4 py-2 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest opacity-50 bg-white">{t('admin.orders.pagination.prev')}</button>
            <button disabled className="px-4 py-2 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest opacity-50 bg-white shadow-sm">{t('admin.orders.pagination.next')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
