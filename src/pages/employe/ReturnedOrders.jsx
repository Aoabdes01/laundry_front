import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ChevronRight, CalendarDays, AlertCircle, PackageCheck, Package, LayoutList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchReturnedOrders } from '../../store/employe/employeThunk';
import { selectCommandes, selectLoading } from '../../store/employe/employeSelectors';
import { COMMANDE_STATUS } from '../../store/employe/employeSlice';
import { StatusBadge } from '../../components/StatusBadge';

export default function ReturnedOrders() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allCommandes = useSelector(selectCommandes);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    dispatch(fetchReturnedOrders());
  }, [dispatch]);

  const returnedOrders = useMemo(() =>
    allCommandes
      .filter(c => c.status === COMMANDE_STATUS.RETOURNEE)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
    [allCommandes]
  );

  if (loading.commandes && returnedOrders.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse border border-border/50" />)}
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-5 text-start">
        <div>
          <h1 className="text-lg font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
            {t('workshop.returns.title')}
            {returnedOrders.length > 0 && (
              <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-black px-2.5 py-0.5 rounded-full border border-red-500/20">{returnedOrders.length}</span>
            )}
          </h1>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">{t('workshop.returns.subtitle')}</p>
        </div>
        <button
          onClick={() => dispatch(fetchReturnedOrders())}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border/50 text-text-muted hover:bg-background transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw size={18} className={loading?.commandes ? 'animate-spin text-primary-500' : ''} />
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex gap-3 mb-5 text-start animate-in fade-in duration-500">
        <RefreshCw size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-400/90 font-medium">
          {t('workshop.returns.banner')}
        </p>
      </div>

      {returnedOrders.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-dashed border-border py-16 flex flex-col items-center text-center px-6 shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-4 border border-green-100 dark:border-green-500/20">
            <PackageCheck size={28} className="text-green-500" />
          </div>
          <h3 className="text-sm font-black text-text-primary uppercase tracking-tight mb-1">{t('workshop.returns.empty_title')}</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest max-w-xs mb-6">{t('workshop.returns.empty_body')}</p>
          <button onClick={() => navigate('/employe/dashboard')} className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 transition-all active:scale-95">
            {t('workshop.detail.back')}
          </button>
        </div>
      ) : (
        <>
          <div className="hidden lg:block rounded-3xl overflow-hidden bg-surface shadow-card border border-border/50">
            <table className="w-full">
              <thead>
                <tr className="bg-background/50 border-b border-border/50">
                  <th className="px-6 py-4 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.returns.table.headers.order')}</th>
                  <th className="px-6 py-4 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.returns.table.headers.details')}</th>
                  <th className="px-6 py-4 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.returns.table.headers.status')}</th>
                  <th className="px-6 py-4 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.returns.table.headers.updated')}</th>
                  <th className="px-6 py-4 text-end text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.returns.table.headers.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {returnedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-background/40 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3 text-start">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm border border-red-100 dark:border-red-500/20">
                          <AlertCircle size={20} />
                        </div>
                        <span className="text-sm font-black text-text-primary tracking-tight">#{order.numeroCommande}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-start">
                      <p className="text-xs font-bold text-text-secondary uppercase tracking-tight">{order.commandeTapis?.length || 0} {t('workshop.returns.table.articles')}</p>
                    </td>
                    <td className="px-6 py-5 text-start"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-5 text-start">
                      <span className="text-xs font-bold text-text-primary">{new Date(order.updatedAt || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </td>
                    <td className="px-6 py-5 text-end">
                      <button onClick={() => navigate(`/employe/commandes/${order.id}`)} className="inline-flex items-center gap-2 bg-primary-500 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg active:scale-95">
                        {t('workshop.returns.table.process_btn')} <ChevronRight size={14} className="rtl:rotate-180" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-4">
            {returnedOrders.map(order => (
              <div 
                key={order.id} 
                onClick={() => navigate(`/employe/commandes/${order.id}`)}
                className="bg-surface rounded-2xl shadow-card p-5 border border-border/40 active:bg-background transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                   <div className="flex flex-col text-start">
                      <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-0.5">{t('workshop.detail.labels.order')}</span>
                      <p className="text-lg font-black text-text-primary tracking-tight">#{order.numeroCommande}</p>
                   </div>
                   <StatusBadge status={order.status} />
                </div>
                <div className="bg-background rounded-2xl p-4 mb-4 border border-border/50 text-start">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                      <span>{order.commandeTapis?.length || 0} {t('workshop.returns.table.headers.details')}</span>
                   </div>
                   <div className="flex items-center gap-1.5 text-text-muted">
                      <CalendarDays size={12} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                         {new Date(order.updatedAt || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}
                      </span>
                   </div>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 active:bg-primary-600 transition-all"
                >
                  {t('workshop.returns.table.process_return_btn')} <ChevronRight size={14} className="rtl:rotate-180" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
