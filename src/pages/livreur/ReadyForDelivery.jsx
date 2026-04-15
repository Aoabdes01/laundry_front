import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Package, Phone, Navigation, CreditCard,
  Target, RotateCcw, ExternalLink, X, CheckCircle2,
  AlertCircle, ChevronLeft, ChevronRight, ShoppingBag,
  Hash, Clock, Eye, Banknote, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import {
  fetchReadyForDelivery,
  confirmPayment,
  cancelDelivery,
  fetchPaymentTypes
} from '../../store/livreur/livreurThunk';
import {
  selectReadyForDelivery,
  selectLoading,
  selectPaymentTypes
} from '../../store/livreur/livreurSelectors';
import { removeOrderFromReady } from '../../store/livreur/livreurSlice';
import { toast } from 'react-toastify';
import { printReceipt } from '../../utils/printReceipt';
import ConfirmModal from '../../components/ui/ConfirmModal';

// ─── Leaflet Fixes & Styles ──────────────────────────────────────────────────
const leafletStyles = `
  .leaflet-container { width: 100%; height: 100%; border-radius: 0; }
  .leaflet-bar { border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
  .leaflet-control-zoom { border-radius: 12px !important; overflow: hidden; }
  .custom-div-icon { background: none; border: none; }
`;

const livreurIcon = L.divIcon({
  html: `<div class="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
  className: 'custom-div-icon', iconSize: [32, 32], iconAnchor: [16, 16]
});

const createNumberedIcon = (number, isSelected) => L.divIcon({
  html: `<div class="relative flex items-center justify-center">
    <div class="w-8 h-8 ${isSelected ? 'bg-primary-600 scale-125' : 'bg-primary-500'} rounded-xl border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black transition-all duration-300">
      ${number || ''}
    </div>
    <div class="absolute -bottom-1 w-2 h-2 ${isSelected ? 'bg-primary-600' : 'bg-primary-500'} rotate-45 border-b-2 border-r-2 border-white"></div>
  </div>`,
  className: 'custom-div-icon', iconSize: [32, 32], iconAnchor: [16, 32]
});

function decodePolyline(str, precision = 5) {
  let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, precision);
  while (index < str.length) {
    byte = null; shift = 0; result = 0;
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += latitude_change; byte = null; shift = 0; result = 0;
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += longitude_change; coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
}

const MapController = ({ markers, selectedOrderId, livreurPosition, forceFit }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      if (livreurPosition) bounds.extend([livreurPosition.lat, livreurPosition.lng]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [forceFit, markers.length]);
  useEffect(() => {
    if (selectedOrderId) {
      const target = markers.find(m => m.orderId === selectedOrderId);
      if (target) map.setView([target.lat, target.lng], 17, { animate: true });
    }
  }, [selectedOrderId]);
  return null;
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

const PaymentModal = ({ isOpen, onClose, onConfirm, order, paymentTypes = [], loading }) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState(null);
  useEffect(() => { if (isOpen) setSelectedType(null); }, [isOpen, order]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-surface w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2rem] shadow-modal overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 border-t sm:border border-border/50 text-center">
        <div className="w-12 h-1.5 bg-border/40 rounded-full mx-auto mt-4 mb-2 sm:hidden"></div>

        <div className="p-8 md:p-10">
          {/* ICON BOX (MATCHING ConfirmModal) */}
          <div className="w-20 h-20 bg-primary-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-primary-100">
            <CreditCard className="text-primary-600" size={40} strokeWidth={2.5} />
          </div>

          <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-2">{t('driver.ready_delivery.payment_modal.title')}</h3>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-8">{t('driver.pro_ui.finalizing_transaction')}</p>

          <div className="bg-primary-500/[0.03] rounded-2xl p-5 mb-8 border border-primary-500/10 flex justify-between items-center text-start">
            <div>
              <p className="text-[9px] font-black text-primary-400 uppercase tracking-[0.2em] mb-1">{t('driver.ready_delivery.payment_modal.order_prefix')}</p>
              <span className="text-lg font-black text-text-primary tracking-tighter">#{order?.numeroCommande}</span>
            </div>
            <div className="text-end">
              <p className="text-[9px] font-black text-primary-400 uppercase tracking-[0.2em] mb-1">{t('driver.pro_ui.total_to_collect')}</p>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-2xl font-black text-primary-600 tracking-tighter">{order?.montantTotal}</span>
                <span className="text-[10px] font-black text-primary-600/60 uppercase">DH</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-10">
            {paymentTypes && paymentTypes.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <div key={type.id} onClick={() => setSelectedType(type.id)} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.98] ${isSelected ? 'border-primary-500 bg-primary-500/[0.03] shadow-md' : 'border-transparent bg-background hover:border-border/50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-primary-500 bg-primary-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'border-border/60 bg-background'}`}>{isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}</div>
                    <span className={`text-xs font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-text-primary' : 'text-text-muted'}`}>{type.label}</span>
                  </div>
                  {type.code === 'especes' ? <Banknote size={20} className={isSelected ? 'text-primary-500' : 'text-text-muted/30'} /> : <CreditCard size={20} className={isSelected ? 'text-primary-500' : 'text-text-muted/30'} />}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onConfirm(selectedType)}
              disabled={!selectedType || loading}
              className="w-full bg-primary-600 text-white rounded-[1.5rem] py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3 hover:bg-primary-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={18} strokeWidth={3} /> {t('driver.ready_delivery.payment_modal.confirm_btn')}</>}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-background border border-border/50 text-text-muted rounded-2xl py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 hover:bg-surface"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeliveryCard = ({ order, onPay, onCancel, onShowGallery, isOptimized, isSelected, onSelect, navigate }) => {
  const { t } = useTranslation();
  const baseUrl = "http://localhost:8080";
  const allPhotos = useMemo(() => {
    const photos = [];
    const tapisList = order.commandeTapis || [];
    tapisList.forEach(t => {
      const imgs = t.tapisImages || t.images || t.imageUrls || [];
      if (Array.isArray(imgs)) { imgs.forEach(img => { const url = img.imageUrl || img.url || img.path || (typeof img === 'string' ? img : null); if (url) photos.push(url.startsWith('http') ? url : `${baseUrl}${url}`); }); }
      else if (t.imageUrl) photos.push(t.imageUrl.startsWith('http') ? t.imageUrl : `${baseUrl}${t.imageUrl}`);
    });
    return photos;
  }, [order]);
  const mainPhoto = allPhotos[0];
  const lat = order.client?.addresses?.[0]?.latitude; const lng = order.client?.addresses?.[0]?.longitude; const address = order.client?.addresses?.[0]?.address;
  const handleItinerary = (provider) => {
    if (lat && lng) { if (provider === 'waze') window.open(`https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank'); else window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank'); }
    else if (address) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank'); else toast.warning(t('driver.ready_delivery.card.no_address_error'));
  };

  return (
    <div
      className={`relative bg-surface rounded-[2rem] shadow-card overflow-hidden border transition-all animate-in slide-in-from-bottom duration-300 group cursor-pointer ${isSelected ? 'border-primary-500 ring-1 ring-primary-500/30 shadow-2xl scale-[1.02]' : 'border-border/50 hover:border-primary-200'}`}
      onClick={() => onSelect(order.id)}
    >
      {isOptimized && order._stopNumber && <div className="absolute top-5 start-5 z-20 w-10 h-10 rounded-xl bg-primary-500 text-white text-base font-black flex items-center justify-center shadow-lg border-2 border-surface shadow-primary-500/30"><span className="tracking-tighter">#{order._stopNumber}</span></div>}

      <div className="flex flex-col">
        <div className="p-6 pb-0 flex justify-between items-start gap-4">
          <div className="min-w-0 text-start flex-1 ps-2">
            <div className="flex items-center gap-2 mb-1 opacity-60">
              <Hash size={12} className="text-primary-500" />
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{order.numeroCommande}</span>
            </div>
            <h3 className="text-xl font-black text-text-primary tracking-tighter truncate leading-tight">{order.client?.nom || order.client?.name || 'Client'}</h3>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20 shadow-sm">{t('status.prete')}</span>
            {order._legDistance && (<div className="flex items-center gap-1.5 text-primary-600 font-black text-xs tracking-tighter bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100"><Navigation size={12} fill="currentColor" className="rtl:rotate-180" />{order._legDistance} km</div>)}
          </div>
        </div>

        <div className="p-6 flex gap-5">
          <div className="w-24 h-24 rounded-2xl bg-background overflow-hidden shrink-0 border border-border/50 relative shadow-sm" onClick={(e) => { e.stopPropagation(); onShowGallery(allPhotos, 0); }}>
            {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="preview" /> : <div className="w-full h-full flex items-center justify-center text-text-muted opacity-20"><Package size={32} /></div>}
            <div className="absolute bottom-1 right-1 bg-black/60 text-[9px] text-white font-black px-2 py-0.5 rounded-lg backdrop-blur-sm border border-white/10">{order.commandeTapis?.length || 0} ART.</div>
          </div>
          <div className="flex-1 min-w-0 text-start flex flex-col justify-center gap-3">
            <div className="flex items-start gap-2.5 text-text-muted">
              <MapPin size={16} className="text-primary-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed line-clamp-2 uppercase tracking-tight italic">{address || t('driver.ready_delivery.card.no_address')}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-600 flex items-center justify-center shrink-0">
                <Phone size={14} strokeWidth={3} className="rtl:rotate-180" />
              </div>
              <a href={`tel:${order.client?.phones?.[0]?.phoneNumber}`} onClick={(e) => e.stopPropagation()} className="text-sm font-black text-text-primary hover:text-primary-500 transition-colors tracking-tight">{order.client?.phones?.[0]?.phoneNumber || '—'}</a>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 grid grid-cols-2 gap-4">
          <div className="bg-background/40 rounded-2xl p-4 border border-border/40 text-start group-hover:bg-background/60 transition-colors">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5 opacity-60">{t('driver.pro_ui.total_to_collect')}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-text-primary tracking-tighter">{order.montantTotal}</span>
              <span className="text-[10px] font-black text-text-muted uppercase opacity-40">DH</span>
            </div>
          </div>
          <div className="bg-background/40 rounded-2xl p-4 border border-border/40 text-start group-hover:bg-background/60 transition-colors">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5 opacity-60">{t('driver.pro_ui.time_status')}</p>
            <div className="flex items-center gap-2 text-emerald-600">
              <Clock size={14} strokeWidth={3} />
              <span className="text-xs font-black uppercase tracking-tighter">{t('driver.pro_ui.available_time_status')}</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <div className="flex-1 flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); handleItinerary('google'); }} className="flex-1 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-primary-500/20 active:scale-95 group/btn">
              <Navigation size={18} fill="currentColor" className="rtl:rotate-180 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              GPS
            </button>
            <button onClick={(e) => { e.stopPropagation(); navigate(`/livreur/delivery/${order.id}`); }} className="w-14 h-14 bg-background hover:bg-surface text-text-muted hover:text-primary-500 border border-border/50 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm">
              <Eye size={22} />
            </button>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onPay(order); }} className="flex-1 h-14 bg-surface hover:bg-background text-text-primary border border-border/50 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-sm">
            <CreditCard size={18} />
            {t('driver.pro_ui.collect_payment')}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onCancel(order); }} className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 dark:border-red-500/20 active:scale-95 shrink-0 shadow-sm">
            <X size={24} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReadyForDelivery() {
  const { t } = useTranslation(); const dispatch = useDispatch(); const navigate = useNavigate();
  const ordersRaw = useSelector(selectReadyForDelivery); const paymentTypes = useSelector(selectPaymentTypes); const loading = useSelector(selectLoading);
  const [localGpsFixes, setLocalGpsFixes] = useState(() => { const saved = localStorage.getItem('livreur_gps_fixes'); return saved ? JSON.parse(saved) : {}; });
  const orders = useMemo(() => ordersRaw.map(order => { const fix = localGpsFixes[order.id]; if (fix && order.client?.addresses?.[0]) return { ...order, client: { ...order.client, addresses: [{ ...order.client.addresses[0], latitude: fix.lat, longitude: fix.lng }] } }; return order; }), [ordersRaw, localGpsFixes]);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null });
  const [lightboxOpen, setLightboxOpen] = useState(false); const [lightboxImages, setLightboxImages] = useState([]); const [lightboxIndex, setLightboxIndex] = useState(0);
  const [optimizedOrders, setOptimizedOrders] = useState([]); const [routeCoords, setRouteCoords] = useState([]); const [isOptimizing, setIsOptimizing] = useState(false); const [optimizationError, setOptimizationError] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0); const [totalDuration, setTotalDuration] = useState(0); const [optimized, setOptimized] = useState(false); const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [forceFit, setForceFit] = useState(0);
  const [cancelModalOpen, setCancelModalOpen] = useState(false); const [orderToCancel, setOrderToCancel] = useState(null); const [cancelLoading, setCancelLoading] = useState(false);
  const [travelMode, setTravelMode] = useState('driving-car'); const [livreurPosition, setLivreurPosition] = useState(null); const watchIdRef = useRef(null);

  useEffect(() => {
    if ("geolocation" in navigator) { watchIdRef.current = navigator.geolocation.watchPosition((p) => setLivreurPosition({ lat: p.coords.latitude, lng: p.coords.longitude }), () => { }, { enableHighAccuracy: true }); }
    return () => { if (watchIdRef.current !== null && "geolocation" in navigator) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  useEffect(() => { dispatch(fetchReadyForDelivery()); dispatch(fetchPaymentTypes()); }, [dispatch]);

  const optimizeRoute = async (mode = travelMode) => {
    const ordersWithGPS = orders.filter(o => o.client?.addresses?.[0]?.latitude && o.client?.addresses?.[0]?.longitude);
    if (ordersWithGPS.length < 1) return setOptimizationError(t('driver.ready_delivery.status.min_gps'));
    setIsOptimizing(true); setOptimizationError(null);
    try {
      const apiKey = import.meta.env.VITE_ORS_API_KEY;
      const jobs = ordersWithGPS.map((o, idx) => ({ id: idx, location: [parseFloat(o.client.addresses[0].longitude), parseFloat(o.client.addresses[0].latitude)], service: 120 }));
      const vehicles = [{ id: 0, profile: mode, start: livreurPosition ? [livreurPosition.lng, livreurPosition.lat] : jobs[0].location }];
      const res = await fetch('https://api.openrouteservice.org/optimization', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': apiKey }, body: JSON.stringify({ jobs, vehicles, options: { g: true } }) });
      if (!res.ok) throw new Error(res.status === 429 ? 'Quota dépassé' : 'Erreur API');
      const data = await res.json();
      if (data.code !== 0) throw new Error(data.error || 'Erreur optimisation');
      const route = data.routes[0];
      const steps = route.steps;
      const reordered = steps.filter(s => s.type === 'job').map((s, idx) => { const originalOrder = ordersWithGPS[s.id]; return { ...originalOrder, _stopNumber: idx + 1, _legDistance: (s.distance / 1000).toFixed(1), _legDuration: Math.round(s.duration / 60) }; });
      const ordersWithoutGPS = orders.filter(o => !o.client?.addresses?.[0]?.latitude);
      setOptimizedOrders([...reordered, ...ordersWithoutGPS]);
      setTotalDistance((route.distance / 1000).toFixed(1)); setTotalDuration(Math.round(route.duration / 60));
      if (route.geometry) setRouteCoords(decodePolyline(route.geometry));
      setOptimized(true); setForceFit(prev => prev + 1);
    } catch (err) { console.error(err); setOptimizationError(err.message); }
    finally { setIsOptimizing(false); }
  };

  useEffect(() => { if (orders.length >= 2 && !optimized) optimizeRoute(); }, [orders.length]);

  const displayOrders = optimized ? optimizedOrders : orders;
  const mapMarkers = useMemo(() => {
    const source = optimized ? optimizedOrders : orders;
    return source.filter(o => o.client?.addresses?.[0]?.latitude).map((o) => ({ lat: parseFloat(o.client.addresses[0].latitude), lng: parseFloat(o.client.addresses[0].longitude), orderId: o.id, stopNumber: optimized ? o._stopNumber : null }));
  }, [displayOrders, optimized]);

  const handleConfirmPayment = async (methodId) => {
    if (!paymentModal.order) return;
    try {
      await dispatch(confirmPayment({ orderId: paymentModal.order.id, data: { modePaiement: methodId } })).unwrap();
      const paidOrder = paymentModal.order; printReceipt(paidOrder, paymentTypes.find(t => t.id === methodId)?.label || 'Paiement');
      dispatch(removeOrderFromReady(paidOrder.id)); setOptimizedOrders(prev => prev.filter(o => o.id !== paidOrder.id));
      toast.success(t('driver.ready_delivery.toasts.payment_success')); setPaymentModal({ isOpen: false, order: null }); dispatch(fetchReadyForDelivery());
    } catch (err) { toast.error(err || t('driver.delivery_details.toasts.error')); }
  };

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;
    setCancelLoading(true);
    try {
      await dispatch(cancelDelivery(orderToCancel.id)).unwrap();
      setOptimizedOrders(prev => prev.filter(o => o.id !== orderToCancel.id)); setCancelModalOpen(false); setOrderToCancel(null); dispatch(fetchReadyForDelivery());
      toast.success(t('driver.ready_delivery.toasts.cancel_success'));
    } catch (e) { toast.error(t('driver.ready_delivery.toasts.cancel_error')); }
    finally { setCancelLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-fade-in px-4 md:px-0 text-start">
      <style>{leafletStyles}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mt-2">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">{t('driver.ready_delivery.title')}</h1>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60 mt-1">{t('driver.ready_delivery.subtitle')}</p>
        </div>
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-sm shrink-0">
          <ShoppingBag className="text-primary-500" size={20} strokeWidth={2.5} />
          <p className="text-sm font-black text-primary-600 tracking-wide leading-none">{t('driver.ready_delivery.orders_count', { count: orders.length })}</p>
        </div>
      </div>

      <div className="flex bg-surface border border-border/50 p-1.5 rounded-2xl w-fit shadow-sm">
        <button onClick={() => { setTravelMode('driving-car'); optimizeRoute('driving-car'); }} className={`flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${travelMode === 'driving-car' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-text-muted hover:text-text-primary'}`}>🚗 {t('driver.ready_delivery.travel_mode.driving')}</button>
        <button onClick={() => { setTravelMode('foot-walking'); optimizeRoute('foot-walking'); }} className={`flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${travelMode === 'foot-walking' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'text-text-muted hover:text-text-primary'}`}>🚶 {t('driver.ready_delivery.travel_mode.foot')}</button>
      </div>

      <div className="relative group bg-surface rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl shadow-primary-500/5">
        <div className="h-72 sm:h-96 w-full relative z-0">
          <MapContainer center={[33.5731, -7.5898]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }} scrollWheelZoom={false}>
            <TileLayer url={`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${import.meta.env.VITE_MAPTILER_KEY}`} maxZoom={22} />
            {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: '#F97316', weight: 5, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }} />}
            {livreurPosition && <Marker position={[livreurPosition.lat, livreurPosition.lng]} icon={livreurIcon} />}
            <MapController markers={mapMarkers} selectedOrderId={selectedOrderId} livreurPosition={livreurPosition} forceFit={forceFit} />
            {mapMarkers.map((marker, idx) => (<Marker key={idx} position={[marker.lat, marker.lng]} icon={createNumberedIcon(marker.stopNumber, selectedOrderId === marker.orderId)}><Popup>{t('driver.pro_ui.stop_number')} #{marker.stopNumber}</Popup></Marker>))}
          </MapContainer>
        </div>

        <button onClick={() => setForceFit(prev => prev + 1)} className="absolute top-6 right-6 z-[10] w-12 h-12 bg-surface/90 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl flex items-center justify-center text-text-primary hover:text-primary-500 transition-all active:scale-90 shadow-primary-500/10" title={t('driver.pro_ui.recenter_map')}><Target size={24} strokeWidth={2.5} /></button>

        <div className="absolute bottom-6 left-6 right-6 z-[10] bg-surface/90 backdrop-blur-xl border border-border/50 p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center justify-between gap-6 animate-in slide-in-from-bottom duration-700">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5 text-start">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              <h4 className="font-black text-[10px] text-text-primary uppercase tracking-[0.2em]">{t('driver.ready_delivery.actions.launch')}</h4>
            </div>
            <p className="text-text-muted text-xs font-black uppercase tracking-tighter truncate text-start">{optimized ? `${totalDistance} ${t('driver.pro_ui.km_approx')} ${totalDuration} ${t('driver.pro_ui.minutes')}` : t('driver.ready_delivery.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => optimizeRoute(travelMode)} className="w-12 h-12 flex items-center justify-center bg-background border border-border/50 rounded-2xl text-text-muted hover:text-primary-500 transition-all shadow-sm"><RotateCcw size={20} className={isOptimizing ? 'animate-spin' : ''} strokeWidth={2.5} /></button>
            <button onClick={() => { const list = optimized ? optimizedOrders.filter(o => o.client?.addresses?.[0]?.latitude) : orders.filter(o => o.client?.addresses?.[0]?.latitude); if (!list.length) return; const url = `https://www.google.com/maps/dir/${livreurPosition ? livreurPosition.lat + ',' + livreurPosition.lng : ''}/${list.map(o => o.client.addresses[0].latitude + ',' + o.client.addresses[0].longitude).join('/')}`; window.open(url, '_blank'); }} className="bg-primary-600 hover:bg-primary-700 text-white rounded-2xl px-6 h-12 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 flex items-center gap-3 active:scale-95"><ExternalLink size={18} strokeWidth={2.5} /> {t('common.google', 'Google')}</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-start">
        {displayOrders.length > 0 ? displayOrders.map(order => (<DeliveryCard key={order.id} order={order} onPay={(o) => setPaymentModal({ isOpen: true, order: o })} onCancel={(o) => { setOrderToCancel(o); setCancelModalOpen(true); }} onShowGallery={(imgs, i) => { setLightboxImages(imgs); setLightboxIndex(i); setLightboxOpen(true); }} isOptimized={optimized} isSelected={selectedOrderId === order.id} onSelect={(id) => { setSelectedOrderId(id === selectedOrderId ? null : id); if (id !== selectedOrderId) { const mapEl = document.querySelector('.leaflet-container'); mapEl?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }} navigate={navigate} />)) : (<div className="col-span-full py-32 flex flex-col items-center justify-center bg-surface rounded-[2.5rem] border-2 border-dashed border-border/40 opacity-40"><div className="w-20 h-20 bg-background rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-border/50"><Navigation size={40} className="text-text-muted" /></div><h3 className="text-xl font-black text-text-primary uppercase tracking-tight">{t('driver.ready_delivery.empty.title')}</h3><p className="text-[10px] font-bold text-text-muted mt-2 uppercase tracking-[0.2em]">{t('driver.ready_delivery.empty.desc')}</p></div>)}
      </div>

      <PaymentModal isOpen={paymentModal.isOpen} order={paymentModal.order} paymentTypes={paymentTypes} loading={loading.payment} onClose={() => setPaymentModal({ isOpen: false, order: null })} onConfirm={handleConfirmPayment} />

      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        loading={cancelLoading}
        title={t('driver.ready_delivery.cancel_modal.title')}
        message={t('driver.ready_delivery.cancel_modal.question')}
        confirmText={t('driver.ready_delivery.cancel_modal.confirm')}
        cancelText={t('driver.ready_delivery.cancel_modal.keep')}
        type="danger"
      />

      {lightboxOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center animate-fade-in" onClick={(e) => e.target === e.currentTarget && setLightboxOpen(false)}>
          <div className="absolute top-0 left-0 right-0 pt-[env(safe-area-inset-top)] p-6 w-full flex justify-between items-center z-[210] backdrop-blur-md bg-black/20">
            <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">{lightboxIndex + 1} / {lightboxImages.length} IMAGES</div>
            <button className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md hover:bg-red-500 flex items-center justify-center transition-all active:scale-90 border border-white/10 shadow-lg" onClick={() => setLightboxOpen(false)}><X size={24} strokeWidth={3} className="text-white" /></button>
          </div>
          <div className="relative flex items-center justify-center w-full h-full p-4 md:p-12">
            {lightboxIndex > 0 && (<button className="absolute left-4 md:left-8 w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md flex items-center justify-center transition-all z-[210] border border-white/5 shadow-2xl" onClick={() => setLightboxIndex(i => i - 1)}><ChevronLeft className="w-10 h-10 text-white" strokeWidth={3} /></button>)}
            <div className="max-w-full max-h-full flex items-center justify-center"><img src={lightboxImages[lightboxIndex]} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500" alt="zoom" /></div>
            {lightboxIndex < lightboxImages.length - 1 && (<button className="absolute right-4 md:right-8 w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md flex items-center justify-center transition-all z-[210] border border-white/5 shadow-2xl" onClick={() => setLightboxIndex(i => i + 1)}><ChevronRight className="w-10 h-10 text-white" strokeWidth={3} /></button>)}
          </div>
        </div>
      )}
    </div>
  );
}
