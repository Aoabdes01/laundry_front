import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle2, Wrench, PackageCheck, ChevronRight,
  RefreshCw, Loader2, Package, TableProperties,
  AlertTriangle, AlertCircle, X, Filter, CalendarDays, 
  LayoutList, Sun, Search, History, Inbox
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
    [COMMANDE_STATUS.EN_ATTENTE]:    { label: t('workshop.stats.en_attente'),    accentBg: 'bg-orange-50',  accentText: 'text-orange-500',  icon: Clock },
    [COMMANDE_STATUS.VALIDEE]:       { label: t('status.validee'),               accentBg: 'bg-blue-50',    accentText: 'text-blue-500',    icon: CheckCircle2 },
    [COMMANDE_STATUS.EN_TRAITEMENT]: { label: t('workshop.stats.en_traitement'), accentBg: 'bg-violet-50',  accentText: 'text-violet-500',  icon: Wrench },
    [COMMANDE_STATUS.PRETE]:         { label: t('workshop.stats.pretes'),        accentBg: 'bg-teal-50',    accentText: 'text-teal-500',    icon: PackageCheck },
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
    { key: COMMANDE_STATUS.EN_ATTENTE,    label: t('workshop.stats.en_attente'),    count: statCounts.en_attente, filterValue: 'en_attente' },
    { key: COMMANDE_STATUS.EN_TRAITEMENT, label: t('workshop.stats.en_traitement'), count: statCounts.en_traitement, filterValue: 'en_traitement' },
    { key: COMMANDE_STATUS.PRETE,         label: t('workshop.stats.pretes'),        count: statCounts.prete, filterValue: 'prete' },
  ], [t, statCounts]);

  return (
    <div className="space-y-5 pb-8 px-4 md:px-0">
      <div className="flex items-center justify-between">
        <div className="text-start">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-text-primary uppercase tracking-tight">{t('workshop.title')}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {t('workshop.active')}
            </span>
          </div>
          <p className="text-[10px] text-text-muted mt-0.5 font-bold uppercase tracking-widest">{t('workshop.subtitle')}</p>
        </div>
        <button
          onClick={() => dispatch(fetchAllCommandes())}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border/50 text-text-muted hover:bg-background transition-all active:scale-95 shadow-sm"
        >
          {loading?.commandes ? <Loader2 size={18} className="animate-spin text-primary-500" /> : <RefreshCw size={18} />}
        </button>
      </div>

      <div className="flex bg-background p-1 rounded-2xl w-full sm:w-fit border border-border/50">
        <button
          onClick={() => { setViewMode('active'); setActiveFilter(null); }}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            viewMode === 'active' ? 'bg-surface text-primary-600 shadow-sm border border-border/50' : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Inbox size={14} /> Production
        </button>
        <button
          onClick={() => { setViewMode('handover'); setActiveFilter(null); }}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            viewMode === 'handover' ? 'bg-surface text-primary-600 shadow-sm border border-border/50' : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <History size={14} /> Sorties
        </button>
      </div>

      {viewMode === 'active' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
          {stats.map(stat => {
            const cfg = STATUS_CONFIG[stat.key] || STATUS_CONFIG[COMMANDE_STATUS.EN_ATTENTE];
            const Icon = cfg.icon;
            const isActive = JSON.stringify(activeFilter) === JSON.stringify(stat.filterValue);
            return (
              <div
                key={stat.key}
                onClick={() => setActiveFilter(isActive ? null : stat.filterValue)}
                className={`bg-surface rounded-2xl shadow-card p-5 text-start border cursor-pointer hover:shadow-card-hover transition-all transform hover:-translate-y-0.5 ${
                  isActive ? 'border-2 border-primary-500 ring-4 ring-primary-500/10' : 'border-border/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl ${cfg.accentBg} ${cfg.accentText} dark:bg-opacity-10 flex items-center justify-center mb-4 shadow-sm`}>
                  <Icon size={24} />
                </div>
                <p className="text-3xl font-black text-text-primary leading-none">{stat.count}</p>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mt-1.5">{stat.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'active' && overdueCount > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm animate-in slide-in-from-top duration-300 text-start">
          <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-red-500 shadow-sm shrink-0">
             <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-tight">{t('workshop.overdue.title')}</p>
            <p className="text-[10px] text-red-600 dark:text-red-500/80 font-bold uppercase tracking-widest mt-0.5">
              {t('workshop.overdue.body', { count: overdueCount })}
            </p>
          </div>
        </div>
      )}

      <div className="relative group">
        <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary-500 transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par numéro de commande..."
          className="w-full bg-surface border border-border/50 rounded-2xl py-4 ps-12 pe-4 text-sm font-bold text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm group-hover:shadow-md"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 end-0 pe-4 flex items-center text-text-muted hover:text-red-500 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="lg:flex lg:gap-6">
        <div className="lg:flex-1">
          <div className="bg-surface rounded-3xl shadow-card border border-border/50 overflow-hidden">
            <div className="px-6 py-5 border-b border-border/50 text-start">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-black text-text-primary uppercase tracking-tight">
                    {viewMode === 'handover' ? 'Sorties' : (showAll ? t('workshop.table.all_orders') : t('workshop.table.today_orders'))}
                  </h2>
                  <span className="bg-background text-text-muted text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-border/50">
                    {filteredOrders.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(activeFilter || searchTerm) && (
                    <button
                      onClick={() => { setActiveFilter(null); setSearchTerm(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest bg-red-50 dark:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <X size={10} /> {t('workshop.table.clear_filter')}
                    </button>
                  )}
                  <button
                    onClick={() => { setShowAll(!showAll); setActiveFilter(null); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                      showAll ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 border-primary-200 dark:border-primary-500/20' : 'bg-surface text-text-secondary border-border hover:border-primary-300'
                    }`}
                  >
                    {showAll ? <><CalendarDays size={14} />{viewMode === 'handover' ? 'Sorties du jour' : t('workshop.table.view_today')}</> 
                             : <><LayoutList size={14} />{viewMode === 'handover' ? 'Historique complet' : t('workshop.table.view_all')}</>}
                  </button>
                </div>
              </div>
            </div>

            {loading?.commandes ? (
              <div className="p-6 space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-16 bg-background rounded-2xl animate-pulse" />)}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 px-6 text-center">
                <Sun className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
                <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                  {viewMode === 'active' ? t('workshop.table.no_orders_today') : 'Aucune sortie enregistrée'}
                </h3>
              </div>
            ) : (
              <>
                <div className="lg:hidden divide-y divide-border/40">
                  {filteredOrders.map(order => {
                    const isOverdue = viewMode === 'active' && isPastUnfinished(order);
                    return (
                      <div key={order.id} onClick={() => navigate(`/employe/commandes/${order.id}`)} className={`p-5 active:bg-background transition-colors flex flex-col gap-4 text-start ${isOverdue ? 'border-l-4 border-l-red-500 bg-red-50/20' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isOverdue ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-500'}`}>
                              <Package size={20} />
                            </div>
                            <p className="text-sm font-black text-text-primary tracking-tight">#{order.numeroCommande}</p>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                          <div className="flex items-center gap-4 text-text-muted">
                            <span className="flex items-center gap-1"><TableProperties size={12} />{order.commandeTapis?.length || 0} {t('admin.dashboard.carpets')}</span>
                            <span className="flex items-center gap-1"><CalendarDays size={12} />{new Date(order.dateCreation || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}</span>
                          </div>
                          <ChevronRight size={16} className="text-primary-500 rtl:rotate-180" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden lg:block w-full overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-background/50 border-b border-border/50">
                        <th className="px-6 py-4 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.table.headers.order')}</th>
                        <th className="px-6 py-4 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.table.headers.articles')}</th>
                        <th className="px-6 py-4 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.table.headers.status')}</th>
                        <th className="px-6 py-4 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.table.headers.date')}</th>
                        <th className="px-6 py-4 text-end text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.table.headers.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => {
                        const isOverdue = viewMode === 'active' && isPastUnfinished(order);
                        return (
                          <tr key={order.id} className={`border-b border-border/40 last:border-0 hover:bg-background/40 transition-colors group ${isOverdue ? 'border-l-4 border-l-red-400' : ''}`}>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 ${isOverdue ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-primary-50 dark:bg-primary-500/10 text-primary-500'}`}>
                                  <Package size={20} />
                                </div>
                                <p className="text-sm font-black text-text-primary tracking-tight">#{order.numeroCommande}</p>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-xs font-bold text-text-secondary uppercase tracking-tight text-start">{order.commandeTapis?.length || 0} {t('admin.dashboard.carpets')}</td>
                            <td className="px-6 py-5 text-start"><StatusBadge status={order.status} /></td>
                            <td className="px-6 py-5 text-xs font-bold text-text-primary text-start">
                               {new Date(order.dateCreation || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}
                               <span className="block text-[9px] text-text-muted mt-0.5 opacity-60">{new Date(order.dateCreation || order.createdAt).toLocaleTimeString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="px-6 py-5 text-end">
                              <button onClick={() => navigate(`/employe/commandes/${order.id}`)} className="inline-flex items-center gap-2 bg-primary-500 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg active:scale-95">
                                {viewMode === 'handover' ? 'Vérifier' : t('workshop.table.manage_btn')} <ChevronRight size={14} className="rtl:rotate-180" />
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

        <div className="hidden lg:block lg:w-80 shrink-0">
          <div className="bg-surface rounded-3xl shadow-card p-6 sticky top-6 border border-border/50 max-h-[calc(100vh-120px)] overflow-y-auto text-start">
            <h2 className="text-sm font-black text-text-primary mb-6 uppercase tracking-tight">{t('workshop.activity.title')}</h2>
            {commandes.length === 0 ? (
              <div className="py-12 flex flex-col items-center text-center"><RefreshCw size={24} className="text-text-muted/20 mb-3" /><p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('workshop.activity.no_activity')}</p></div>
            ) : (
              <div className="space-y-6">
                {[...commandes].sort((a,b) => new Date(b.dateCreation || b.createdAt) - new Date(a.dateCreation || a.createdAt)).slice(0, 15).map((order, idx) => {
                  const cfg = STATUS_CONFIG[order.status] || { label: order.status, icon: Package, accentBg: 'bg-background', accentText: 'text-text-secondary' };
                  const Icon = cfg.icon;
                  return (
                    <div key={order.id} className="relative ps-8">
                      {idx < 14 && idx < commandes.length - 1 && <div className="absolute start-[9px] top-6 bottom-[-24px] w-px bg-border/50" />}
                      <div className={`absolute start-0 top-0 w-[19px] h-[19px] rounded-full flex items-center justify-center border-2 border-surface shadow-sm ring-4 ring-background/50 ${cfg.accentBg} ${cfg.accentText}`}><Icon size={10} /></div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-text-primary truncate tracking-tight">#{order.numeroCommande}</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5 leading-relaxed">{t('workshop.activity.transition', { status: cfg.label })}</p>
                        </div>
                        <span className="text-[9px] font-black text-text-muted/60 uppercase tracking-widest shrink-0 mt-0.5">{new Date(order.dateCreation || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}</span>
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
