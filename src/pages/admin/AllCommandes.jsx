import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { selectAllCommandes, selectAdminLoading } from '../../store/admin/adminSelectors';
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
  const { selectedCommande: drawerData } = useSelector(s => s.admin);

  // UI State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    const timer = setTimeout(() => loadData(), 500);
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

  const totalAmount = Array.isArray(commandes) ? commandes.reduce((acc, c) => acc + (c.montantTotal || 0), 0) : 0;
  const urgentCount = Array.isArray(commandes) ? commandes.filter(c => ['en_attente', 'retournee'].includes(c.status?.toLowerCase())).length : 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-start relative overflow-hidden">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">Gestion des Commandes</h1>
          <p className="text-sm text-text-muted font-bold uppercase tracking-widest opacity-60">Suivi et administration du flux de production</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-surface border border-border/50 text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-background transition-all active:scale-95"
          >
            <Download size={16} />
            Exporter CSV
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showFilters ? 'bg-primary-500 text-white shadow-lg' : 'bg-surface border border-border/50 text-text-primary'}`}
          >
            <Filter size={16} />
            Filtres
          </button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Commandes', value: commandes?.length || 0, icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Valeur Totale', value: `${totalAmount.toLocaleString()} DH`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Actions Urgentes', value: urgentCount, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Volume Articles', value: commandes?.reduce((acc, c) => acc + (c.commandeTapis?.length || 0), 0) || 0, icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        ].map((kpi, i) => (
          <div key={i} className="bg-surface p-4 rounded-2xl border border-border/50 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center shrink-0`}>
              <kpi.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider truncate">{kpi.label}</p>
              <p className="text-lg font-black text-text-primary tracking-tight truncate">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher par numéro, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border/50 rounded-2xl ps-12 pe-4 py-3.5 text-sm font-bold text-text-primary focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all outline-none"
          />
        </div>
        <div className="flex bg-background p-1 rounded-2xl border border-border/50 shrink-0">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-surface text-primary-600 shadow-sm border border-border/50' : 'text-text-muted'}`}><List size={20}/></button>
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-surface text-primary-600 shadow-sm border border-border/50' : 'text-text-muted'}`}><LayoutGrid size={20}/></button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-surface rounded-[2rem] border border-border/50 p-6 md:p-8 shadow-card grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block">Statut</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-primary-500">
              <option value="all">Tous les statuts</option>
              {['EN_ATTENTE', 'VALIDEE', 'EN_TRAITEMENT', 'PRETE', 'LIVREE', 'PAYEE', 'ANNULEE', 'RETOURNEE'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block">Du</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-primary-500" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block">Au</label>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-primary-500" />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setSearch(''); setStatus('all'); setDateDebut(''); setDateFin(''); }} className="w-full bg-background hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 border border-border rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all">Réinitialiser</button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="bg-surface rounded-[2rem] border border-border/50 shadow-card overflow-hidden">
        {loading && !commandes?.length ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-primary-500" />
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Chargement des commandes...</p>
          </div>
        ) : !commandes?.length ? (
          <div className="py-32 flex flex-col items-center text-center px-6">
            <div className="w-20 h-20 bg-background rounded-[2rem] flex items-center justify-center mb-6 border border-dashed border-border"><ClipboardList size={32} className="text-text-muted/30" /></div>
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Aucune commande</h3>
            <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">Essayez d'ajuster vos critères de recherche</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-border/50">
                  <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Référence</th>
                  <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Client</th>
                  <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Montant</th>
                  <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">Statut</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {commandes.map((c) => {
                  const { date, time } = formatDateTime(c.dateCreation || c.createdAt, i18n.language);
                  return (
                    <tr key={c.id} onClick={() => openQuickView(c.id)} className="group hover:bg-background/40 transition-all cursor-pointer">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-primary-500 font-black text-[10px]">#{c.numeroCommande.slice(-3)}</div>
                          <span className="text-sm font-black text-text-primary tracking-tight">#{c.numeroCommande}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-text-primary">{getClientDisplayName(c)}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">{getClientPhone(c.client)}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-text-primary">{date}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5 opacity-60">{time}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="font-black text-sm text-text-primary">{c.montantTotal} DH</span>
                      </td>
                      <td className="px-8 py-5 text-center"><div className="flex justify-center scale-90 group-hover:scale-100 transition-transform"><StatusBadge status={c.status} /></div></td>
                      <td className="px-8 py-5 text-end"><button onClick={(e) => { e.stopPropagation(); navigate(`/admin/commandes/${c.id}`); }} className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-text-muted hover:text-primary-500 transition-all border border-border/50 shadow-sm active:scale-90"><ChevronRight size={18} className="rtl:rotate-180" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {commandes.map((c) => {
              const { date } = formatDateTime(c.dateCreation || c.createdAt, i18n.language);
              return (
                <div key={c.id} className="bg-background/50 border border-border/50 rounded-[2rem] p-6 hover:bg-background hover:shadow-xl transition-all cursor-pointer group relative" onClick={() => openQuickView(c.id)}>
                  <div className="flex justify-end mb-4"><StatusBadge status={c.status} size="sm" /></div>
                  <div className="space-y-1 mb-6 text-center">
                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">#{c.numeroCommande}</p>
                    <p className="text-base font-black text-text-primary truncate">{getClientDisplayName(c)}</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{date}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-text-muted"><Package size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">{c.commandeTapis?.length || 0} Tapis</span></div>
                    <p className="text-sm font-black text-text-primary">{c.montantTotal} DH</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK VIEW DRAWER */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-[100] transition-all duration-500 ${isDrawerOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
        style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={closeDrawer} 
        />
        
        {/* Drawer Content */}
        <div 
          className={`absolute inset-y-0 end-0 w-full max-w-md bg-surface shadow-2xl z-[110] transition-transform duration-500 ease-out flex flex-col border-s border-border/50 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-6 md:p-8 border-b border-border/50 flex items-center justify-between bg-background/30">
            <div className="text-start">
              <div className="flex items-center gap-2 mb-1">
                <Hash size={14} className="text-primary-500" />
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Détails Rapides</span>
              </div>
              <h3 className="text-xl font-black text-text-primary tracking-tight">#{drawerData?.numeroCommande}</h3>
            </div>
            <button onClick={closeDrawer} className="w-10 h-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center text-text-muted hover:text-red-500 transition-all shadow-sm"><X size={20}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pb-32 md:p-8 space-y-8">
            {!drawerData ? (
              <div className="py-20 flex flex-col items-center gap-4 opacity-40">
                <Loader2 size={32} className="animate-spin text-primary-500" />
                <p className="text-[10px] font-black uppercase tracking-widest">Récupération des données...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Status & Summary */}
                <div className="flex items-center justify-between bg-background p-4 rounded-3xl border border-border/50">
                  <StatusBadge status={drawerData.status} />
                  <div className="text-end">
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-0.5">Total Commande</p>
                    <p className="text-lg font-black text-primary-600">{drawerData.montantTotal} DH</p>
                  </div>
                </div>

                {/* Client & Driver Info */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 bg-background rounded-[2rem] border border-border/50 flex items-start gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0 border border-teal-500/20"><User size={20}/></div>
                    <div className="min-w-0 text-start">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Client</p>
                      <p className="text-sm font-black text-text-primary truncate">{getClientDisplayName(drawerData)}</p>
                      <p className="text-xs font-bold text-text-muted mt-0.5">{getClientPhone(drawerData.client)}</p>
                    </div>
                  </div>
                  <div className="p-5 bg-background rounded-[2rem] border border-border/50 flex items-start gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-500/20"><Truck size={20}/></div>
                    <div className="min-w-0 text-start">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Livreur Responsable</p>
                      <p className="text-sm font-black text-text-primary truncate">{drawerData.livreur?.name || 'Non assigné'}</p>
                      <p className="text-xs font-bold text-text-muted mt-0.5">{drawerData.livreur?.phone || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Carpet Items Mini List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Articles ({drawerData.commandeTapis?.length || 0})</h4>
                    <Calculator size={14} className="text-text-muted" />
                  </div>
                  <div className="space-y-3">
                    {drawerData.commandeTapis?.map((item, i) => (
                      <div key={i} className="p-4 bg-background border border-border/50 rounded-2xl flex items-center justify-between hover:border-primary-200 transition-colors shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-primary-500 border border-border/50 text-[10px] font-black">{i+1}</div>
                          <div className="text-start">
                            <p className="text-xs font-black text-text-primary">{item.tapis?.nom || 'Article'}</p>
                            <p className="text-[9px] font-bold text-text-muted uppercase">{item.largeur}m × {item.longueur || item.hauteur}m</p>
                          </div>
                        </div>
                        <p className="text-xs font-black text-text-primary">{item.prixFinal} DH</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/admin/commandes/${drawerData.id}`)}
                  className="w-full bg-primary-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Voir la fiche complète <ChevronRight size={14} className="rtl:rotate-180" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
