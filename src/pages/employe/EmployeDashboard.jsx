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
    <div className="space-y-6 pb-16 animate-fade-in text-start">

      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[var(--text)] tracking-[-0.02em]">
            {t('workshop.title')}
          </h1>
          <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] mt-1">
            {t('workshop.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 bg-white p-1 rounded-[12px] border border-[rgba(0,0,0,0.08)] shadow-[var(--shadow-sm)] flex">
            <button
              onClick={() => { setViewMode('active'); setActiveFilter(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[10px] text-[12px] font-bold uppercase transition-all duration-200 ${
                viewMode === 'active' 
                  ? 'bg-[var(--primary)] text-white shadow-[0_2px_8px_rgba(13,115,119,0.3)]' 
                  : 'text-[var(--text-muted)] font-medium'
              }`}
            >
              <Inbox size={14} /> {t('admin.nav.production', 'Production')}
            </button>
            <button
              onClick={() => { setViewMode('handover'); setActiveFilter(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[10px] text-[12px] font-bold uppercase transition-all duration-200 ${
                viewMode === 'handover' 
                  ? 'bg-[var(--primary)] text-white shadow-[0_2px_8px_rgba(13,115,119,0.3)]' 
                  : 'text-[var(--text-muted)] font-medium'
              }`}
            >
              <History size={14} /> {t('admin.nav.sorties', 'Sorties')}
            </button>
          </div>

          <button
            onClick={() => dispatch(fetchAllCommandes())}
            className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-white border border-[rgba(0,0,0,0.08)] text-[var(--text-secondary)] shadow-sm active:scale-95 transition-all shrink-0"
          >
            {loading?.commandes ? <Loader2 size={18} className="animate-spin text-[var(--primary)]" /> : <RefreshCw size={18} className="text-[var(--primary)]" />}
          </button>
        </div>
      </div>

      {/* KPI STATS */}
      {viewMode === 'active' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map(stat => {
            const cfg = STATUS_CONFIG[stat.key] || STATUS_CONFIG[COMMANDE_STATUS.EN_ATTENTE];
            const Icon = cfg.icon;
            const isActive = JSON.stringify(activeFilter) === JSON.stringify(stat.filterValue);
            
            const getAccentColor = () => {
              switch (stat.filterValue) {
                case 'en_attente': return '#F59E0B';
                case 'en_traitement': return '#3B82F6';
                case 'prete': return '#10B981';
                default: return '#0D7377';
              }
            };

            const getBgColor = () => {
              switch (stat.filterValue) {
                case 'en_attente': return 'rgba(245,158,11,0.1)';
                case 'en_traitement': return 'rgba(59,130,246,0.1)';
                case 'prete': return 'rgba(16,185,129,0.1)';
                default: return 'rgba(13,115,119,0.1)';
              }
            };

            return (
              <div
                key={stat.key}
                onClick={() => setActiveFilter(isActive ? null : stat.filterValue)}
                className={`bg-white rounded-[16px] border shadow-[var(--shadow-sm)] p-4 relative overflow-hidden text-start transition-all cursor-pointer ${
                  isActive ? 'border-[var(--primary)] ring-4 ring-[var(--primary-glow)] scale-[1.02]' : 'border-[rgba(0,0,0,0.06)]'
                }`}
              >
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: getAccentColor() }} />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: getBgColor() }}>
                    <Icon size={20} style={{ color: getAccentColor() }} />
                  </div>
                  <span className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[var(--text)] tracking-tight">{stat.count}</span>
                </div>
                <p className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] leading-tight">
                  {stat.label.replace(' (', '\n(')}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* OVERDUE ALERT */}
      {viewMode === 'active' && overdueCount > 0 && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[16px] p-5 flex items-center gap-4 text-start group">
          <div className="w-12 h-12 bg-white rounded-[12px] flex items-center justify-center text-[#EF4444] shadow-sm shrink-0 border border-[#FECACA]">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#EF4444] uppercase tracking-tight leading-tight">{t('workshop.overdue.title')}</p>
            <p className="font-['Inter'] text-[12px] text-[#EF4444] font-semibold uppercase tracking-wider mt-0.5">
              {t('workshop.overdue.body', { count: overdueCount })}
            </p>
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col gap-3">
        <div className="relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('common.search_placeholder')}
            className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] py-3.5 pl-11 pr-4 text-sm font-medium text-[var(--text)] outline-none focus:ring-4 focus:ring-[var(--primary-glow)] focus:border-[var(--primary)] focus:bg-white transition-all"
          />
        </div>

        <div className="flex gap-2">
          {(activeFilter || searchTerm) && (
            <button
              onClick={() => { setActiveFilter(null); setSearchTerm(''); }}
              className="flex-1 py-3 px-4 rounded-[12px] bg-[#FEF2F2] text-[#EF4444] text-[12px] font-bold uppercase border border-[#FECACA] flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <X size={14} /> {t('workshop.table.clear_filter')}
            </button>
          )}
          <button
            onClick={() => { setShowAll(!showAll); setActiveFilter(null); }}
            className={`flex-1 py-3 px-4 rounded-[12px] text-[12px] font-bold uppercase transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
              showAll 
                ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-teal)]' 
                : 'bg-white border border-[rgba(0,0,0,0.08)] text-[var(--text-secondary)] shadow-sm'
            }`}
          >
            {showAll ? <CalendarDays size={14} /> : <LayoutList size={14} />}
            {showAll 
              ? (viewMode === 'handover' ? "AUJOURD'HUI" : t('workshop.table.view_today'))
              : (viewMode === 'handover' ? "HISTORIQUE" : t('workshop.table.view_all'))}
          </button>
        </div>
      </div>

      {/* ORDERS LIST CONTAINER */}
      <div className="bg-white rounded-[20px] border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-sm)] overflow-hidden">
        {loading?.commandes && filteredOrders.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-4">
             <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
             <p className="font-['Inter'] text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('common.loading')}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-24 px-6 text-center opacity-40">
            <div className="w-16 h-16 bg-[var(--bg)] rounded-[16px] flex items-center justify-center mx-auto mb-6 border border-dashed border-[rgba(0,0,0,0.1)]">
              <Sun className="text-[var(--text-muted)]" size={32} />
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)]">
              {viewMode === 'active' ? t('workshop.table.no_orders_today') : t('workshop.pro_ui.empty_registry', 'Aucune sortie enregistrée')}
            </h3>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(0,0,0,0.05)]">
            {filteredOrders.map(order => {
              const isOverdue = viewMode === 'active' && isPastUnfinished(order);
              return (
                <div key={order.id} onClick={() => navigate(`/employe/commandes/${order.id}`)} className="p-5 flex flex-col gap-4 active:bg-[var(--bg)] transition-colors text-start relative group cursor-pointer">
                  {isOverdue && <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#EF4444]" />}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0 border ${
                        isOverdue 
                          ? 'bg-[#FEF2F2] text-[#EF4444] border-[#FECACA]' 
                          : 'bg-[var(--primary-surface)] text-[var(--primary)] border-[rgba(13,115,119,0.1)]'
                      }`}>
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)] tracking-tight">
                          #{order.numeroCommande}
                        </p>
                        <p className="font-['Inter'] text-[12px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-0.5">
                          {new Date(order.dateCreation || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      <div className="text-start">
                        <p className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('workshop.table.headers.articles')}</p>
                        <p className="font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-[var(--text)]">{order.commandeTapis?.length || 0} Unités</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-[10px] bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:border-[var(--primary)] transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
