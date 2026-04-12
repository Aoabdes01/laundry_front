import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Package, Phone, Navigation, CreditCard,
  Loader2, X, Clock, AlertTriangle, AlertCircle,
  CheckCircle, ChevronRight, ChevronLeft, ShoppingBag,
  ExternalLink, Target, Map as MapIcon, Info, RotateCcw,
  FileText, ArrowRight, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { printReceipt } from '../../utils/printReceipt';
import { removeOrderFromReady } from '../../store/livreur/livreurSlice';
import {
  fetchReadyForDelivery,
  confirmPayment,
  fetchPaymentTypes,
  cancelDelivery
} from '../../store/livreur/livreurThunk';
import {
  selectReadyForDelivery,
  selectLoading,
  selectPaymentTypes
} from '../../store/livreur/livreurSelectors';

// Fix Leaflet default icon issues
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Polyline decoding utility
const decodePolyline = (str, precision = 5) => {
  let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, precision);
  while (index < str.length) {
    byte = null; shift = 0; result = 0;
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    shift = result = 0;
    do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += latitude_change; lng += longitude_change;
    coordinates.push([lat / factor, lng / factor]); 
  }
  return coordinates;
};

const leafletStyles = `
  .leaflet-control-attribution { display: none !important; }
  .leaflet-bar { border: none !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; border-radius: 12px !important; overflow: hidden; }
  .leaflet-bar a { background-color: var(--surface) !important; color: var(--text-primary) !important; border-bottom: 1px solid var(--border) !important; }
  @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
  .livreur-dot-ring { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; border-radius: 50%; background: rgba(59,130,246,0.35); animation: pulse-ring 1.4s ease-out infinite; }
  .livreur-dot-core { width: 14px; height: 14px; background: #3B82F6; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(59,130,246,0.5); position: relative; z-index: 1; }
`;

const livreurIcon = new L.DivIcon({
  html: `<div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;"><div class="livreur-dot-ring"></div><div class="livreur-dot-core"></div></div>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10],
});

const createNumberedIcon = (number, isSelected = false) => new L.DivIcon({
  html: `<div style="background: ${isSelected ? '#3B82F6' : '#F97316'}; color: white; width: ${isSelected ? '36px' : '28px'}; height: ${isSelected ? '36px' : '28px'}; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: ${isSelected ? '16px' : '13px'}; font-weight: 800; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transform: rotate(45deg);"><span style="transform: rotate(-45deg);">${number}</span></div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -18],
});

const MapController = ({ markers, selectedOrderId, livreurPosition, forceFit }) => {
  const map = useMap();
  const lastFitRef = useRef(null);
  useEffect(() => {
    if (selectedOrderId) {
      const target = markers.find(m => m.orderId === selectedOrderId || m.id === selectedOrderId);
      if (target) map.flyTo([target.lat, target.lng], 17, { animate: true, duration: 1.2 });
    } else if (markers.length > 0) {
      const fitKey = markers.map(m => m.orderId).join(',');
      if (fitKey !== lastFitRef.current || forceFit) {
        const pts = markers.map(m => [m.lat, m.lng]);
        if (livreurPosition) pts.push([livreurPosition.lat, livreurPosition.lng]);
        map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], animate: true });
        lastFitRef.current = fitKey;
      }
    }
  }, [selectedOrderId, markers, map, forceFit, livreurPosition]);
  return null;
};

// ─── Sub-Components ───────────────────

const PaymentModal = ({ isOpen, onClose, onConfirm, order, paymentTypes = [], loading }) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState(null);
  useEffect(() => { if (isOpen) setSelectedType(null); }, [isOpen, order]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-surface w-full max-w-sm rounded-t-3xl sm:rounded-2xl shadow-modal overflow-hidden animate-in slide-in-from-bottom duration-300 p-6 border-t sm:border border-border/60">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5 sm:hidden"></div>
        <div className="flex justify-between items-center mb-4 text-start">
          <h3 className="text-lg font-bold text-text-primary tracking-tight">{t('driver.ready_delivery.payment_modal.title')}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background transition-colors"><X size={18} className="text-text-muted" /></button>
        </div>
        <p className="text-xs text-text-muted mb-6 font-semibold uppercase tracking-wider text-start">
          {t('driver.ready_delivery.payment_modal.order_prefix')} <span className="text-primary-600 dark:text-primary-500 font-bold">#{order?.numeroCommande || order?.id}</span>
        </p>
        <div className="space-y-2 mb-6">
          {paymentTypes && paymentTypes.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <div key={type.id} onClick={() => setSelectedType(type.id)} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-2 border-primary-500 bg-primary-500/10 shadow-sm' : 'border-border hover:border-primary-200 hover:bg-primary-500/5'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary-500 bg-surface' : 'border-border bg-background'}`}>{isSelected && <div className="w-2 h-2 bg-primary-500 rounded-full"></div>}</div>
                <span className={`text-sm font-bold tracking-tight transition-colors ${isSelected ? 'text-primary-700 dark:text-primary-500' : 'text-text-primary'}`}>{type.label}</span>
              </div>
            );
          })}
        </div>
        <button onClick={() => onConfirm(selectedType)} disabled={!selectedType || loading} className="w-full bg-primary-500 text-white rounded-xl py-4 text-sm font-bold shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2 hover:bg-primary-600 disabled:opacity-50 transition-all active:scale-95">{loading ? <Loader2 className="animate-spin" size={20} /> : t('driver.ready_delivery.payment_modal.confirm_btn')}</button>
      </div>
    </div>
  );
};

const DeliveryCard = ({ order, onPay, onCancel, onShowGallery, isOptimized, isSelected, onSelect, navigate }) => {
  const { t } = useTranslation();
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
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
  const timeAgo = useMemo(() => {
    const created = new Date(order.dateCreation); const now = new Date(); const diffMs = now - created; const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin} min`; const diffHours = Math.floor(diffMin / 60); if (diffHours < 24) return `${diffHours}h`; return `${Math.floor(diffHours / 24)}j`;
  }, [order.dateCreation]);
  const lat = order.client?.addresses?.[0]?.latitude; const lng = order.client?.addresses?.[0]?.longitude; const address = order.client?.addresses?.[0]?.address;
  const handleItinerary = (provider) => {
    if (lat && lng) { if (provider === 'waze') window.open(`https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank'); else window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank'); }
    else if (address) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank'); else toast.warning(t('driver.ready_delivery.card.no_address_error'));
  };

  return (
    <div 
      className={`relative bg-surface rounded-2xl shadow-card overflow-hidden border transition-all animate-in slide-in-from-bottom duration-300 group cursor-pointer ${isSelected ? 'border-primary-500 ring-4 ring-primary-500/10 shadow-lg' : 'border-border/60 hover:border-primary-200'}`} 
      onClick={() => onSelect(order.id)}
    >
      {isOptimized && order._stopNumber && <div className="absolute top-4 start-4 z-20 w-9 h-9 rounded-xl bg-primary-500 text-white text-sm font-bold flex items-center justify-center shadow-lg border-2 border-surface rotate-45"><span className="-rotate-45">{order._stopNumber}</span></div>}
      <div className="flex flex-col">
        <div className="p-5 pb-0 flex justify-between items-start gap-4">
          <div className="min-w-0 text-start flex-1"><p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Commande <span className="text-primary-600 dark:text-primary-500">#{order.numeroCommande}</span></p><h3 className="text-xl font-bold text-text-primary tracking-tight truncate leading-tight">{order.client?.nom || order.client?.name || 'Client'}</h3></div>
          <div className="flex flex-col items-end gap-2 shrink-0"><span className="bg-teal-500/10 text-teal-700 dark:text-teal-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-teal-500/20">Prêt</span>{order._legDistance && (<div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-500 font-bold text-xs"><Navigation size={12} className="rtl:rotate-180" />{order._legDistance} km</div>)}</div>
        </div>
        <div className="p-5 flex gap-4">
          <div className="w-24 h-24 rounded-2xl bg-background overflow-hidden shrink-0 border border-border/50 relative shadow-sm" onClick={(e) => { e.stopPropagation(); onShowGallery(allPhotos, 0); }}>
            {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="preview" /> : <div className="w-full h-full flex items-center justify-center text-text-muted opacity-20"><Package size={32} /></div>}
            <div className="absolute bottom-1 right-1 bg-black/60 text-[9px] text-white font-bold px-1.5 py-0.5 rounded-lg backdrop-blur-sm border border-white/10">{order.commandeTapis?.length || 0} Art.</div>
          </div>
          <div className="flex-1 min-w-0 text-start flex flex-col justify-center gap-2.5">
            <div className="flex items-start gap-2 text-text-secondary"><MapPin size={16} className="text-primary-500 shrink-0 mt-0.5" /><p className="text-sm font-medium leading-snug line-clamp-2 italic">{address || t('driver.ready_delivery.card.no_address')}</p></div>
            <div className="flex items-center gap-2"><Phone size={16} className="text-primary-500 shrink-0 rtl:rotate-180" /><a href={`tel:${order.client?.phones?.[0]?.phoneNumber}`} onClick={(e) => e.stopPropagation()} className="text-sm font-bold text-primary-600 dark:text-primary-500 hover:underline">{order.client?.phones?.[0]?.phoneNumber || 'Aucun téléphone'}</a></div>
          </div>
        </div>
        <div className="px-5 pb-5 grid grid-cols-2 gap-3">
          <div className="bg-background/50 rounded-2xl p-3 border border-border/50 text-start"><p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Montant Total</p><p className="text-lg font-bold text-text-primary leading-none">{order.montantTotal} <span className="text-xs opacity-60">DH</span></p></div>
          <div className="bg-background/50 rounded-2xl p-3 border border-border/50 text-start"><p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Date Prête</p><div className="flex items-center gap-1.5 text-text-primary"><Clock size={12} className="text-primary-500" /><p className="text-xs font-bold">Aujourd'hui</p></div></div>
        </div>
        <div className="px-5 pb-5 flex gap-2.5">
          <div className="flex-1 flex gap-1.5"><button onClick={(e) => { e.stopPropagation(); handleItinerary('google'); }} className="flex-1 h-12 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-500/10 active:scale-95"><Navigation size={18} fill="white" className="rtl:rotate-180" />Maps</button><button onClick={(e) => { e.stopPropagation(); navigate(`/livreur/delivery/${order.id}`); }} className="w-12 h-12 bg-background hover:bg-border/50 text-primary-500 border border-border rounded-2xl flex items-center justify-center transition-all active:scale-95"><Eye size={20} /></button></div>
          <button onClick={(e) => { e.stopPropagation(); onPay(order); }} className="flex-1 h-12 bg-surface hover:bg-background text-text-primary border border-border rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"><CreditCard size={18} />Payer</button>
          <button onClick={(e) => { e.stopPropagation(); onCancel(order); }} className="w-12 h-12 rounded-xl bg-red-500/5 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 active:scale-95 shrink-0"><X size={22} /></button>
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
  const [successMessage, setSuccessMessage] = useState(''); const [travelMode, setTravelMode] = useState('driving-car'); const [livreurPosition, setLivreurPosition] = useState(null); const watchIdRef = useRef(null);

  useEffect(() => {
    if ("geolocation" in navigator) { watchIdRef.current = navigator.geolocation.watchPosition((p) => setLivreurPosition({ lat: p.coords.latitude, lng: p.coords.longitude }), () => {}, { enableHighAccuracy: true }); }
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
    <div className="max-w-5xl mx-auto space-y-6 pb-32 animate-fade-in px-4">
      <style>{leafletStyles}</style>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 text-start mt-2">
        <div><h1 className="text-2xl font-bold text-text-primary tracking-tight">{t('driver.ready_delivery.title')}</h1><p className="text-sm font-medium text-text-secondary mt-1">{t('driver.ready_delivery.subtitle')}</p></div>
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-sm shrink-0"><ShoppingBag className="text-primary-500" size={18} /><p className="text-sm font-bold text-primary-600 dark:text-primary-500 tracking-wide leading-none">{t('driver.ready_delivery.orders_count', { count: orders.length })}</p></div>
      </div>
      <div className="flex bg-background border border-border/60 p-1 rounded-xl w-fit">
        <button onClick={() => { setTravelMode('driving-car'); optimizeRoute('driving-car'); }} className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${travelMode === 'driving-car' ? 'bg-surface text-primary-600 shadow-sm border border-border/40' : 'text-text-secondary hover:text-text-primary'}`}>🚗 {t('driver.ready_delivery.travel_mode.driving')}</button>
        <button onClick={() => { setTravelMode('foot-walking'); optimizeRoute('foot-walking'); }} className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${travelMode === 'foot-walking' ? 'bg-surface text-primary-600 shadow-sm border border-border/40' : 'text-text-secondary hover:text-text-primary'}`}>🚶 {t('driver.ready_delivery.travel_mode.foot')}</button>
      </div>
      <div className="relative group bg-surface rounded-3xl overflow-hidden border border-border/60 shadow-xl">
        <div className="h-64 sm:h-80 w-full relative z-0">
          <MapContainer center={[33.5731, -7.5898]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }} scrollWheelZoom={false}>
            <TileLayer url={`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${import.meta.env.VITE_MAPTILER_KEY}`} maxZoom={22} />
            {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: '#F97316', weight: 4, opacity: 0.8 }} />}
            {livreurPosition && <Marker position={[livreurPosition.lat, livreurPosition.lng]} icon={livreurIcon} />}
            <MapController markers={mapMarkers} selectedOrderId={selectedOrderId} livreurPosition={livreurPosition} forceFit={forceFit} />
            {mapMarkers.map((marker, idx) => (<Marker key={idx} position={[marker.lat, marker.lng]} icon={createNumberedIcon(marker.stopNumber, selectedOrderId === marker.orderId)}><Popup>Stop #{marker.stopNumber}</Popup></Marker>))}
          </MapContainer>
        </div>
        <button onClick={() => setForceFit(prev => prev + 1)} className="absolute top-4 right-4 z-[10] w-10 h-10 bg-surface/90 backdrop-blur-md border border-border rounded-xl shadow-lg flex items-center justify-center text-text-primary hover:text-primary-500 transition-all active:scale-90" title="Recentrer la carte"><Target size={20} /></button>
        <div className="absolute bottom-4 left-4 right-4 z-[10] bg-surface/90 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-500">
          <div className="min-w-0"><div className="flex items-center gap-2 mb-1 text-start"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><h4 className="font-bold text-xs text-text-primary uppercase tracking-wider">{t('driver.ready_delivery.actions.launch')}</h4></div><p className="text-text-secondary text-[11px] font-medium truncate text-start">{optimized ? `${totalDistance} KM • ~${totalDuration} MIN` : t('driver.ready_delivery.subtitle')}</p></div>
          <div className="flex gap-2"><button onClick={() => optimizeRoute(travelMode)} className="p-2.5 bg-background border border-border rounded-xl text-text-primary hover:text-primary-500 transition-colors shadow-sm"><RotateCcw size={18} className={isOptimizing ? 'animate-spin' : ''} /></button><button onClick={() => { const list = optimized ? optimizedOrders.filter(o => o.client?.addresses?.[0]?.latitude) : orders.filter(o => o.client?.addresses?.[0]?.latitude); if (!list.length) return; const url = `https://www.google.com/maps/dir/${livreurPosition ? livreurPosition.lat+','+livreurPosition.lng : ''}/${list.map(o => o.client.addresses[0].latitude+','+o.client.addresses[0].longitude).join('/')}`; window.open(url, '_blank'); }} className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2"><ExternalLink size={16} /> Google Maps</button></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-start">
        {displayOrders.length > 0 ? displayOrders.map(order => (<DeliveryCard key={order.id} order={order} onPay={(o) => setPaymentModal({ isOpen: true, order: o })} onCancel={(o) => { setOrderToCancel(o); setCancelModalOpen(true); }} onShowGallery={(imgs, i) => { setLightboxImages(imgs); setLightboxIndex(i); setLightboxOpen(true); }} isOptimized={optimized} isSelected={selectedOrderId === order.id} onSelect={(id) => { setSelectedOrderId(id === selectedOrderId ? null : id); if (id !== selectedOrderId) { const mapEl = document.querySelector('.leaflet-container'); mapEl?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }} navigate={navigate} />)) : (<div className="col-span-full py-20 flex flex-col items-center justify-center bg-surface rounded-2xl border-2 border-dashed border-border/40"><div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-5 shadow-inner border border-border/50"><Navigation size={32} className="text-text-muted opacity-25" /></div><h3 className="text-lg font-bold text-text-primary tracking-tight">{t('driver.ready_delivery.empty.title')}</h3><p className="text-sm font-medium text-text-muted mt-2 text-center px-8">{t('driver.ready_delivery.empty.desc')}</p></div>)}
      </div>
      <PaymentModal isOpen={paymentModal.isOpen} order={paymentModal.order} paymentTypes={paymentTypes} loading={loading.payment} onClose={() => setPaymentModal({ isOpen: false, order: null })} onConfirm={handleConfirmPayment} />
      {cancelModalOpen && orderToCancel && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300"><div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCancelModalOpen(false)}></div><div className="relative bg-surface rounded-2xl shadow-modal max-w-sm w-full p-8 animate-in zoom-in-95 duration-300 border border-border/60"><div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6"><AlertCircle size={28} className="text-red-500" /></div><h3 className="text-lg font-bold text-text-primary text-center mb-2 tracking-tight">{t('driver.ready_delivery.cancel_modal.title')}</h3><p className="text-xs text-text-muted text-center mb-6 font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-500">#{orderToCancel.numeroCommande || orderToCancel.id}</p><p className="text-sm text-text-secondary text-center mb-8 leading-relaxed">{t('driver.ready_delivery.cancel_modal.question')}</p><div className="flex gap-3"><button className="flex-1 bg-background hover:bg-border/50 text-text-primary rounded-xl py-3.5 text-xs font-bold transition-all border border-border" onClick={() => setCancelModalOpen(false)}>{t('driver.ready_delivery.cancel_modal.keep')}</button><button className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-3.5 text-xs font-bold transition-all shadow-lg shadow-red-500/10 disabled:opacity-50 flex items-center justify-center gap-2" onClick={handleCancelConfirm} disabled={cancelLoading}>{cancelLoading ? <Loader2 className="animate-spin" size={16} /> : t('driver.ready_delivery.cancel_modal.confirm')}</button></div></div></div>)}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && setLightboxOpen(false)}>
          <div className="absolute top-safe pt-6 px-6 w-full flex justify-between items-center z-[210]">
            <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-white text-xs font-bold">{lightboxIndex + 1} / {lightboxImages.length}</div>
            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center transition-all active:scale-90 border border-white/10" onClick={() => setLightboxOpen(false)}><X className="w-6 h-6 text-white" /></button>
          </div>
          <div className="relative flex items-center justify-center w-full h-full px-4">
            {lightboxIndex > 0 && (<button className="absolute left-4 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all z-[210]" onClick={() => setLightboxIndex(i => i - 1)}><ChevronLeft className="w-8 h-8 text-white" /></button>)}
            <div className="max-w-full max-h-[80vh] flex items-center justify-center"><img src={lightboxImages[lightboxIndex]} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500" alt="zoom" /></div>
            {lightboxIndex < lightboxImages.length - 1 && (<button className="absolute right-4 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all z-[210]" onClick={() => setLightboxIndex(i => i + 1)}><ChevronRight className="w-8 h-8 text-white" /></button>)}
          </div>
        </div>
      )}
    </div>
  );
}
