import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, MapPin, Phone, CreditCard, Banknote,
  FileText, Loader2, Package,
  Map as MapIcon, Hash, Calendar,
  User, Wallet, ArrowRight, XCircle, UserX, Navigation
} from 'lucide-react';
import { confirmPayment, fetchReadyForDelivery, fetchPaymentTypes, cancelDelivery } from '../../store/livreur/livreurThunk';
import { useTranslation } from 'react-i18next';
import { selectReadyForDelivery, selectLoading, selectPaymentTypes } from '../../store/livreur/livreurSelectors';

import { printReceipt } from '../../utils/printReceipt';

import ConfirmModal from '../../components/ui/ConfirmModal';

export default function DeliveryDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const orders = useSelector(selectReadyForDelivery);
  const loading = useSelector(selectLoading);
  const paymentTypes = useSelector(selectPaymentTypes);

  const order = useMemo(() => orders.find(o => o.id === parseInt(id)), [orders, id]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModal, setCancelModal] = useState({ isOpen: false, type: 'cancelled' }); // type: cancelled, absent

  useEffect(() => {
    if (!orders.length) {
      dispatch(fetchReadyForDelivery());
    }
    dispatch(fetchPaymentTypes());
  }, [dispatch, orders.length]);

  useEffect(() => {
    if (paymentTypes?.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentTypes[0].id);
    }
  }, [paymentTypes, paymentMethod]);

  const handleRecordPayment = async () => {
    if (!paymentMethod) return toast.warning(t('driver.delivery_details.toasts.choose_method'));
    try {
      await dispatch(confirmPayment({ orderId: order.id, data: { modePaiement: paymentMethod } })).unwrap();

      const ptLabel = paymentTypes.find(t => t.id === paymentMethod)?.label || 'Paiement';
      printReceipt(order, ptLabel);

      toast.success(t('driver.delivery_details.toasts.success'));
      navigate('/livreur/delivery');
    } catch (err) {
      toast.error(err || t('driver.delivery_details.toasts.error'));
    }
  };

  const handleCancelConfirm = async () => {
    setIsCancelling(true);
    try {
      await dispatch(cancelDelivery(order.id)).unwrap();
      toast.success(t('driver.ready_delivery.toasts.cancel_success'));
      setCancelModal({ isOpen: false, type: 'cancelled' });
      navigate('/livreur/delivery');
    } catch (err) {
      toast.error(err || t('driver.ready_delivery.toasts.cancel_error'));
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading?.readyForDelivery && !order) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
        <Loader2 size={40} className="text-primary-500 animate-spin" />
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">{t('driver.delivery_details.loading')}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-background flex items-center justify-center mb-6 shadow-sm border border-border">
          <Package size={32} className="text-text-muted opacity-30" />
        </div>
        <h3 className="text-xl font-bold text-text-primary tracking-tight mb-2">{t('driver.delivery_details.not_found.title')}</h3>
        <p className="text-sm text-text-secondary mb-8 max-w-xs">{t('driver.delivery_details.not_found.desc')}</p>
        <button
          onClick={() => navigate('/livreur/delivery')}
          className="bg-primary-600 text-white rounded-xl px-8 py-3.5 text-sm font-bold shadow-lg shadow-primary-600/10 active:scale-95 transition-all"
        >
          {t('driver.delivery_details.not_found.back_btn')}
        </button>
      </div>
    );
  }

  const baseUrl = "http://localhost:8080";

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 px-4 md:px-0 text-start">

      {/* HEADER & BACK */}
      <div className="flex flex-col gap-4 mt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary transition-all active:scale-95 shadow-sm self-start"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" /> {t('driver.delivery_details.back_list')}
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">
            {t('driver.delivery_details.title')}
          </h1>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full flex items-center gap-2.5 self-start sm:self-center border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <span className="text-[10px] font-black uppercase tracking-widest">{t('driver.delivery_details.ready_badge')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* LEFT COLUMN: ORDER INFO */}
        <div className="lg:col-span-3 space-y-8">
          {/* MAIN INFO CARD */}
          <div className="bg-surface rounded-[2rem] shadow-card border border-border/50 overflow-hidden group">
            <div className="bg-background/30 p-6 md:p-10 border-b border-border/50 flex flex-col md:flex-row justify-between items-start gap-6 relative">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Hash size={120} className="text-primary-500" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <Hash size={14} className="text-primary-500" />
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('driver.delivery_details.order_number')}</span>
                </div>
                <p className="text-4xl font-black text-text-primary tracking-tighter">#{order.numeroCommande}</p>
              </div>
              <div className="md:text-end relative z-10">
                <div className="flex items-center md:justify-end gap-2 mb-2 opacity-60">
                  <Calendar size={14} className="text-primary-500" />
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('driver.delivery_details.ready_date')}</span>
                </div>
                <p className="text-sm font-black text-text-primary uppercase tracking-tight">{t('driver.delivery_details.today')} • {new Date(order.dateCreation).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            <div className="p-6 md:p-10 space-y-8">
              <div className="flex items-start gap-5 p-6 rounded-3xl bg-primary-500/[0.03] border border-primary-500/10 transition-all hover:bg-primary-500/[0.05]">
                <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-primary-500/10 shrink-0">
                  <User size={24} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-primary-400 uppercase tracking-[0.2em] mb-1.5">{t('driver.delivery_details.recipient')}</p>
                  <h3 className="text-xl font-black text-text-primary tracking-tight">{order.client?.nom || order.client?.name}</h3>
                  <div className="flex flex-wrap gap-6 mt-3">
                    <a href={`tel:${order.client?.phones?.[0]?.phoneNumber || order.client?.telephone}`} className="text-xs font-black text-primary-600 flex items-center gap-2 hover:text-primary-700 transition-colors uppercase tracking-tight">
                      <Phone size={14} strokeWidth={3} className="text-primary-500 rtl:rotate-180" /> {order.client?.phones?.[0]?.phoneNumber || order.client?.telephone || '—'}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-5 p-6 rounded-3xl bg-emerald-500/[0.03] border border-emerald-500/10 transition-all hover:bg-emerald-500/[0.05]">
                <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-500/10 shrink-0">
                  <MapPin size={22} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1.5">{t('driver.delivery_details.address')}</p>
                  <p className="text-sm font-black text-text-primary leading-relaxed uppercase tracking-tight italic opacity-80">{order.client?.addresses?.[0]?.address || t('driver.delivery_details.no_address')}</p>
                  <button
                    onClick={() => {
                      const lat = order.client?.addresses?.[0]?.latitude;
                      const lng = order.client?.addresses?.[0]?.longitude;
                      if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                      else window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.client?.addresses?.[0]?.address || '')}`, '_blank');
                    }}
                    className="flex items-center gap-2 mt-4 text-[9px] font-black text-emerald-700 hover:text-emerald-800 transition-colors uppercase tracking-widest"
                  >
                    {t('driver.delivery_details.directions')} <Navigation size={14} strokeWidth={3} className="rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ARTICULES LIST */}
          <div className="bg-surface rounded-[2rem] shadow-card border border-border/50 p-6 md:p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-text-primary border border-border/50 shadow-sm">
                  <Package size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">{t('driver.delivery_details.package_items')}</h3>
              </div>
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-background px-3 py-1 rounded-lg border border-border/50">{order.commandeTapis?.length || 0} {t('driver.pro_ui.items_count')}</span>
            </div>

            <div className="divide-y divide-border/30">
              {order.commandeTapis?.map((item, idx) => {
                const photo = item.tapis?.imageUrls?.[0] || item.tapis?.imageUrl;
                const fullPhotoUrl = photo ? (photo.startsWith('http') ? photo : `${baseUrl}${photo}`) : null;

                return (
                  <div key={idx} className="py-5 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-background flex items-center justify-center overflow-hidden border border-border/50 group-hover:border-primary-500/30 transition-all shrink-0 shadow-sm">
                        {fullPhotoUrl ? (
                          <img src={fullPhotoUrl} alt={item.tapis?.nom} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <Package size={24} className="text-text-muted opacity-20" />
                        )}
                      </div>
                      <div className="text-start">
                        <p className="text-sm font-black text-text-primary group-hover:text-primary-600 transition-colors tracking-tight leading-tight">{item.tapis?.nom}</p>
                        <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest">
                          {item.quantite} Unités • {item.prixUnitaire.toFixed(0)} DH/U
                          {item.largeur && ` • ${item.largeur}x${item.hauteur}m`}
                        </p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-black text-text-primary tracking-tight">{(item.quantite * item.prixUnitaire).toLocaleString()} <span className="text-[9px] opacity-40">DH</span></p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-8 mt-4 border-t-2 border-dashed border-border/50 flex items-center justify-between">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('driver.delivery_details.total_order')}</p>
              <div className="text-end">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-primary-600 tracking-tighter">{order.montantTotal.toLocaleString()}</span>
                  <span className="text-[10px] font-black text-primary-600/60 uppercase">DH</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECONDARY ACTIONS */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <button
              onClick={() => setCancelModal({ isOpen: true, type: 'absent' })}
              disabled={isCancelling}
              className="bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 text-orange-700 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 transition-all border border-orange-100 dark:border-orange-500/20 active:scale-95 group"
            >
              <div className="w-12 h-12 bg-surface rounded-[1.25rem] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform border border-border/50">
                <UserX size={24} className="text-orange-600" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{t('driver.pro_ui.client_absent')}</span>
            </button>
            <button
              onClick={() => setCancelModal({ isOpen: true, type: 'cancelled' })}
              disabled={isCancelling}
              className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-700 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 transition-all border border-red-100 dark:border-red-100/20 active:scale-95 group"
            >
              <div className="w-12 h-12 bg-surface rounded-[1.25rem] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform border border-border/50">
                <XCircle size={24} className="text-red-600" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{t('driver.pro_ui.cancel_mission')}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION / PAYMENT */}
        <div className="lg:col-span-2 space-y-8">

          <div className="bg-surface rounded-[2.5rem] shadow-2xl border-2 border-primary-500 overflow-hidden sticky top-24 group">
            <div className="bg-primary-600 p-8 md:p-10 text-white relative">
              <div className="absolute top-0 end-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <Wallet size={100} strokeWidth={1} />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-white/80">
                <CreditCard size={16} strokeWidth={3} /> {t('driver.delivery_details.payment_summary')}
              </h3>
              <div className="flex items-baseline gap-2 text-white">
                <span className="text-5xl font-black tracking-tighter">{order.montantTotal.toLocaleString()}</span>
                <span className="text-sm font-black uppercase opacity-60">DH</span>
              </div>
            </div>

            <div className="p-8 md:p-10 space-y-8 text-start">
              <div className="space-y-5">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-1">{t('driver.delivery_details.payment_method_label')}</p>
                <div className="grid grid-cols-1 gap-3">
                  {paymentTypes?.length > 0 ? (
                    paymentTypes.map((opt, pidx) => (
                      <button
                        key={opt.id || pidx}
                        type="button"
                        onClick={() => setPaymentMethod(opt.id)}
                        className={`flex items-center justify-between px-6 py-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${paymentMethod === opt.id
                            ? 'bg-primary-500/5 border-primary-500 shadow-md'
                            : 'bg-background border-transparent hover:border-border/50'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === opt.id ? 'border-primary-500 bg-primary-50 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'border-border/60 bg-background'
                            }`}>
                            {paymentMethod === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className={`text-xs font-black uppercase tracking-widest transition-colors ${paymentMethod === opt.id ? 'text-text-primary' : 'text-text-muted'
                            }`}>{opt.label}</span>
                        </div>
                        {opt.code === 'especes' || opt.label?.toLowerCase().includes('esp') ? <Banknote size={20} strokeWidth={2.5} className={paymentMethod === opt.id ? 'text-primary-500' : 'text-text-muted/40'} /> :
                          opt.code === 'carte' || opt.label?.toLowerCase().includes('cart') ? <CreditCard size={20} strokeWidth={2.5} className={paymentMethod === opt.id ? 'text-primary-500' : 'text-text-muted/40'} /> :
                            <FileText size={20} strokeWidth={2.5} className={paymentMethod === opt.id ? 'text-primary-500' : 'text-text-muted/40'} />}
                      </button>
                    ))
                  ) : (
                    <div className="py-6 px-8 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center border border-red-100">
                      {t('driver.delivery_details.payment_unavailable')}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleRecordPayment}
                disabled={loading?.confirmPayment}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-2xl py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group/btn"
              >
                {loading?.confirmPayment ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {t('driver.delivery_details.validate_btn')}
                    <ArrowRight size={20} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform rtl:rotate-180" />
                  </>
                )}
              </button>

              <p className="text-[9px] text-center font-black text-text-muted px-6 leading-relaxed uppercase tracking-widest opacity-40">
                {t('driver.delivery_details.warning_note')}
              </p>
            </div>
          </div>

        </div>
      </div>

      <ConfirmModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ ...cancelModal, isOpen: false })}
        onConfirm={handleCancelConfirm}
        loading={isCancelling}
        title={cancelModal.type === 'absent' ? t('driver.pro_ui.client_absent') : t('driver.pro_ui.cancel_mission')}
        message={t('driver.ready_delivery.cancel_modal.question')}
        type="danger"
      />

    </div>
  );
}
