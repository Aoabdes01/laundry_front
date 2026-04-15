import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ChevronRight, CalendarDays, AlertCircle, PackageCheck, Package, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchReturnedOrders } from '../../store/employe/employeThunk';
// import { selectReturnedOrders, selectLoading } from '../../store/employe/employeSelectors';
import { StatusBadge } from '../../components/StatusBadge';

export default function ReturnedOrders() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const returnedOrders = useSelector(selectReturnedOrders);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    dispatch(fetchReturnedOrders());
  }, [dispatch]);

  return (
    <div className="pb-16 max-w-5xl mx-auto px-4 md:px-0 animate-fade-in text-start">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary uppercase tracking-tight flex items-center gap-3">
            {t('workshop.returns.title')}
            {returnedOrders.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-red-500/20">{returnedOrders.length}</span>
            )}
          </h1>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1 opacity-60">{t('workshop.returns.subtitle')}</p>
        </div>
        <button
          onClick={() => dispatch(fetchReturnedOrders())}
          className="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-surface border border-border/50 text-text-muted hover:text-primary-500 hover:bg-background transition-all active:scale-95 shadow-sm shrink-0"
        >
          <RefreshCw size={20} className={loading?.commandes ? 'animate-spin text-primary-500' : ''} strokeWidth={2.5} />
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[2rem] p-6 md:p-8 flex items-start gap-4 mb-8 text-start animate-in slide-in-from-top-4 duration-500 shadow-sm">
        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0 border border-amber-500/20 shadow-sm">
          <AlertCircle size={24} strokeWidth={2.5} />
        </div>
        <p className="text-sm font-black text-amber-800 dark:text-amber-400/90 leading-relaxed uppercase tracking-tight">
          {t('workshop.returns.banner')}
        </p>
      </div>

      {returnedOrders.length === 0 ? (
        <div className="bg-surface rounded-[2rem] border border-dashed border-border/50 py-32 flex flex-col items-center text-center px-6 shadow-card opacity-60">
          <div className="w-20 h-20 rounded-[2rem] bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-6 border border-green-100 dark:border-green-500/20 shadow-sm">
            <PackageCheck size={36} className="text-green-500" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mb-2">{t('workshop.returns.empty_title')}</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest max-w-xs mb-8 leading-relaxed">{t('workshop.returns.empty_body')}</p>
          <button onClick={() => navigate('/employe/dashboard')} className="bg-primary-600 hover:bg-primary-700 text-white rounded-2xl px-8 py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 flex items-center gap-2">
            <ChevronRight size={16} strokeWidth={3} className="rotate-180" /> {t('workshop.detail.back')}
          </button>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-[2rem] overflow-hidden bg-surface shadow-card border border-border/50">
            <table className="w-full">
              <thead>
                <tr className="bg-background/50 border-b border-border/50">
                  <th className="px-8 py-5 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.returns.table.headers.order')}</th>
                  <th className="px-8 py-5 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.returns.table.headers.details')}</th>
                  <th className="px-8 py-5 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.returns.table.headers.status')}</th>
                  <th className="px-8 py-5 text-start text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.returns.table.headers.updated')}</th>
                  <th className="px-8 py-5 text-end text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.returns.table.headers.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {returnedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-background/40 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4 text-start">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm border border-red-100 dark:border-red-500/20 group-hover:scale-110 transition-transform">
                          <AlertCircle size={22} strokeWidth={2.5} />
                        </div>
                        <span className="text-base font-black text-text-primary tracking-tighter">#{order.numeroCommande}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-start">
                      <p className="text-xs font-black text-text-primary uppercase tracking-tight">{order.commandeTapis?.length || 0} {t('workshop.returns.table.articles')}</p>
                    </td>
                    <td className="px-8 py-6 text-start"><StatusBadge status={order.status} /></td>
                    <td className="px-8 py-6 text-start">
                      <span className="text-xs font-black text-text-primary uppercase tracking-tight">{new Date(order.updatedAt || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">{new Date(order.updatedAt || order.createdAt).toLocaleTimeString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-6 text-end">
                      <button onClick={() => navigate(`/employe/commandes/${order.id}`)} className="inline-flex items-center gap-2 bg-primary-600 text-white rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg active:scale-95 group/btn">
                        {t('workshop.returns.table.process_btn')} <ChevronRight size={14} strokeWidth={3} className="rtl:rotate-180 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid grid-cols-1 gap-5">
            {returnedOrders.map(order => (
              <div
                key={order.id}
                onClick={() => navigate(`/employe/commandes/${order.id}`)}
                className="bg-surface rounded-[2rem] shadow-card p-6 border border-border/50 active:bg-background transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 start-0 w-1.5 h-full bg-red-500" />

                <div className="flex items-start justify-between mb-6 ps-2">
                  <div className="flex flex-col text-start">
                    <div className="flex items-center gap-1.5 mb-1 opacity-60">
                      <AlertCircle size={12} className="text-red-500" />
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{t('workshop.detail.labels.order')}</span>
                    </div>
                    <p className="text-2xl font-black text-text-primary tracking-tighter">#{order.numeroCommande}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="bg-background/50 rounded-2xl p-5 mb-5 border border-border/40 text-start flex justify-between items-center ms-1">
                  <div className="text-start">
                    <span className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">{t('workshop.returns.table.headers.details')}</span>
                    <span className="text-sm font-black text-text-primary tracking-tight">{order.commandeTapis?.length || 0} {t('workshop.returns.table.articles')}</span>
                  </div>
                  <div className="w-px h-8 bg-border/50" />
                  <div className="text-start">
                    <span className="block text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">{t('workshop.returns.table.headers.updated')}</span>
                    <div className="flex items-center gap-1.5 text-text-primary font-black text-xs uppercase tracking-tight">
                      <CalendarDays size={12} className="text-primary-500" strokeWidth={3} />
                      {new Date(order.updatedAt || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-[1.25rem] bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 active:bg-primary-700 transition-all group-hover:bg-primary-700 ms-1"
                >
                  {t('workshop.returns.table.process_return_btn')} <ChevronRight size={16} strokeWidth={3} className="rtl:rotate-180" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
