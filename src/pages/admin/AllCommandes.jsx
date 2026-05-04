import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Search, Loader2, Download,
  Filter, Calendar, X, RefreshCw, FileText,
  Clock, Users, Phone, Package, ChevronRight,
  MoreVertical, CheckCircle2, AlertCircle, LayoutGrid, List,
  Truck, User, MapPin, Calculator, Hash, CreditCard
} from 'lucide-react';
import { fetchAllCommandes, downloadCommandesCsv, fetchCommandeById } from '../../store/admin/adminThunk';
import { selectAllCommandes, selectAdminLoading, selectCommandesPagination } from '../../store/admin/adminSelectors';
import { clearSelectedCommande } from '../../store/admin/adminSlice';
import { StatusBadge } from '../../components/StatusBadge';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const formatDateTime = (dateStr, lng) => {
  if (!dateStr) return { date: 'N/A', time: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: 'N/A', time: '' };
  return {
    date: d.toLocaleDateString(lng === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: '2-digit',
      month: 'short'
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
  const pagination = useSelector(selectCommandesPagination);
  const { selectedCommande: drawerData } = useSelector(s => s.admin);

  // UI State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const loadData = useCallback((page = 0) => {
    const params = {
      search: search || undefined,
      status: status !== 'all' ? status : undefined,
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
      page,
      size: 20,
    };
    dispatch(fetchAllCommandes(params));
  }, [dispatch, search, status, dateDebut, dateFin]);

  // When filters change, always reset to page 0
  useEffect(() => {
    setCurrentPage(0);
    const timer = setTimeout(() => loadData(0), 500);
    return () => clearTimeout(timer);
  }, [search, status, dateDebut, dateFin, dispatch]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadData(nextPage);
  };

  const handleExportCSV = async () => {
    try {
      await dispatch(downloadCommandesCsv()).unwrap();
      toast.success(t('admin.orders.export_success'));
    } catch (err) {
      toast.error(t('admin.orders.export_error'));
    }
  };

  const openQuickView = (id) => {
    dispatch(fetchCommandeById(id));
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    dispatch(clearSelectedCommande());
  };

  const getClientDisplayName = (order) => {
    return order.client?.name || order.clientNom || 'Client #' + (order.client?.id || order.clientId || '?');
  };

  const getClientPhone = (client) => {
    if (!client) return 'N/A';
    if (client.phone) return client.phone;
    if (client.telephone) return client.telephone;
    if (Array.isArray(client.phones) && client.phones.length > 0) {
      return client.phones[0].phoneNumber || client.phones[0].phone || 'N/A';
    }
    return 'N/A';
  };

  const totalAmount = pagination?.totalValue ?? 0;
  const totalVolumes = pagination?.totalVolumes ?? 0;
  const totalElements = pagination?.totalElements ?? commandes?.length ?? 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-start">

      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[var(--text)] tracking-[-0.02em]">
            {t('admin.orders.title')}
          </h1>
          <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] mt-1">
            {t('admin.orders.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-[10px] bg-white border border-[rgba(0,0,0,0.08)] rounded-[10px] shadow-[var(--shadow-sm)] text-[13px] font-medium text-[var(--text-secondary)] active:scale-95 transition-all"
          >
            <Download size={16} className="text-[var(--primary)]" />
            {t('admin.orders.export_csv')}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-[10px] rounded-[10px] text-[13px] font-bold transition-all active:scale-95 ${
              showFilters 
                ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-teal)]' 
                : 'bg-white border border-[rgba(0,0,0,0.08)] text-[var(--text-secondary)] shadow-[var(--shadow-sm)]'
            }`}
          >
            <Filter size={16} />
            {t('admin.orders.advanced_filters')}
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: t('admin.orders.kpi.global'), value: totalElements, icon: ClipboardList, type: 'orders' },
          { label: t('admin.orders.kpi.value'), value: `${totalAmount.toLocaleString()}`, suffix: 'DH', icon: CheckCircle2, type: 'revenus' },
          { label: t('admin.orders.kpi.volumes'), value: totalVolumes, icon: Package, type: 'volumes' },
        ].map((kpi, i) => {
          const colors = {
            orders: { accent: '#0D7377', bg: 'rgba(13,115,119,0.1)' },
            revenus: { accent: '#C9A84C', bg: 'rgba(201,168,76,0.1)' },
            volumes: { accent: '#3B82F6', bg: 'rgba(59,130,246,0.1)' }
          }[kpi.type] || { accent: '#0D7377', bg: 'rgba(13,115,119,0.1)' };

          return (
            <div key={i} className="bg-white rounded-[16px] border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-sm)] p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: colors.accent }} />
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3" style={{ backgroundColor: colors.bg }}>
                <kpi.icon size={20} style={{ color: colors.accent }} />
              </div>
              <p className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] truncate">{kpi.label}</p>
              <p className="font-['Plus_Jakarta_Sans'] text-[20px] font-bold text-[var(--text)] tracking-tight truncate mt-1">
                {kpi.value} {kpi.suffix && <span className="text-[12px] font-bold text-[var(--text-muted)]">{kpi.suffix}</span>}
              </p>
            </div>
          );
        })}
      </div>

      {/* SEARCH & VIEW MODES */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={t('admin.orders.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] py-3 pl-11 pr-4 text-sm font-medium text-[var(--text)] outline-none focus:ring-4 focus:ring-[var(--primary-glow)] focus:border-[var(--primary)] focus:bg-white transition-all"
          />
        </div>
        <div className="flex bg-white border border-[rgba(0,0,0,0.08)] p-1 rounded-[12px] shadow-sm shrink-0">
          <button 
            onClick={() => setViewMode('list')} 
            className={`p-2 rounded-[10px] transition-all ${viewMode === 'list' ? 'bg-[var(--primary)] text-white shadow-[0_2px_8px_rgba(13,115,119,0.2)]' : 'text-[var(--text-muted)]'}`}
          >
            <List size={20}/>
          </button>
          <button 
            onClick={() => setViewMode('grid')} 
            className={`p-2 rounded-[10px] transition-all ${viewMode === 'grid' ? 'bg-[var(--primary)] text-white shadow-[0_2px_8px_rgba(13,115,119,0.2)]' : 'text-[var(--text-muted)]'}`}
          >
            <LayoutGrid size={20}/>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-[20px] border border-[rgba(0,0,0,0.06)] p-5 shadow-[var(--shadow-md)] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-1.5">
            <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block px-1">{t('admin.orders.filter_labels.status')}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[10px] px-3 py-2 text-[13px] font-bold text-[var(--text)] outline-none focus:border-[var(--primary)]">
              <option value="all">{t('admin.orders.status_options.all')}</option>
              {['EN_ATTENTE', 'VALIDEE', 'EN_TRAITEMENT', 'PRETE', 'LIVREE', 'PAYEE', 'ANNULEE', 'RETOURNEE'].map(s => <option key={s} value={s}>{t(`status.${s.toLowerCase()}`)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block px-1">{t('admin.orders.filter_labels.from')}</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[10px] px-3 py-2 text-[13px] font-bold text-[var(--text)] outline-none focus:border-[var(--primary)]" />
            </div>
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block px-1">{t('admin.orders.filter_labels.to')}</label>
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[10px] px-3 py-2 text-[13px] font-bold text-[var(--text)] outline-none focus:border-[var(--primary)]" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <button onClick={() => { setSearch(''); setStatus('all'); setDateDebut(''); setDateFin(''); }} className="w-full bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] border border-[#FECACA] rounded-[10px] py-2 text-[12px] font-bold uppercase tracking-wider transition-all">{t('admin.orders.filter_labels.reset')}</button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="bg-white rounded-[20px] border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-sm)] overflow-hidden">
        {loading && !commandes?.length ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-[var(--primary)]" />
            <p className="font-['Inter'] text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('admin.orders.loading_data')}</p>
          </div>
        ) : !commandes?.length ? (
          <div className="py-32 flex flex-col items-center text-center px-6">
            <div className="w-16 h-16 bg-[var(--bg)] rounded-[16px] flex items-center justify-center mb-6 border border-dashed border-[rgba(0,0,0,0.1)]"><ClipboardList size={32} className="text-[var(--text-muted)] opacity-30" /></div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)]">{t('admin.orders.empty_db')}</h3>
            <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] mt-1">{t('admin.orders.no_match')}</p>
          </div>
        ) : viewMode === 'list' ? (
          <>
          {/* MOBILE CARDS */}
          <div className="divide-y divide-[rgba(0,0,0,0.05)]">
            {commandes.map((c) => {
              const { date, time } = formatDateTime(c.dateCreation || c.createdAt, i18n.language);
              return (
                <div key={c.id} onClick={() => openQuickView(c.id)} className="p-5 flex flex-col gap-4 active:bg-[var(--bg)] transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--primary-surface)] text-[var(--primary)] flex items-center justify-center font-['Plus_Jakarta_Sans'] font-bold text-sm">
                        {(c.client?.name || c.clientNom || 'C')[0]}
                      </div>
                      <div>
                        <p className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[var(--text)] truncate leading-tight">
                          {getClientDisplayName(c)}
                        </p>
                        <p className="font-['Inter'] text-[12px] text-[var(--text-muted)] mt-0.5">
                          #{c.numeroCommande} • {date}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <Package size={14} className="text-[var(--primary)]" />
                      <span className="font-['Inter'] text-[12px] font-semibold">{c.commandeTapis?.length || 0} Art.</span>
                    </div>
                    <span className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)]">{c.montantTotal} <span className="text-[11px] text-[var(--text-muted)]">DH</span></span>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commandes.map((c) => {
              const { date } = formatDateTime(c.dateCreation || c.createdAt, i18n.language);
              return (
                <div key={c.id} className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 hover:border-[var(--primary)] transition-all cursor-pointer relative" onClick={() => openQuickView(c.id)}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">#{c.numeroCommande}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="space-y-1 mb-6">
                    <p className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)] truncate">{getClientDisplayName(c)}</p>
                    <p className="font-['Inter'] text-[12px] text-[var(--text-muted)] uppercase tracking-wider">{date}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]"><Package size={14} /><span className="font-['Inter'] text-[12px] font-bold">{c.commandeTapis?.length || 0}</span></div>
                    <p className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--primary)]">{c.montantTotal} DH</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LOAD MORE */}
      {!pagination?.isLast && (
        <div className="flex justify-center pt-2 pb-10">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] text-[13px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 size={16} className="animate-spin text-[var(--primary)]" /> : <RefreshCw size={16} className="text-[var(--primary)]" />}
            {loading ? t('admin.orders.loading_data') : t('admin.orders.load_more', 'Charger plus')}
          </button>
        </div>
      )}
      {/* QUICK VIEW DRAWER (Modern Sidebar) */}
      {isDrawerOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500" 
            onClick={closeDrawer} 
          />
          
          {/* Drawer Content */}
          <div 
            className={`relative w-full sm:max-w-md bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500 ease-out`}
          >
            <div className="p-6 border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between bg-[var(--bg)] pt-[calc(env(safe-area-inset-top)+1.5rem)]">
              <div className="text-start">
                <div className="flex items-center gap-2 mb-1">
                  <Hash size={14} className="text-[var(--primary)]" />
                  <span className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('admin.pro_ui.quick_details')}</span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[20px] font-bold text-[var(--text)]">#{drawerData?.numeroCommande}</h3>
              </div>
              <button onClick={closeDrawer} className="w-10 h-10 rounded-[10px] bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#EF4444] transition-all shadow-sm"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] space-y-6">
              {!drawerData ? (
                <div className="py-20 flex flex-col items-center gap-4 opacity-40">
                  <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
                  <p className="font-['Inter'] text-[12px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{t('admin.orders.loading_data')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status & Summary */}
                  <div className="flex items-center justify-between bg-[var(--bg)] p-5 rounded-[16px] border border-[rgba(0,0,0,0.06)]">
                    <StatusBadge status={drawerData.status} />
                    <div className="text-end">
                      <p className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">{t('admin.orders.card.billing')}</p>
                      <p className="font-['Plus_Jakarta_Sans'] text-[22px] font-bold text-[var(--primary)]">{drawerData.montantTotal} DH</p>
                    </div>
                  </div>

                  {/* Client & Driver Info */}
                  <div className="grid grid-cols-1 gap-4 text-start">
                    <div className="p-4 bg-white rounded-[16px] border border-[rgba(0,0,0,0.08)] flex items-center gap-4 shadow-sm">
                      <div className="w-10 h-10 rounded-[10px] bg-[rgba(16,185,129,0.1)] text-[#10B981] flex items-center justify-center shrink-0"><User size={20}/></div>
                      <div className="min-w-0">
                        <p className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">{t('admin.orders.table.client')}</p>
                        <p className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[var(--text)] truncate">{getClientDisplayName(drawerData)}</p>
                        <p className="font-['Inter'] text-[12px] text-[var(--text-secondary)]">{getClientPhone(drawerData.client)}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-[16px] border border-[rgba(0,0,0,0.08)] flex items-center gap-4 shadow-sm">
                      <div className="w-10 h-10 rounded-[10px] bg-[var(--primary-surface)] text-[var(--primary)] flex items-center justify-center shrink-0"><Truck size={20}/></div>
                      <div className="min-w-0">
                        <p className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">{t('admin.orders.details.labels.driver')}</p>
                        <p className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[var(--text)] truncate">{drawerData.livreur?.name || t('admin.orders.details.labels.not_assigned')}</p>
                        <p className="font-['Inter'] text-[12px] text-[var(--text-secondary)]">{drawerData.livreur?.phone || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Carpet Items Mini List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('admin.orders.details.articles', { count: drawerData.commandeTapis?.length || 0 })}</h4>
                      <Calculator size={14} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="space-y-3">
                      {drawerData.commandeTapis?.map((item, i) => (
                        <div key={i} className="p-4 bg-[var(--bg)] border border-[rgba(0,0,0,0.04)] rounded-[14px] flex items-center justify-between hover:border-[var(--primary)] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[var(--primary)] border border-[rgba(0,0,0,0.06)] text-[11px] font-bold">{i+1}</div>
                            <div className="text-start">
                              <p className="font-['Inter'] text-[13px] font-bold text-[var(--text)]">{item.tapis?.nom || t('admin.dashboard.carpets')}</p>
                              <p className="font-['Inter'] text-[11px] font-medium text-[var(--text-muted)] uppercase">{item.largeur}m × {item.longueur || item.hauteur}m</p>
                            </div>
                          </div>
                          <p className="font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-[var(--text)]">{item.prixFinal} DH</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/admin/commandes/${drawerData.id}`)}
                    className="w-full bg-[var(--primary)] text-white py-4 rounded-[12px] text-[14px] font-bold uppercase tracking-wider shadow-[var(--shadow-teal)] hover:bg-[var(--primary-dark)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {t('admin.pro_ui.see_full_sheet')} <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
