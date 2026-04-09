import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ChevronRight, CalendarDays, AlertCircle, PackageCheck } from 'lucide-react';
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
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 text-start">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            {t('workshop.returns.title')}
            {returnedOrders.length > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{returnedOrders.length}</span>
            )}
          </h1>
          <p className="text-sm text-text-muted">{t('workshop.returns.subtitle')}</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mb-5 text-start">
        <RefreshCw size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          {t('workshop.returns.banner')}
        </p>
      </div>

      {/* Empty State */}
      {returnedOrders.length === 0 ? (
        <div className="bg-surface rounded-2xl shadow-card py-16 flex flex-col items-center text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
            <PackageCheck size={28} className="text-green-500" />
          </div>
          <h3 className="font-semibold text-text-primary mb-1">{t('workshop.returns.empty_title')}</h3>
          <p className="text-sm text-text-muted max-w-xs mb-4">{t('workshop.returns.empty_body')}</p>
          <button onClick={() => navigate('/employe/dashboard')} className="bg-primary-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-primary-700 transition-colors">
            {t('workshop.detail.back')}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block rounded-2xl overflow-hidden bg-surface shadow-card">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-border">
                  <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase tracking-wider">{t('workshop.returns.table.headers.order')}</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase tracking-wider">{t('workshop.returns.table.headers.details')}</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase tracking-wider">{t('workshop.returns.table.headers.status')}</th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase tracking-wider">{t('workshop.returns.table.headers.updated')}</th>
                  <th className="px-4 py-3 text-end text-xs font-semibold text-text-muted uppercase tracking-wider">{t('workshop.returns.table.headers.action')}</th>
                </tr>
              </thead>
              <tbody>
                {returnedOrders.map(order => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-text-primary">#{order.numeroCommande}</span>
                    </td>
                    <td className="px-4 py-3.5 text-start">
                      <p className="text-sm text-text-secondary">{order.commandeTapis?.length || 0} {t('workshop.returns.table.articles')}</p>
                      <p className="text-xs text-primary-600 font-medium">{order.montantTotal} {t('orders.kpi.unit_dh')}</p>
                    </td>
                    <td className="px-4 py-3.5 text-start"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3.5 text-start">
                      <span className="text-xs text-text-muted">{new Date(order.updatedAt || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR')}</span>
                    </td>
                    <td className="px-4 py-3.5 text-end">
                      <button onClick={() => navigate(`/employe/commandes/${order.id}`)} className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-600 border border-primary-200 rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-primary-100 transition-colors">
                        {t('workshop.returns.table.process_btn')} <ChevronRight size={14} className="rtl:rotate-180" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-4">
            {returnedOrders.map(order => (
              <div 
                key={order.id} 
                onClick={() => navigate(`/employe/commandes/${order.id}`)}
                className="bg-white rounded-[2rem] shadow-md p-5 border border-border/40 active:scale-[0.98] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                   <div className="flex flex-col text-start">
                      <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-0.5">{t('workshop.detail.labels.order')}</span>
                      <p className="text-lg font-black text-text-primary tracking-tight">#{order.numeroCommande}</p>
                   </div>
                   <StatusBadge status={order.status} />
                </div>
                <div className="bg-gray-50/50 p-4 rounded-2xl mb-4 border border-gray-100 text-start">
                   <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-text-muted">
                      <span>{order.commandeTapis?.length || 0} {t('workshop.returns.table.headers.details')}</span>
                      <span className="text-primary-600">{order.montantTotal} {t('orders.kpi.unit_dh')}</span>
                   </div>
                   <div className="flex items-center gap-1.5 mt-2 text-text-muted">
                      <CalendarDays size={12} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                         {t('workshop.returns.table.returned_on', { date: new Date(order.updatedAt || order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR') })}
                      </span>
                   </div>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 active:bg-primary-600 transition-all"
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

