import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Package,
  Calendar,
  RefreshCw,
  XCircle,
  Loader2,
  AlertCircle,
  MapPin,
  Search,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchCanceledDeliveries, returnToWorkplace } from '../../store/livreur/livreurThunk';
import { useTranslation } from 'react-i18next';
import { selectLoading } from '../../store/livreur/livreurSelectors';

// ─── Sub-Components ───────────────────

const HorizontalCanceledCard = ({ order, onReturn, isProcessing }) => {
  const { t } = useTranslation();
  const baseUrl = import.meta.env.VITE_API_URL;

  const getMainImage = (order) => {
    const tapis = order.commandeTapis || order.tapis || order.articles || order.carpets || [];
    for (const t of tapis) {
      const imgs = t.tapisImages || t.images || t.photos || [];
      if (Array.isArray(imgs)) {
        const principal = imgs.find(i => i.isPrincipal);
        if (principal) {
          const url = principal.url || principal.imageUrl || principal.path;
          if (url) return url.startsWith('http') ? url : `${baseUrl}${url}`;
        }
        if (imgs[0]) {
          const first = imgs[0];
          const url = first.url || first.imageUrl || first.path || (typeof first === 'string' ? first : null);
          if (url) return url.startsWith('http') ? url : `${baseUrl}${url}`;
        }
      } else if (t.imageUrl) {
        return t.imageUrl.startsWith('http') ? t.imageUrl : `${baseUrl}${t.imageUrl}`;
      }
    }
    return null;
  };

  const mainImage = useMemo(() => getMainImage(order), [order]);

  return (
    <div className="bg-surface rounded-2xl shadow-card hover:shadow-card-hover transition-all border border-border/60 overflow-hidden flex flex-col md:flex-row group mb-3 md:mb-0 animate-in slide-in-from-bottom duration-300">

      {/* MOBILE HEADER */}
      <div className="md:hidden bg-red-500/5 px-4 py-3 flex items-center justify-between border-b border-border/50">
        <span className="text-xs font-bold text-red-700 dark:text-red-500">
          #{order.numeroCommande || order.id}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-500 uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {t('driver.canceled_deliveries.card.canceled_by_client')}
        </span>
      </div>

      {/* TABLET+ IMAGE SECTION */}
      <div className="hidden md:block w-32 md:w-44 relative overflow-hidden shrink-0 bg-red-500/5">
        {mainImage ? (
          <img
            src={mainImage}
            alt="Tapis"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-background/50">
            <XCircle className="w-10 h-10 text-text-muted opacity-20" />
          </div>
        )}
        <div className="absolute top-2 start-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 z-10">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">#{order.numeroCommande}</span>
        </div>
      </div>

      {/* TABLET+ CONTENT SECTION */}
      <div className="hidden md:flex flex-1 p-5 md:p-6 flex-col justify-between min-w-0 text-start">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col min-w-0">
            <h3 className="text-base md:text-lg font-bold text-text-primary truncate tracking-tight">
              {order.client?.nom || order.client?.name || t('driver.canceled_deliveries.card.client_unknown')}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold text-red-700 dark:text-red-500 uppercase tracking-wider bg-red-500/10 px-2.5 py-0.5 rounded-lg border border-red-500/20">
                {t('driver.canceled_deliveries.card.canceled_by_client')}
              </span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end shrink-0">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">{t('driver.canceled_deliveries.card.current_status')}</span>
            <div className="bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider">{t('driver.canceled_deliveries.card.to_return')}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-text-secondary">
            <MapPin size={14} className="text-primary-500 shrink-0" />
            <span className="text-sm font-medium truncate max-w-[250px]">
              {order.client?.adresse || order.client?.addresses?.[0]?.address || t('driver.canceled_deliveries.card.address_unknown')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Package size={14} className="text-primary-500 shrink-0" />
            <span className="text-sm font-medium">{t('driver.canceled_deliveries.card.carpets_count', { count: order.commandeTapis?.length || 0 })}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2 text-text-secondary px-2.5 py-1 bg-background rounded-lg border border-border">
            <Calendar size={14} />
            <span className="text-xs font-bold">{new Date(order.dateCreation || order.createdAt).toLocaleDateString(t('common.date_locale', 'fr-FR'))}</span>
          </div>
          <button
            onClick={() => onReturn(order.id)}
            disabled={isProcessing}
            className="px-6 py-2 bg-primary-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/10 hover:bg-primary-600 disabled:opacity-50 transition-all flex items-center gap-2 active:scale-95 group"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />}
            {t('driver.canceled_deliveries.card.return_btn')}
          </button>
        </div>
      </div>

      {/* MOBILE CONTENT SECTION */}
      <div className="md:hidden">
        <div className="px-5 py-5 text-start">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-base font-bold text-text-primary tracking-tight">
                {order.client?.nom || order.client?.name || t('driver.canceled_deliveries.card.client_fallback', 'Client')}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-text-secondary">
                <Calendar size={13} />
                <span className="text-[11px] font-semibold">
                  {t('driver.canceled_deliveries.card.canceled_on', { date: new Date(order.dateCreation || order.createdAt).toLocaleDateString(t('common.date_locale', 'fr-FR')) })}
                </span>
              </div>
            </div>
            <div className="bg-background px-2 py-1 rounded-lg border border-border">
              <span className="text-[10px] font-bold text-text-secondary uppercase">
                {t('driver.canceled_deliveries.card.carpets_count', { count: order.commandeTapis?.length || 0 })}
              </span>
            </div>
          </div>

          <div className="bg-background/80 p-3.5 rounded-xl mb-5 border border-border">
            <div className="flex items-start gap-2.5 text-text-secondary">
              <MapPin size={15} className="mt-0.5 shrink-0 text-primary-500" />
              <span className="text-sm font-medium leading-snug">
                {order.client?.adresse || order.client?.addresses?.[0]?.address || t('driver.canceled_deliveries.card.no_address')}
              </span>
            </div>
          </div>

          <button
            onClick={() => onReturn(order.id || order.commandeId)}
            disabled={isProcessing}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-primary-500/10 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw size={18} strokeWidth={2.5} />}
            {t('driver.canceled_deliveries.card.validate_return')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CanceledDeliveries() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const loading = useSelector(selectLoading);
  const [orders, setOrders] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = () => {
    dispatch(fetchCanceledDeliveries()).unwrap()
      .then(data => setOrders(data || []))
      .catch(() => setOrders([]));
  };

  useEffect(() => {
    fetchOrders();
  }, [dispatch]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      order.client?.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.numeroCommande?.toString().includes(searchQuery)
    ).sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [orders, searchQuery]);

  const handleReturn = async (orderId) => {
    setProcessingId(orderId);
    try {
      await dispatch(returnToWorkplace(orderId)).unwrap();
      toast.success(t('driver.canceled_deliveries.toasts.success'));
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      toast.error(err || t('driver.canceled_deliveries.toasts.error'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-32 px-4 md:px-0">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-start mt-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-3">
            {t('driver.canceled_deliveries.title')}
            {orders.length > 0 && (
              <span className="bg-red-500/10 text-red-600 dark:text-red-500 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-500/20 shadow-sm">
                {orders.length}
              </span>
            )}
          </h1>
          <p className="text-sm font-medium text-text-secondary mt-1">{t('driver.canceled_deliveries.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-full sm:w-72 bg-surface rounded-xl border border-border/60 p-1 flex items-center shadow-sm focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-50/50 transition-all">
            <Search className="text-text-muted group-focus-within:text-primary-500 ms-3 transition-colors" size={18} strokeWidth={2.5} />
            <input
              type="text"
              placeholder={t('driver.canceled_deliveries.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none py-2 px-3 text-sm font-semibold outline-none placeholder:font-medium placeholder:text-text-muted text-text-primary"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-surface border border-border/60 rounded-xl hover:bg-background transition-colors shadow-sm active:scale-95 flex items-center justify-center shrink-0"
          >
            <Loader2 size={20} strokeWidth={2.5} className={loading.canceledDeliveries ? 'animate-spin text-primary-500' : 'text-text-muted'} />
          </button>
        </div>
      </div>

      {/* WARNING BANNER */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-sm text-start">
        <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-amber-600 dark:text-amber-500 shadow-sm border border-border shrink-0">
          <AlertCircle size={20} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider">{t('driver.canceled_deliveries.required_action')}</p>
          <p className="text-xs text-amber-700 dark:text-amber-600 font-medium mt-0.5">
            {t('driver.canceled_deliveries.warning_note')}
          </p>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {loading.canceledDeliveries && orders.length === 0 ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-surface/50 rounded-2xl animate-pulse border border-border/60"></div>
          ))
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <HorizontalCanceledCard
              key={order.id}
              order={order}
              onReturn={handleReturn}
              isProcessing={processingId === order.id}
            />
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center bg-surface rounded-2xl border-2 border-dashed border-border/40">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-5 shadow-inner border border-border/50">
              <XCircle size={32} className="text-text-muted opacity-25" />
            </div>
            <h3 className="text-lg font-bold text-text-primary tracking-tight">{t('driver.canceled_deliveries.empty.title')}</h3>
            <p className="text-sm font-medium text-text-muted mt-2 text-center px-8">{t('driver.canceled_deliveries.empty.desc')}</p>
          </div>
        )}
      </div>

    </div>
  );
}
