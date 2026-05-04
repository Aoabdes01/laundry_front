import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Package, Phone, Navigation, CreditCard,
  Target, RotateCcw, ExternalLink, X, CheckCircle2,
  AlertCircle, ChevronLeft, ChevronRight, ShoppingBag,
  Hash, Clock, Eye, Banknote, Loader2, Maximize2, Minimize2
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
  html: `<div class="w-8 h-8 bg-[var(--primary)] rounded-full border-4 border-white shadow-[var(--shadow-teal)] flex items-center justify-center animate-pulse"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
  className: 'custom-div-icon', iconSize: [32, 32], iconAnchor: [16, 16]
});

const createNumberedIcon = (number, isSelected) => L.divIcon({
  html: `<div class="relative flex items-center justify-center">
    <div class="w-8 h-8 ${isSelected ? 'bg-[var(--primary-dark)] scale-125' : 'bg-[var(--primary)]'} rounded-xl border-2 border-white shadow-[var(--shadow-md)] flex items-center justify-center text-white text-xs font-bold transition-all duration-300">
      ${number || ''}
    </div>
    <div class="absolute -bottom-1 w-2 h-2 ${isSelected ? 'bg-[var(--primary-dark)]' : 'bg-[var(--primary)]'} rotate-45 border-b-2 border-r-2 border-white"></div>
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

const MapController = ({ markers, selectedOrderId, livreurPosition, forceFit, isMapExpanded }) => {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [isMapExpanded, map]);

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
  useEffect(() => { /* No-op */ }, [isOpen, order]);
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* OUTER CONTAINER: Holds the shape and shadow */}
      <div className="relative bg-surface w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2rem] shadow-modal overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 border-t sm:border border-border/50 flex flex-col">
        
        {/* MOBILE HANDLE: Fixed at top */}
        <div className="w-12 h-1.5 bg-border/40 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0"></div>

        {/* SCROLLABLE CONTENT: Scrollbar is now inside, away from outer edges */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-10 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-primary-100/50">
            <CreditCard className="text-primary-600" size={32} sm:size={36} strokeWidth={2.5} />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight mb-2 leading-tight">
            {t('driver.ready_delivery.payment_modal.title')}
          </h3>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-8 opacity-60">
            {t('driver.pro_ui.finalizing_transaction')}
          </p>

          <div className="bg-background/50 rounded-2xl p-5 sm:p-6 mb-8 border border-border/50 flex justify-between items-center text-start shadow-sm">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1 opacity-60">{t('driver.ready_delivery.payment_modal.order_prefix')}</p>
              <span className="text-base sm:text-lg font-black text-text-primary tracking-tighter block truncate">#{order?.numeroCommande}</span>
            </div>
            <div className="text-end shrink-0 ps-4">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1 opacity-60">{t('driver.pro_ui.total_to_collect')}</p>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-2xl sm:text-3xl font-black text-primary-600 tracking-tighter leading-none">{order?.montantTotal}</span>
                <span className="text-[10px] font-black text-primary-600/60 uppercase">DH</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
            {paymentTypes && paymentTypes.map((type) => (
              <button 
                key={type.id} 
                onClick={() => onConfirm(type.id)}
                disabled={loading}
                className="flex flex-col items-center justify-center gap-3 p-5 sm:p-6 rounded-2xl border-2 border-border/50 bg-background hover:border-primary-500 hover:bg-primary-500/5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 group shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-surface shadow-sm border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {type.code === 'especes' ? <Banknote size={24} className="text-primary-500" /> : <CreditCard size={24} className="text-primary-500" />}
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] text-text-primary">{type.label}</span>
              </button>
            ))}
          </div>

          <div className="max-w-xs mx-auto">
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full bg-background/50 border border-border/50 text-text-muted rounded-xl py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 hover:bg-surface hover:text-text-primary"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const DeliveryCard = ({ order, onPay, onCancel, onShowGallery, isOptimized, isSelected, onSelect, navigate }) => {
  const { t } = useTranslation();
  const baseUrl = import.meta.env.VITE_API_URL;
  const allPhotos = useMemo(() => {
    const photos = [];
    const tapisList = order.commandeTapis || [];
    tapisList.forEach(t => {
      const imgs = t.tapisImages || t.images || t.imageUrls || [];
      if (Array.isArray(imgs)) { 
        imgs.forEach(img => { 
          const url = img.imageUrl || img.url || img.path || (typeof img === 'string' ? img : null); 
          if (url) photos.push(url.startsWith('http') ? url : `${baseUrl}${url}`); 
        }); 
      } else if (t.imageUrl) {
        photos.push(t.imageUrl.startsWith('http') ? t.imageUrl : `${baseUrl}${t.imageUrl}`);
      }
    });
    return photos;
  }, [order, baseUrl]);

  const mainPhoto = allPhotos[0];
  const addressObj = order.client?.addresses?.[0];
  const lat = addressObj?.latitude; 
  const lng = addressObj?.longitude; 
  const address = addressObj?.address;

  const handleItinerary = (provider) => {
    if (lat && lng) { 
      if (provider === 'waze') window.open(`https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank'); 
      else window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank'); 
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank'); 
    } else {
      toast.warning(t('driver.ready_delivery.card.no_address_error'));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'À LIVRER': 'bg-[#EFF6FF] border-[#BFDBFE] text-[#3B82F6]',
      'EN COURS': 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]',
      'LIVRÉ': 'bg-[#ECFDF5] border-[#A7F3D0] text-[#10B981]',
      'ANNULÉ': 'bg-[#FEF2F2] border-[#FECACA] text-[#EF4444]',
      'DISPONIBLE': 'bg-[#ECFDF5] border-[#A7F3D0] text-[#10B981]'
    };
    const label = status === 'prete' ? 'À LIVRER' : status.toUpperCase();
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.06em] border ${styles[label] || styles['À LIVRER']}`}>
        {label}
      </span>
    );
  };

  return (
    <div
      className={`bg-white rounded-[20px] shadow-[var(--shadow-md)] p-5 border border-[rgba(0,0,0,0.06)] active:scale-[0.98] transition-all text-start relative overflow-hidden mb-3 ${isSelected ? 'ring-2 ring-[var(--primary)] ring-opacity-50' : ''}`}
      onClick={() => onSelect(order.id)}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          #{order.numeroCommande}
        </span>
        {getStatusBadge(order.status)}
      </div>

      <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)] mb-4">
        {order.client?.nom || order.client?.name || 'Client'}
      </h3>

      <div className="flex gap-4 mb-4">
        <div 
          className="w-16 h-16 rounded-[12px] bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] shrink-0 overflow-hidden flex items-center justify-center relative"
          onClick={(e) => { e.stopPropagation(); onShowGallery(allPhotos, 0); }}
        >
          {mainPhoto ? (
            <img src={mainPhoto} className="w-full h-full object-cover" alt="preview" />
          ) : (
            <span className="text-2xl">🧺</span>
          )}
          <div className="absolute top-0 right-0 bg-[var(--text)] text-white text-[10px] font-bold px-1.5 rounded-bl-lg">
            {order.commandeTapis?.length || 0}
          </div>
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
          <div className="flex items-start gap-2 text-[var(--text-secondary)]">
            <MapPin size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
            <p className="font-['Inter'] text-[13px] font-medium leading-tight line-clamp-2">
              {address || t('driver.ready_delivery.card.no_address')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-[#10B981] shrink-0" />
            <a href={`tel:${order.client?.phones?.[0]?.phoneNumber}`} onClick={(e) => e.stopPropagation()} className="font-['Inter'] text-[14px] font-semibold text-[var(--text)]">
              {order.client?.phones?.[0]?.phoneNumber || '—'}
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[var(--bg)] rounded-[10px] border border-[rgba(0,0,0,0.06)] p-2.5">
          <p className="font-['Inter'] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">TOTAL</p>
          <div className="flex items-baseline gap-1">
            <span className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)]">{order.montantTotal}</span>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">DH</span>
          </div>
        </div>
        <div className="bg-[#ECFDF5] rounded-[10px] border border-[#A7F3D0] p-2.5">
          <p className="font-['Inter'] text-[10px] font-semibold text-[#10B981] uppercase tracking-wider mb-1">STATUS</p>
          <div className="flex items-center gap-1.5 text-[#10B981]">
            <Clock size={14} />
            <span className="font-['Plus_Jakarta_Sans'] text-[12px] font-bold uppercase tracking-tighter">DISPONIBLE</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); handleItinerary('google'); }}
          className="w-12 h-12 rounded-[14px] bg-[var(--primary)] text-white flex items-center justify-center shadow-[var(--shadow-teal)] active:scale-95 transition-all"
        >
          <Navigation size={20} fill="currentColor" className="rtl:rotate-180" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/livreur/delivery/${order.id}`); }}
          className="w-12 h-12 rounded-[14px] bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] text-[var(--text-secondary)] flex items-center justify-center active:scale-95 transition-all"
        >
          <Eye size={20} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onPay(order); }}
          className="flex-1 h-12 rounded-[14px] bg-white border-[1.5px] border-[var(--primary)] text-[var(--primary)] font-['Inter'] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <CreditCard size={18} />
          {t('driver.pro_ui.collect_payment').toUpperCase()}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onCancel(order); }}
          className="w-12 h-12 rounded-[14px] bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] flex items-center justify-center active:scale-95 transition-all"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReadyForDelivery() {
  const { t } = useTranslation(); 
  const dispatch = useDispatch(); 
  const navigate = useNavigate();
  const ordersRaw = useSelector(selectReadyForDelivery); 
  const paymentTypes = useSelector(selectPaymentTypes); 
  const loading = useSelector(selectLoading);
  
  const [localGpsFixes] = useState(() => { 
    const saved = localStorage.getItem('livreur_gps_fixes'); 
    return saved ? JSON.parse(saved) : {}; 
  });

  const orders = useMemo(() => ordersRaw.map(order => { 
    const fix = localGpsFixes[order.id]; 
    if (fix && order.client?.addresses?.[0]) {
      return { 
        ...order, 
        client: { 
          ...order.client, 
          addresses: [{ ...order.client.addresses[0], latitude: fix.lat, longitude: fix.lng }] 
        } 
      }; 
    }
    return order; 
  }), [ordersRaw, localGpsFixes]);

  const [paymentModal, setPaymentModal] = useState({ isOpen: false, order: null });
  const [lightboxOpen, setLightboxOpen] = useState(false); 
  const [lightboxImages, setLightboxImages] = useState([]); 
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [optimizedOrders, setOptimizedOrders] = useState([]); 
  const [routeCoords, setRouteCoords] = useState([]); 
  const [isOptimizing, setIsOptimizing] = useState(false); 
  const [optimizationError, setOptimizationError] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0); 
  const [totalDuration, setTotalDuration] = useState(0); 
  const [optimized, setOptimized] = useState(false); 
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [forceFit, setForceFit] = useState(0);
  const [cancelModalOpen, setCancelModalOpen] = useState(false); 
  const [orderToCancel, setOrderToCancel] = useState(null); 
  const [cancelLoading, setCancelLoading] = useState(false);
  const [travelMode, setTravelMode] = useState('driving-car'); 
  const [livreurPosition, setLivreurPosition] = useState(null); 
  const watchIdRef = useRef(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) { 
      watchIdRef.current = navigator.geolocation.watchPosition(
        (p) => setLivreurPosition({ lat: p.coords.latitude, lng: p.coords.longitude }), 
        () => { }, 
        { enableHighAccuracy: true }
      ); 
    }
    return () => { 
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current); 
      }
    };
  }, []);

  useEffect(() => { 
    dispatch(fetchReadyForDelivery()); 
    dispatch(fetchPaymentTypes()); 
  }, [dispatch]);

  const optimizeRoute = async (mode = travelMode) => {
    const ordersWithGPS = orders.filter(o => o.client?.addresses?.[0]?.latitude && o.client?.addresses?.[0]?.longitude);
    if (ordersWithGPS.length < 1) {
      setOptimizationError(t('driver.ready_delivery.status.min_gps'));
      return;
    }
    setIsOptimizing(true); 
    setOptimizationError(null);
    try {
      const apiKey = import.meta.env.VITE_ORS_API_KEY;
      const jobs = ordersWithGPS.map((o, idx) => ({ 
        id: idx, 
        location: [parseFloat(o.client.addresses[0].longitude), parseFloat(o.client.addresses[0].latitude)], 
        service: 120 
      }));
      const vehicles = [{ 
        id: 0, 
        profile: mode, 
        start: livreurPosition ? [livreurPosition.lng, livreurPosition.lat] : jobs[0].location 
      }];
      
      const res = await fetch('https://api.openrouteservice.org/optimization', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': apiKey }, 
        body: JSON.stringify({ jobs, vehicles, options: { g: true } }) 
      });
      
      if (!res.ok) throw new Error(res.status === 429 ? 'Quota dépassé' : 'Erreur API');
      const data = await res.json();
      if (data.code !== 0) throw new Error(data.error || 'Erreur optimisation');
      
      const route = data.routes[0];
      const steps = route.steps;
      const reordered = steps.filter(s => s.type === 'job').map((s, idx) => { 
        const originalOrder = ordersWithGPS[s.id]; 
        return { 
          ...originalOrder, 
          _stopNumber: idx + 1, 
          _legDistance: (s.distance / 1000).toFixed(1), 
          _legDuration: Math.round(s.duration / 60) 
        }; 
      });
      
      const ordersWithoutGPS = orders.filter(o => !o.client?.addresses?.[0]?.latitude);
      setOptimizedOrders([...reordered, ...ordersWithoutGPS]);
      setTotalDistance((route.distance / 1000).toFixed(1)); 
      setTotalDuration(Math.round(route.duration / 60));
      if (route.geometry) setRouteCoords(decodePolyline(route.geometry));
      setOptimized(true); 
      setForceFit(prev => prev + 1);
    } catch (err) { 
      console.error(err); 
      setOptimizationError(err.message); 
    } finally { 
      setIsOptimizing(false); 
    }
  };

  useEffect(() => { 
    if (orders.length >= 2 && !optimized) optimizeRoute(); 
  }, [orders.length]);

  const displayOrders = optimized ? optimizedOrders : orders;
  
  const mapMarkers = useMemo(() => {
    const source = optimized ? optimizedOrders : orders;
    return source
      .filter(o => o.client?.addresses?.[0]?.latitude)
      .map((o) => ({ 
        lat: parseFloat(o.client.addresses[0].latitude), 
        lng: parseFloat(o.client.addresses[0].longitude), 
        orderId: o.id, 
        stopNumber: optimized ? o._stopNumber : null 
      }));
  }, [displayOrders, optimized]);

  const handleConfirmPayment = async (methodId) => {
    if (!paymentModal.order) return;
    try {
      await dispatch(confirmPayment({ orderId: paymentModal.order.id, data: { modePaiement: methodId } })).unwrap();
      const paidOrder = paymentModal.order; 
      printReceipt(paidOrder, paymentTypes.find(t => t.id === methodId)?.label || 'Paiement');
      dispatch(removeOrderFromReady(paidOrder.id)); 
      setOptimizedOrders(prev => prev.filter(o => o.id !== paidOrder.id));
      toast.success(t('driver.ready_delivery.toasts.payment_success')); 
      setPaymentModal({ isOpen: false, order: null }); 
      dispatch(fetchReadyForDelivery());
    } catch (err) { 
      toast.error(err || t('driver.delivery_details.toasts.error')); 
    }
  };

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;
    setCancelLoading(true);
    try {
      await dispatch(cancelDelivery(orderToCancel.id)).unwrap();
      setOptimizedOrders(prev => prev.filter(o => o.id !== orderToCancel.id)); 
      setCancelModalOpen(false); 
      setOrderToCancel(null); 
      dispatch(fetchReadyForDelivery());
      toast.success(t('driver.ready_delivery.toasts.cancel_success'));
    } catch (e) { 
      toast.error(t('driver.ready_delivery.toasts.cancel_error')); 
    } finally { 
      setCancelLoading(false); 
    }
  };

  return (
    <div className="pb-24 animate-fade-in text-start">
      <style>{leafletStyles}</style>

      {/* PAGE HEADER */}
      <div className={`${isMapExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300 flex justify-between items-start mb-5`}>
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[22px] font-bold text-[var(--text)] tracking-tight">
            {t('driver.ready_delivery.title')}
          </h1>
          <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] mt-1">
            {t('driver.ready_delivery.subtitle')}
          </p>
        </div>
        <div className="bg-[var(--primary-surface)] border border-[rgba(13,115,119,0.15)] rounded-full px-4 py-2 flex items-center gap-2 shadow-sm shrink-0">
          <ShoppingBag className="text-[var(--primary)]" size={18} />
          <p className="font-['Inter'] text-[14px] font-semibold text-[var(--primary)] leading-none">
            {t('driver.ready_delivery.orders_count', { count: orders.length })}
          </p>
        </div>
      </div>

      {/* TRANSPORT SELECTOR */}
      <div className={`${isMapExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300 bg-white border border-[rgba(0,0,0,0.08)] p-1 rounded-[12px] flex w-fit shadow-[var(--shadow-sm)] mb-6`}>
        <button 
          onClick={() => { setTravelMode('driving-car'); optimizeRoute('driving-car'); }} 
          className={`px-5 py-2 rounded-[10px] text-[13px] transition-all duration-200 ${
            travelMode === 'driving-car' 
              ? 'bg-[var(--primary)] text-white font-bold shadow-[0_2px_8px_rgba(13,115,119,0.3)]' 
              : 'text-[var(--text-muted)] font-medium'
          }`}
        >
          🚗 {t('driver.ready_delivery.travel_mode.driving').toUpperCase()}
        </button>
        <button 
          onClick={() => { setTravelMode('foot-walking'); optimizeRoute('foot-walking'); }} 
          className={`px-5 py-2 rounded-[10px] text-[13px] transition-all duration-200 ${
            travelMode === 'foot-walking' 
              ? 'bg-[var(--primary)] text-white font-bold shadow-[0_2px_8px_rgba(13,115,119,0.3)]' 
              : 'text-[var(--text-muted)] font-medium'
          }`}
        >
          🚶 {t('driver.ready_delivery.travel_mode.foot').toUpperCase()}
        </button>
      </div>

      {/* MAP CONTAINER */}
      <div className={`transition-all duration-500 ${isMapExpanded ? 'fixed inset-0 z-[9999] bg-white' : 'bg-white rounded-[16px] overflow-hidden border border-[rgba(0,0,0,0.08)] shadow-[var(--shadow-md)] mb-6'}`}>
        <div className={`${isMapExpanded ? 'h-full w-full' : 'h-72'} relative z-0`}>
          <MapContainer center={[33.5731, -7.5898]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }} scrollWheelZoom={false}>
            <TileLayer url={`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${import.meta.env.VITE_MAPTILER_KEY}`} maxZoom={22} />
            {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: 'var(--primary)', weight: 4, opacity: 0.8 }} />}
            {livreurPosition && <Marker position={[livreurPosition.lat, livreurPosition.lng]} icon={livreurIcon} />}
            <MapController markers={mapMarkers} selectedOrderId={selectedOrderId} livreurPosition={livreurPosition} forceFit={forceFit} isMapExpanded={isMapExpanded} />
            {mapMarkers.map((marker, idx) => (
              <Marker key={idx} position={[marker.lat, marker.lng]} icon={createNumberedIcon(marker.stopNumber, selectedOrderId === marker.orderId)}>
                <Popup>{t('driver.pro_ui.stop_number')} #{marker.stopNumber}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className={`absolute top-4 right-4 z-[10] flex flex-col gap-2 ${isMapExpanded ? 'mt-[env(safe-area-inset-top)]' : ''}`}>
          <button 
            onClick={() => setForceFit(prev => prev + 1)} 
            className="w-11 h-11 bg-white border border-[rgba(0,0,0,0.1)] rounded-[12px] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--text-secondary)] active:scale-90 transition-all"
          >
            <Target size={22} />
          </button>
          <button 
            onClick={() => setIsMapExpanded(!isMapExpanded)} 
            className="w-11 h-11 bg-white border border-[rgba(0,0,0,0.1)] rounded-[12px] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--text-secondary)] active:scale-90 transition-all"
          >
            {isMapExpanded ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
          </button>
        </div>

        <div className={`absolute bottom-4 left-4 right-4 z-[10] bg-[rgba(255,255,255,0.92)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.6)] p-4 rounded-[14px] shadow-[var(--shadow-lg)] flex items-center justify-between gap-4 transition-all duration-500 ${isMapExpanded ? 'max-w-md mx-auto mb-[env(safe-area-inset-bottom)]' : ''}`}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <h4 className="font-bold text-[12px] text-[var(--text)] uppercase tracking-wider">{t('driver.ready_delivery.actions.launch')}</h4>
            </div>
            <p className="text-[var(--text-muted)] text-[12px] font-medium truncate">
              {optimized ? `${totalDistance} km • ${totalDuration} min` : t('driver.ready_delivery.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => optimizeRoute(travelMode)} 
              className="w-11 h-11 flex items-center justify-center bg-white border border-[rgba(0,0,0,0.1)] rounded-[12px] text-[var(--text-secondary)] active:scale-95 transition-all shadow-sm"
            >
              <RotateCcw size={18} className={isOptimizing ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => { const list = optimized ? optimizedOrders.filter(o => o.client?.addresses?.[0]?.latitude) : orders.filter(o => o.client?.addresses?.[0]?.latitude); if (!list.length) return; const url = `https://www.google.com/maps/dir/${livreurPosition ? livreurPosition.lat + ',' + livreurPosition.lng : ''}/${list.map(o => o.client.addresses[0].latitude + ',' + o.client.addresses[0].longitude).join('/')}`; window.open(url, '_blank'); }} 
              className="bg-[var(--primary)] text-white rounded-[12px] px-5 h-11 text-[13px] font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-[var(--shadow-teal)]"
            >
              <ExternalLink size={18} /> {t('common.google', 'GOOGLE')}
            </button>
          </div>
        </div>
      </div>

      {/* DELIVERY CARDS */}
      <div className={`${isMapExpanded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 space-y-3`}>
        {displayOrders.length > 0 ? displayOrders.map(order => (
          <DeliveryCard 
            key={order.id} 
            order={order} 
            onPay={(o) => setPaymentModal({ isOpen: true, order: o })} 
            onCancel={(o) => { setOrderToCancel(o); setCancelModalOpen(true); }} 
            onShowGallery={(imgs, i) => { setLightboxImages(imgs); setLightboxIndex(i); setLightboxOpen(true); }} 
            isOptimized={optimized} 
            isSelected={selectedOrderId === order.id} 
            onSelect={(id) => { 
              setSelectedOrderId(id === selectedOrderId ? null : id); 
              if (id !== selectedOrderId) { 
                const mapEl = document.querySelector('.leaflet-container'); 
                mapEl?.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
              } 
            }} 
            navigate={navigate} 
          />
        )) : (
          <div className="py-20 text-center opacity-40">
            <Navigation size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
            <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)]">{t('driver.ready_delivery.empty.title')}</h3>
          </div>
        )}
      </div>

      <PaymentModal 
        isOpen={paymentModal.isOpen} 
        order={paymentModal.order} 
        paymentTypes={paymentTypes} 
        loading={loading.payment} 
        onClose={() => setPaymentModal({ isOpen: false, order: null })} 
        onConfirm={handleConfirmPayment} 
      />

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

      {lightboxOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center animate-fade-in" onClick={(e) => e.target === e.currentTarget && setLightboxOpen(false)}>
          <div className="absolute top-0 left-0 right-0 pt-[env(safe-area-inset-top)] p-6 w-full flex justify-between items-center z-[210] backdrop-blur-md bg-black/20">
            <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest shadow-lg">{lightboxIndex + 1} / {lightboxImages.length} IMAGES</div>
            <button className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md hover:bg-red-500 flex items-center justify-center transition-all active:scale-90 border border-white/10 shadow-lg" onClick={() => setLightboxOpen(false)}>
              <X size={24} strokeWidth={3} className="text-white" />
            </button>
          </div>
          <div className="relative w-full h-full flex items-center md:items-start justify-center p-0">
            {lightboxIndex > 0 && (
              <button className="absolute left-4 z-[210] top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 shadow-2xl" onClick={() => setLightboxIndex(i => i - 1)}>
                <ChevronLeft className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={3} />
              </button>
            )}
            <div className="w-full h-full flex items-center md:items-start justify-center overflow-hidden p-4 md:p-12 md:pt-32">
              <img 
                src={lightboxImages[lightboxIndex]} 
                className="w-full h-full md:max-w-[80vw] md:max-h-[80vh] object-contain animate-in zoom-in-95 duration-500" 
                alt="zoom" 
              />
            </div>
            {lightboxIndex < lightboxImages.length - 1 && (
              <button className="absolute right-4 z-[210] top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center transition-all border border-white/10 shadow-2xl" onClick={() => setLightboxIndex(i => i + 1)}>
                <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={3} />
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
