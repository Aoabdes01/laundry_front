import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, ChevronRight, ClipboardList, 
  DollarSign, User, Phone, Calendar, Package, 
  TrendingUp, Clock, Hash, Mail, MapPin
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchAllClients, fetchClientCommandes } from '../../store/admin/adminThunk';
import { clearClientCommandes } from '../../store/admin/adminSlice';
import { StatusBadge } from '../../components/StatusBadge';

const formatDateTime = (dateStr, lng) => {
  if (!dateStr) return { date: '—', time: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: '—', time: '' };
  return {
    date: d.toLocaleDateString(lng === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString(lng === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })
  };
};

export default function ClientCommandes() {
  const { t, i18n } = useTranslation();
  const { clientId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { clientCommandes, clients, loading } = useSelector(s => s.admin);

  useEffect(() => {
    dispatch(fetchClientCommandes(clientId));
    if (clients.length === 0) dispatch(fetchAllClients());
    return () => { dispatch(clearClientCommandes()); };
  }, [clientId, dispatch]);

  const client = useMemo(() => clients.find(c => String(c.id) === String(clientId)), [clients, clientId]);

  const getClientPhone = (c) => {
    if (!c) return '—';
    if (c.phone) return c.phone;
    if (c.telephone) return c.telephone;
    if (Array.isArray(c.phones) && c.phones.length > 0) {
      return c.phones[0].phoneNumber || c.phones[0].phone || '—';
    }
    return '—';
  };

  const stats = useMemo(() => {
    const total = clientCommandes.reduce((acc, c) => acc + (c.montantTotal || 0), 0);
    const lastOrder = clientCommandes.length > 0 ? [...clientCommandes].sort((a,b) => new Date(b.dateCreation) - new Date(a.dateCreation))[0] : null;
    return { total, lastOrder };
  }, [clientCommandes]);

  if (loading && !clientCommandes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 opacity-40">
        <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.2em]">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-8 animate-fade-in text-start px-4 md:px-0">
      
      {/* HEADER NAVIGATION */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/admin/clients')} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border/50 rounded-xl text-xs font-black uppercase tracking-widest text-text-muted hover:text-text-primary transition-all active:scale-95 shadow-sm">
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {t('common.back')}
        </button>
        <div className="flex items-center gap-2">
           <Hash size={14} className="text-primary-500" />
           <span className="text-xs font-black text-text-muted uppercase tracking-widest">{t('admin.pro_ui.order_log')}</span>
        </div>
      </div>

      {/* CLIENT PROFILE CARD */}
      <div className="bg-surface rounded-[2rem] border border-border/50 shadow-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
           <User size={120} className="text-primary-500" />
        </div>
        
        <div className="relative shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-primary-500 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-primary-500/20 border-4 border-surface ring-1 ring-primary-500/20 uppercase">
            {client?.name?.[0] || client?.nom?.[0] || '?'}
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-emerald-500 border-4 border-surface text-white flex items-center justify-center shadow-lg">
             <TrendingUp size={14} strokeWidth={3} />
          </div>
        </div>

        <div className="flex-1 text-center md:text-start min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
            <h2 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">{client?.name || client?.nom || `Client #${clientId}`}</h2>
            <div className="inline-flex self-center md:self-auto items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full text-xs font-black uppercase tracking-widest border border-primary-500/10">
               Client Particulier
            </div>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-y-2 gap-x-6 text-text-muted">
            <div className="flex items-center gap-2 text-xs font-bold"><Phone size={14} className="text-primary-500"/> {getClientPhone(client)}</div>
            {client?.email && <div className="flex items-center gap-2 text-xs font-bold"><Mail size={14} className="text-primary-500"/> {client.email}</div>}
            <div className="flex items-center gap-2 text-xs font-bold"><Calendar size={14} className="text-primary-500"/> Membre depuis {new Date(client?.createdAt).getFullYear() || '—'}</div>
          </div>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Commandes', value: clientCommandes.length, icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Investissement', value: `${stats.total.toLocaleString()} DH`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Panier Moyen', value: `${clientCommandes.length > 0 ? Math.round(stats.total / clientCommandes.length).toLocaleString() : 0} DH`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Dernière Activité', value: stats.lastOrder ? formatDateTime(stats.lastOrder.dateCreation, i18n.language).date : '—', icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        ].map((kpi, i) => (
          <div key={i} className="bg-surface p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-3 transition-all hover:shadow-md">
            <div className={`w-8 h-8 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
              <kpi.icon size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-0.5">{kpi.label}</p>
              <p className="text-base font-black text-text-primary tracking-tight">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ORDER HISTORY LIST */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-3">
            <Package size={18} className="text-primary-500" />
            {t('admin.pro_ui.order_log')}
          </h3>
        </div>

        {clientCommandes.length === 0 ? (
          <div className="bg-surface rounded-[2rem] border border-border/50 border-dashed py-24 flex flex-col items-center text-center opacity-40">
            <ClipboardList size={48} className="mb-4 text-text-muted" />
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">{t('admin.clients.history.empty_title')}</h3>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">{t('admin.clients.history.empty_body')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {clientCommandes.map(c => {
              const { date, time } = formatDateTime(c.dateCreation, i18n.language);
              return (
                <button 
                  key={c.id} 
                  onClick={() => navigate(`/admin/commandes/${c.id}`)}
                  className="w-full bg-surface rounded-3xl shadow-card p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6 text-start hover:shadow-xl hover:-translate-y-0.5 transition-all group border border-border/50 relative overflow-hidden"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-background border border-border/50 flex items-center justify-center text-primary-500 font-black text-xs shadow-sm group-hover:bg-primary-600 group-hover:text-white transition-colors">
                       #{c.numeroCommande.slice(-3)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-text-muted mb-1 uppercase tracking-widest">Référence #{c.numeroCommande}</p>
                      <div className="flex items-center gap-3">
                         <StatusBadge status={c.status} size="sm" />
                         <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
                         <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-text-muted uppercase">
                            <Calendar size={12}/> {date}
                            <Clock size={12} className="ms-2"/> {time}
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-border/40 pt-4 md:pt-0">
                    <div className="flex items-center gap-8">
                      <div className="text-center md:text-end">
                        <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-0.5">{t('admin.orders.kpi.articles')}</p>
                        <p className="text-xs font-black text-text-primary">{c.commandeTapis?.length || 0} {t('admin.orders.kpi.articles')}</p>
                      </div>
                      <div className="text-center md:text-end">
                        <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-0.5">{t('admin.orders.table.billing')}</p>
                        <p className="text-sm font-black text-primary-600 tracking-tight">{c.montantTotal?.toLocaleString()} DH</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-text-muted group-hover:bg-primary-50 group-hover:text-primary-600 transition-all border border-border/50 shadow-sm">
                       <ChevronRight size={18} strokeWidth={3} className="rtl:rotate-180" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SUMMARY FOOTER */}
      {clientCommandes.length > 0 && (
        <div className="bg-surface rounded-[2rem] border border-border/50 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm text-center md:text-start opacity-80">
           <div className="space-y-1">
              <h4 className="text-sm font-black text-text-primary uppercase tracking-widest">{t('admin.pro_ui.commercial_synthesis')}</h4>
              <p className="text-xs text-text-muted font-bold uppercase tracking-[0.2em]">Volume Total: {clientCommandes.reduce((acc, c) => acc + (c.commandeTapis?.length || 0), 0)} {t('admin.orders.kpi.articles')}</p>
           </div>
           <div className="flex items-center gap-3 text-emerald-600">
              <TrendingUp size={18} />
              <span className="text-xs font-black uppercase tracking-[0.2em]">{t('admin.pro_ui.active_loyal')}</span>
           </div>
        </div>
      )}
    </div>
  );
}

