import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Phone,
  Package,
  Calendar,
  RefreshCw,
  XCircle,
  Loader2,
  AlertCircle,
  MapPin,
  Image as ImageIcon,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchCanceledDeliveries, returnToWorkplace } from '../../store/livreur/livreurThunk';
import { useTranslation } from 'react-i18next';
import { selectLoading } from '../../store/livreur/livreurSelectors';

// ─── Sub-Components ───────────────────

const HorizontalCanceledCard = ({ order, onReturn, isProcessing }) => {
  const { t } = useTranslation();
  const baseUrl = import.meta.env.VITE_API_URL// 'http://localhost:8080';

  const getMainImage = (order) => {
    // Check all possible field names for carpet list
    const tapis = order.commandeTapis
      || order.tapis
      || order.articles
      || order.carpets
      || []

    for (const t of tapis) {
      // Check all possible field names for images
      const imgs = t.tapisImages || t.images || t.photos || []

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
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-card hover:shadow-card-hover transition-all border border-border/50 overflow-hidden flex flex-col md:flex-row group mb-3 md:mb-0">

      {/* MOBILE HEADER (Top section) - Visible only on mobile */}
      <div className="md:hidden bg-red-50 px-4 py-3 flex items-center justify-between border-b border-red-100">
        <span className="text-xs font-bold text-red-600 font-mono">
          #{order.id || order.commandeId || order.numeroCommande}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {t('driver.canceled_deliveries.card.canceled_by_client')}
        </span>
      </div>

      {/* TABLET+ IMAGE SECTION (Left) - Hidden on mobile by md:block */}
      <div className="hidden md:block w-32 md:w-48 relative overflow-hidden shrink-0 bg-red-50">
        {mainImage ? (
          <img
            src={mainImage}
            alt="Tapis"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.style.background = 'linear-gradient(135deg, #fecaca, #fca5a5)';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-100 to-red-200">
            <XCircle className="w-10 h-10 text-red-300" />
          </div>
        )}
        <div className="absolute top-2 start-2 bg-red-500/80 backdrop-blur-md px-2 py-1 rounded-lg border border-red-400/20 z-10">
          <span className="text-[9px] font-bold text-white uppercase tracking-wider">#{order.numeroCommande}</span>
        </div>
      </div>

      {/* TABLET+ CONTENT SECTION (Right) - Hidden on mobile by md:flex */}
      <div className="hidden md:flex flex-1 p-4 md:p-6 flex-col justify-between min-w-0">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col min-w-0 text-start">
            <h3 className="text-base md:text-lg font-bold text-text-primary truncate uppercase tracking-tight">
              {order.client?.nom || order.client?.name || t('driver.canceled_deliveries.card.client_unknown')}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full border border-red-100/50">
                {t('driver.canceled_deliveries.card.canceled_by_client')}
              </span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end shrink-0">
            <span className="text-[10px] font-bold text-text-muted uppercase mb-1">{t('driver.canceled_deliveries.card.current_status')}</span>
            <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
              <span className="text-[10px] font-bold text-red-600 uppercase">{t('driver.canceled_deliveries.card.to_return')}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 text-text-muted">
            <MapPin size={14} className="rtl:rotate-180" />
            <span className="text-xs font-medium truncate max-w-[200px]">
              {order.client?.adresse || order.client?.addresses?.[0]?.address || t('driver.canceled_deliveries.card.address_unknown')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-muted">
            <Package size={14} />
            <span className="text-xs font-medium">{t('driver.canceled_deliveries.card.carpets_count', { count: order.commandeTapis?.length || 0 })}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2 text-text-muted px-2 py-1 bg-gray-50 rounded-lg">
            <Calendar size={14} />
            <span className="text-xs font-bold">{new Date(order.dateCreation || order.createdAt).toLocaleDateString(t('common.date_locale', 'fr-FR'))}</span>
          </div>
          <button
            onClick={() => onReturn(order.id)}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/20 hover:bg-primary-600 disabled:opacity-50 transition-all flex items-center gap-2 group/btn active:scale-95"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} className="group-hover/btn:rotate-180 transition-transform duration-500" />}
            {t('driver.canceled_deliveries.card.return_btn')}
          </button>
        </div>
      </div>

      {/* MOBILE CONTENT SECTION - Visible only on mobile */}
      <div className="md:hidden">
        {/* Middle section: client + info */}
        <div className="px-5 py-4 text-start">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-base font-black text-text-primary uppercase tracking-tight">
                {order.client?.nom || order.client?.name || t('driver.canceled_deliveries.card.client_fallback', 'Client')}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-text-muted">
                <Calendar size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {t('driver.canceled_deliveries.card.canceled_on', { date: new Date(order.dateCreation || order.createdAt).toLocaleDateString(t('common.date_locale', 'fr-FR')) })}
                </span>
              </div>
            </div>
            <div className="bg-gray-100 px-2 py-1 rounded-lg border border-border/50">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-tighter">
                {t('driver.canceled_deliveries.card.carpets_count', { count: order.commandeTapis?.length || 0 })}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
            <div className="flex items-start gap-2 text-text-muted">
              <MapPin size={14} className="mt-0.5 shrink-0 rtl:rotate-180" />
              <span className="text-xs font-medium leading-relaxed">
                {order.client?.adresse || order.client?.addresses?.[0]?.address || t('driver.canceled_deliveries.card.no_address')}
              </span>
            </div>
          </div>

          <button
            onClick={() => onReturn(order.id || order.commandeId)}
            disabled={isProcessing}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw size={18} strokeWidth={3} />}
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
      order.numeroCommande.toString().includes(searchQuery)
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
    <div className="animate-fade-in space-y-8 pb-32 px-4 md:px-0">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-start">
        <div>
          <h1 className="text-3xl font-black text-text-primary flex items-center gap-3 tracking-tighter uppercase">
            {t('driver.canceled_deliveries.title')}
            {orders.length > 0 && (
              <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black border border-red-100">
                {orders.length}
              </span>
            )}
          </h1>
          <p className="text-sm text-text-muted mt-1 font-bold">{t('driver.canceled_deliveries.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-full sm:w-72">
            <ArrowRight className="absolute start-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors rtl:rotate-180" size={18} />
            <input
              type="text"
              placeholder={t('driver.canceled_deliveries.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-border rounded-2xl py-3.5 ps-12 pe-4 text-sm focus:border-primary-500 outline-none transition-all shadow-sm"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="p-3.5 bg-white border border-border rounded-2xl hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
          >
            <Loader2 size={20} className={loading.canceledDeliveries ? 'animate-spin text-primary-500' : 'text-text-muted'} />
          </button>
        </div>
      </div>

      {/* WARNING BANNER */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm text-start">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-500 shadow-sm shrink-0">
          <AlertCircle size={20} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-black text-red-700 uppercase tracking-tight">{t('driver.canceled_deliveries.required_action')}</p>
          <p className="text-[10px] text-red-600/80 uppercase font-black tracking-widest mt-0.5 text-balance">
            {t('driver.canceled_deliveries.warning_note')}
          </p>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="grid grid-cols-1 gap-4">
        {loading.canceledDeliveries && orders.length === 0 ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-gray-50 rounded-3xl animate-pulse border border-border"></div>
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
          <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-border/50">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <XCircle size={40} className="text-text-muted opacity-20" />
            </div>
            <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">{t('driver.canceled_deliveries.empty.title')}</h3>
            <p className="text-sm font-bold text-text-muted mt-2 max-w-xs text-center uppercase tracking-widest">{t('driver.canceled_deliveries.empty.desc')}</p>
          </div>
        )}
      </div>

    </div>
  );
}

