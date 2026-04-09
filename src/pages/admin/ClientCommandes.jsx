import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ChevronRight, ClipboardList, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchAllClients, fetchClientCommandes } from '../../store/admin/adminThunk';
import { clearClientCommandes } from '../../store/admin/adminSlice';
import { StatusBadge } from '../../components/StatusBadge';

export default function ClientCommandes() {
  const { t } = useTranslation();
  const { clientId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { clientCommandes, clients, loading } = useSelector(s => s.admin);

  useEffect(() => {
    dispatch(fetchClientCommandes(clientId));
    if (clients.length === 0) dispatch(fetchAllClients());
    return () => { dispatch(clearClientCommandes()); };
  }, [clientId, dispatch]);

  const client = clients.find(c => String(c.id) === String(clientId));

  if (loading && !clientCommandes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-start">
        <Loader2 size={32} className="animate-spin text-primary-600 mb-3" />
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8 space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/admin/clients')} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary text-start">
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {t('admin.clients.history.back')}
      </button>

      {/* Client Header Card */}
      <div className="bg-primary-600 rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {client?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="text-start">
          <h2 className="text-xl font-bold">{client?.name || `Client #${clientId}`}</h2>
          <p className="text-primary-200 text-sm">{t('admin.clients.history.count', { count: clientCommandes.length })}</p>
        </div>
      </div>

      {/* Commandes */}
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 text-start">
        <ClipboardList size={16} className="text-primary-600" />
        {t('admin.clients.history.title')}
      </h3>

      {clientCommandes.length === 0 ? (
        <div className="bg-surface rounded-2xl shadow-card py-16 flex flex-col items-center text-center">
          <ClipboardList size={36} className="text-text-muted mb-3" />
          <h3 className="font-semibold text-text-primary mb-1">{t('admin.clients.history.empty_title')}</h3>
          <p className="text-sm text-text-muted">{t('admin.clients.history.empty_body')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clientCommandes.map(c => (
            <button key={c.id} onClick={() => navigate(`/admin/commandes/${c.id}`)}
              className="w-full bg-surface rounded-3xl shadow-card p-5 flex items-center gap-4 text-start hover:shadow-xl hover:-translate-y-1 transition-all group border border-border/50">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary-500 border border-border/50 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                 <ClipboardList size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-text-muted mb-1 uppercase tracking-widest px-0.5">#{c.numeroCommande}</p>
                <div className="flex items-center gap-2">
                   <StatusBadge status={c.status} size="sm" />
                </div>
              </div>
              {c.montantTotal != null && (
                <div className="text-end flex-shrink-0 bg-gray-50 px-3 py-2 rounded-xl group-hover:bg-primary-50 transition-colors">
                  <p className="text-sm font-black text-text-primary tracking-tight">{c.montantTotal} <span className="text-[10px] text-text-muted font-bold">{t('admin.orders.kpi.unit_dh')}</span></p>
                </div>
              )}
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-text-muted group-hover:bg-primary-200 group-hover:text-primary-700 transition-all shrink-0">
                 <ChevronRight size={16} strokeWidth={3} className="rtl:rotate-180" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

