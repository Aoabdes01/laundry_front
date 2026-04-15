import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle2, Wrench, PackageCheck, ChevronRight,
  RefreshCw, Loader2, Package, TableProperties,
  AlertTriangle, AlertCircle, X, Filter, CalendarDays,
  LayoutList, Sun, Search, History, Inbox, Hash
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchAllCommandes } from '../../store/employe/employeThunk';
import { selectCommandes, selectLoading } from '../../store/employe/employeSelectors';
import { COMMANDE_STATUS } from '../../store/employe/employeSlice';
import { StatusBadge } from '../../components/StatusBadge';

export default function EmployeDashboard() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const commandes = useSelector(selectCommandes);
  const loading = useSelector(selectLoading);

  const [showAll, setShowAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'handover'

  const STATUS_CONFIG = useMemo(() => ({
    [COMMANDE_STATUS.EN_ATTENTE]: { label: t('workshop.stats.en_attente'), accentBg: 'bg-orange-50', accentText: 'text-orange-500', icon: Clock },
    [COMMANDE_STATUS.VALIDEE]: { label: t('status.validee'), accentBg: 'bg-blue-50', accentText: 'text-blue-500', icon: CheckCircle2 },
    [COMMANDE_STATUS.EN_TRAITEMENT]: { label: t('workshop.stats.en_traitement'), accentBg: 'bg-violet-50', accentText: 'text-violet-500', icon: Wrench },
    [COMMANDE_STATUS.PRETE]: { label: t('workshop.stats.pretes'), accentBg: 'bg-teal-50', accentText: 'text-teal-500', icon: PackageCheck },
  }), [t]);

  useEffect(() => {
    dispatch(fetchAllCommandes());
  }, [dispatch]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const isPastUnfinished = (order) => {
    const d = new Date(order.dateCreation || order.createdAt);
    d.setHours(0, 0, 0, 0);
    const unfinished = ['en_attente', 'validee', 'en_traitement', 'EN_ATTENTE', 'VALIDEE', 'EN_TRAITEMENT'];
    return d.getTime() < today.getTime() && unfinished.includes(order.status);
  };

  const baseOrders = useMemo(() => {
    let filtered;
    if (viewMode === 'active') {
      filtered = commandes.filter(o =>
        o.status !== COMMANDE_STATUS.LIVREE &&
        o.status !== COMMANDE_STATUS.PAYEE &&
        o.status !== COMMANDE_STATUS.ANNULEE
      );
    } else {
      // Handover view: ONLY LIVREE (Employee should not see paid orders)
      filtered = commandes.filter(o => o.status === COMMANDE_STATUS.LIVREE);
    }

    if (showAll) {
      return [...filtered].sort((a, b) => {
        if (viewMode === 'active') {
          if (isPastUnfinished(a) && !isPastUnfinished(b)) return -1;
          if (!isPastUnfinished(a) && isPastUnfinished(b)) return 1;
        }
        return new Date(b.dateCreation || b.createdAt) - new Date(a.dateCreation || a.createdAt);
      });
    }

    return filtered
      .filter(o => isToday(o.dateCreation || o.createdAt))
      .sort((a, b) => new Date(b.dateCreation || b.createdAt) - new Date(a.dateCreation || a.createdAt));
  }, [commandes, showAll, today, viewMode]);

  const filteredOrders = useMemo(() => {
    let result = baseOrders;

    if (activeFilter && viewMode === 'active') {
      result = result.filter(o => {
        const s = o.status?.toLowerCase();
        return Array.isArray(activeFilter) ? activeFilter.includes(s) : s === activeFilter;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o => o.numeroCommande?.toLowerCase().includes(term));
    }

    return result;
  }, [baseOrders, activeFilter, searchTerm, viewMode]);

  const overdueCount = useMemo(() => {
    const activeCommandes = commandes.filter(o =>
      o.status !== COMMANDE_STATUS.LIVREE &&
      o.status !== COMMANDE_STATUS.PAYEE &&
      o.status !== COMMANDE_STATUS.ANNULEE
    );
    return activeCommandes.filter(o => isPastUnfinished(o)).length;
  }, [commandes, today]);

  const statCounts = useMemo(() => ({
    en_attente: baseOrders.filter(o => o.status?.toLowerCase() === 'en_attente').length,
    en_traitement: baseOrders.filter(o => o.status?.toLowerCase() === 'en_traitement').length,
    prete: baseOrders.filter(o => o.status?.toLowerCase() === 'prete').length,
  }), [baseOrders]);

  const stats = useMemo(() => [
    { key: COMMANDE_STATUS.EN_ATTENTE, label: t('workshop.stats.en_attente'), count: statCounts.en_attente, filterValue: 'en_attente' },
    { key: COMMANDE_STATUS.EN_TRAITEMENT, label: t('workshop.stats.en_traitement'), count: statCounts.en_traitement, filterValue: 'en_traitement' },
    { key: COMMANDE_STATUS.PRETE, label: t('workshop.stats.pretes'), count: statCounts.prete, filterValue: 'prete' },
  ], [t, statCounts]);

  return (
    <div className="space-y-6 md:space-y-8 pb-16 px-4 md:px-0 animate-fade-in">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-2">
        <div className="text-start">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-text-primary uppercase tracking-tight">{t('workshop.title')}</h1>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              {t('workshop.active')}
            </span>
          </div>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60">{t('workshop.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-surface p-1.5 rounded-2xl border border-border/50 shadow-sm w-full sm:w-auto">
            <button
              onClick={() => { setViewMode('active'); setActiveFilter(null); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'active' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-text-muted hover:text-text-primary hover:bg-background/50'
                }`}
            >
              <Inbox size={14} strokeWidth={2.5} /> {t('admin.nav.production', 'Production')}
            </button>
            <button
              onClick={() => { setViewMode('handover'); setActiveFilter(null); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'handover' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-text-muted hover:text-text-primary hover:bg-background/50'
                }`}
            >
              <History size={14} strokeWidth={2.5} /> {t('admin.nav.sorties', 'Sorties')}
            </button>
          </div>

          <button
            onClick={() => dispatch(fetchAllCommandes())}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface border border-border/50 text-text-muted hover:text-primary-500 hover:bg-background transition-all active:scale-95 shadow-sm shrink-0"
          >
            {loading?.commandes ? <Loader2 size={20} className="animate-spin text-primary-500" /> : <RefreshCw size={20} strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* KPI STATS */}
      {viewMode === 'active' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-in slide-in-from-bottom duration-500">
          {stats.map(stat => {
            const cfg = STATUS_CONFIG[stat.key] || STATUS_CONFIG[COMMANDE_STATUS.EN_ATTENTE];
            const Icon = cfg.icon;
            const isActive = JSON.stringify(activeFilter) === JSON.stringify(stat.filterValue);
            return (
              <div
                key={stat.key}
                onClick={() => setActiveFilter(isActive ? null : stat.filterValue)}
                className={`bg-surface rounded-[2rem] shadow-card p-6 md:p-8 text-start border cursor-pointer hover:shadow-xl transition-all group overflow-hidden relative ${isActive ? 'border-primary-500 ring-2 ring-primary-500/20 scale-[1.02]' : 'border-border/50 hover:border-primary-300'
                  }`}
              >
                <div className={`absolute top-0 start-0 w-1.5 h-full transition-colors ${isActive ? 'bg-primary-500' : 'bg-transparent'}`} />
                <div className="flex items-start justify-between mb-6 ps-2">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[1.25rem] ${cfg.accentBg} ${cfg.accentText} dark:bg-opacity-10 flex items-center justify-center shadow-sm border border-current/10 transition-transform group-hover:scale-110`}>
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <span className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter leading-none">{stat.count}</span>
                </div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ps-2 leading-tight">
                  {stat.label.replace(' (', '\n(')}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* OVERDUE ALERT */}
      {viewMode === 'active' && overdueCount > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-6 md:p-8 flex items-center gap-6 shadow-sm animate-in zoom-in-95 duration-500 text-start group">
          <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-red-500 shadow-sm shrink-0 border border-red-500/20 group-hover:scale-110 transition-transform">
            <AlertTriangle size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-lg font-black text-red-600 dark:text-red-400 uppercase tracking-tight mb-1">{t('workshop.overdue.title')}</p>
            <p className="text-[10px] text-red-600/80 font-black uppercase tracking-[0.2em]">
              {t('workshop.overdue.body', { count: overdueCount })}
            </p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

        {/* LEFT/MAIN: ORDERS LIST */}
        <div className="lg:col-span-3 space-y-6">

          {/* SEARCH & FILTERS */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 start-0 ps-5 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-500 transition-colors">
                <Search size={20} strokeWidth={2.5} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('common.search_placeholder')}
                className="w-full bg-surface border border-border/50 rounded-[1.5rem] py-4 ps-14 pe-12 text-sm font-black text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-primary-500 transition-all shadow-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 end-0 pe-5 flex items-center text-text-muted hover:text-red-500 transition-colors">
                  <X size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {(activeFilter || searchTerm) && (
                <button
                  onClick={() => { setActiveFilter(null); setSearchTerm(''); }}
                  className="px-5 py-4 rounded-[1.5rem] bg-red-50 dark:bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-100 transition-colors border border-red-200 dark:border-red-500/20 shadow-sm whitespace-nowrap"
                >
                  <X size={14} strokeWidth={3} /> {t('workshop.table.clear_filter')}
                </button>
              )}
              <button
                onClick={() => { setShowAll(!showAll); setActiveFilter(null); }}
                className={`px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-sm whitespace-nowrap border ${showAll
                  ? 'bg-primary-500/10 text-primary-600 border-primary-500/20'
                  : 'bg-surface text-text-muted border-border/50 hover:border-primary-300'
                  }`}
              >
                {showAll ? <><CalendarDays size={16} strokeWidth={2.5} />{viewMode === 'handover' ? t('workshop.pro_ui.today_handover', "Sorties d'aujourd'hui") : t('workshop.table.view_today')}</>
                  : <><LayoutList size={16} strokeWidth={2.5} />{viewMode === 'handover' ? t('workshop.pro_ui.handover_history', "Historique Sorties") : t('workshop.table.view_all')}</>}
              </button>
            </div>
          </div>

          {/* LIST/TABLE CONTAINER */}
          <div className="bg-surface rounded-[2rem] shadow-card border border-border/50 overflow-hidden">
            <div className="px-6 md:px-8 py-5 border-b border-border/50 bg-background/30 flex items-center justify-between">
              <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                {viewMode === 'handover' ? t('workshop.pro_ui.handover_registry', 'Registre des Sorties') : (showAll ? t('workshop.table.all_orders') : t('workshop.table.today_orders'))}
                <span className="bg-background text-text-primary px-2.5 py-0.5 rounded-md border border-border/50">{filteredOrders.length}</span>
              </h2>
              {loading?.commandes && <Loader2 size={16} className="animate-spin text-primary-400" />}
            </div>

            {loading?.commandes && filteredOrders.length === 0 ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-background rounded-2xl animate-pulse" />)}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-24 px-6 text-center opacity-40">
                <div className="w-20 h-20 bg-background rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-border/50">
                  <Sun className="w-10 h-10 text-text-muted" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight mb-2">
                  {viewMode === 'active' ? t('workshop.table.no_orders_today') : t('workshop.pro_ui.empty_registry', 'Aucune sortie enregistrée')}
                </h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('workshop.pro_ui.empty_registry_desc', 'Le registre est actuellement vide')}</p>
              </div>
            ) : (
              <>
                {/* MOBILE CARDS */}
                <div className="lg:hidden divide-y divide-border/40">
                  {filteredOrders.map(order => {
                    const isOverdue = viewMode === 'active' && isPastUnfinished(order);
                    return (
                      <div key={order.id} onClick={() => navigate(`/employe/commandes/${order.id}`)} className="p-6 active:bg-background/50 transition-colors flex flex-col gap-5 text-start relative group">
                        {isOverdue && <div className="absolute top-0 start-0 w-1.5 h-full bg-red-500" />}
                        <div className="flex items-start justify-between gap-4 ps-1">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 border ${isOverdue ? 'bg-red-50 dark:bg-red-500/10 text-red-500 border-red-200 dark:border-red-500/20' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 border-primary-100 dark:border-primary-500/20'}`}>
                              <Package size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 opacity-60 mb-0.5">
                                <Hash size={12} className="text-primary-500" />
                                <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.table.headers.order')}</span>
                              </div>
                              <p className="text-xl font-black text-text-primary tracking-tighter">#{order.numeroCommande}</p>
                            </div>
                          </div>
                          <div className="text-end">
                            <StatusBadge status={order.status} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-background/50 p-4 rounded-2xl border border-border/50 ps-1">
                          <div className="flex items-center gap-5">
                            <div className="text-start">
                              <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">{t('workshop.table.headers.articles')}</p>
                              <p className="text-sm font-black text-text-primary tracking-tight">{order.commandeTapis?.length || 0} Unités</p>
                            </div>
                            <div className="w-px h-8 bg-border/50" />
                            <div className="text-start">
                              <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">{t('workshop.table.headers.date')}</p>
                              <p className="text-xs font-black text-text-primary tracking-tight uppercase">
                                {new Date(order.dateCreation || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center text-text-muted group-hover:text-primary-500 transition-colors shadow-sm">
                            <ChevronRight size={18} strokeWidth={3} className="rtl:rotate-180" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden lg:block w-full overflow-x-auto">
                  <table className="w-full text-start">
                    <thead>
                      <tr className="bg-background/50 border-b border-border/50">
                        <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.table.headers.order')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.table.headers.articles')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.table.headers.status')}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.table.headers.date')}</th>
                        <th className="px-8 py-5 text-end text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.table.headers.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredOrders.map(order => {
                        const isOverdue = viewMode === 'active' && isPastUnfinished(order);
                        return (
                          <tr key={order.id} className={`hover:bg-background/40 transition-colors group relative ${isOverdue ? 'bg-red-500/[0.02]' : ''}`}>
                            <td className="px-8 py-6 relative">
                              {isOverdue && <div className="absolute top-0 start-0 w-1 h-full bg-red-500" />}
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 border ${isOverdue ? 'bg-red-50 dark:bg-red-500/10 text-red-500 border-red-200 dark:border-red-500/20' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 border-primary-100 dark:border-primary-500/20'}`}>
                                  <Package size={22} strokeWidth={2.5} />
                                </div>
                                <p className="text-base font-black text-text-primary tracking-tighter">#{order.numeroCommande}</p>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-text-primary uppercase tracking-tight">{order.commandeTapis?.length || 0} Unités</td>
                            <td className="px-8 py-6"><StatusBadge status={order.status} /></td>
                            <td className="px-8 py-6">
                              <p className="text-xs font-black text-text-primary uppercase tracking-tight">
                                {new Date(order.dateCreation || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}
                              </p>
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1 opacity-80">
                                {new Date(order.dateCreation || order.createdAt).toLocaleTimeString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>
                            <td className="px-8 py-6 text-end">
                              <button onClick={() => navigate(`/employe/commandes/${order.id}`)} className="inline-flex items-center gap-2.5 bg-surface border border-border/50 text-primary-600 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-sm active:scale-95 group/btn">
                                {viewMode === 'handover' ? t('workshop.pro_ui.verify', 'Vérifier') : t('workshop.table.manage_btn')} <ChevronRight size={14} strokeWidth={3} className="rtl:rotate-180 group-hover/btn:translate-x-0.5 transition-transform" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVITY LOG (DESKTOP ONLY) */}
        <div className="hidden lg:block lg:col-span-1 shrink-0">
          <div className="bg-surface rounded-[2rem] shadow-card p-8 sticky top-[88px] border border-border/50 max-h-[calc(100vh-140px)] overflow-y-auto text-start">
            <div className="flex items-center gap-3 mb-8">
              <History size={18} className="text-primary-500" strokeWidth={2.5} />
              <h2 className="text-sm font-black text-text-primary uppercase tracking-tight">{t('workshop.activity.title')}</h2>
            </div>

            {commandes.length === 0 ? (
              <div className="py-16 flex flex-col items-center text-center opacity-40">
                <div className="w-16 h-16 rounded-2xl bg-background border border-border/50 flex items-center justify-center mb-4">
                  <RefreshCw size={28} className="text-text-muted" />
                </div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.activity.no_activity')}</p>
              </div>
            ) : (
              <div className="space-y-8 relative">
                <div className="absolute start-[19px] top-4 bottom-4 w-0.5 bg-border/50 rounded-full" />
                {[...commandes].sort((a, b) => new Date(b.dateCreation || b.createdAt) - new Date(a.dateCreation || a.createdAt)).slice(0, 15).map((order, idx) => {
                  const cfg = STATUS_CONFIG[order.status] || { label: order.status, icon: Package, accentBg: 'bg-background', accentText: 'text-text-secondary' };
                  const Icon = cfg.icon;
                  return (
                    <div key={order.id} className="relative ps-12 group cursor-pointer hover:bg-background/40 p-2 -my-2 rounded-xl transition-colors" onClick={() => navigate(`/employe/commandes/${order.id}`)}>
                      <div className={`absolute start-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-surface ring-4 ring-background/80 ${cfg.accentBg} ${cfg.accentText} z-10 transition-transform group-hover:scale-110`}>
                        <Icon size={18} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-black text-text-primary truncate tracking-tighter">#{order.numeroCommande}</p>
                          <span className="text-[8px] font-black text-text-muted/60 uppercase tracking-widest shrink-0">{new Date(order.dateCreation || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}</span>
                        </div>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-relaxed">
                          {t('workshop.activity.transition', { status: cfg.label })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
