import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, MapPin, Phone, CreditCard, Banknote,
  FileText, Loader2, Package, 
  Map as MapIcon, Hash, Calendar, 
  User, Wallet, ArrowRight, XCircle, UserX
} from 'lucide-react';
import { confirmPayment, fetchReadyForDelivery, fetchPaymentTypes, cancelDelivery } from '../../store/livreur/livreurThunk';
import { useTranslation } from 'react-i18next';
import { selectReadyForDelivery, selectLoading, selectPaymentTypes } from '../../store/livreur/livreurSelectors';

import { printReceipt } from '../../utils/printReceipt';

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

  const handleCancel = async (reason = 'cancelled') => {
    if (!window.confirm(t('driver.ready_delivery.cancel_modal.question'))) return;
    setIsCancelling(true);
    try {
      await dispatch(cancelDelivery(order.id)).unwrap();
      toast.success(t('driver.ready_delivery.toasts.cancel_success'));
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

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20 px-4">
      
      {/* HEADER & BACK */}
      <div className="flex flex-col gap-3 text-start mt-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-primary-600 transition-colors text-xs font-bold uppercase tracking-wide self-start"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" /> {t('driver.delivery_details.back_list')}
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
               {t('driver.delivery_details.title')}
            </h1>
            <div className="bg-teal-500/10 text-teal-700 dark:text-teal-500 px-3 py-1 rounded-full flex items-center gap-2 self-start sm:self-center border border-teal-500/20 shadow-sm">
               <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
               <span className="text-[11px] font-bold uppercase tracking-wider">{t('driver.delivery_details.ready_badge')}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: ORDER INFO */}
        <div className="lg:col-span-3 space-y-6">
            {/* MAIN INFO CARD */}
            <div className="bg-surface rounded-2xl shadow-card border border-border/60 overflow-hidden">
                <div className="bg-background/50 p-6 sm:p-8 border-b border-border/50 flex flex-col sm:flex-row justify-between items-start gap-4 text-start">
                   <div>
                      <div className="flex items-center gap-2 text-text-secondary font-bold text-[11px] uppercase tracking-wider mb-1">
                         <Hash size={13} strokeWidth={2.5} /> {t('driver.delivery_details.order_number')}
                      </div>
                      <p className="text-3xl font-bold text-text-primary tracking-tight">#{order.numeroCommande}</p>
                   </div>
                   <div className="sm:text-end">
                      <div className="flex items-center sm:justify-end gap-2 text-text-secondary font-bold text-[11px] uppercase tracking-wider mb-1">
                         <Calendar size={13} strokeWidth={2.5} /> {t('driver.delivery_details.ready_date')}
                      </div>
                      <p className="text-sm font-semibold text-text-primary">{t('driver.delivery_details.today')} • {new Date(order.dateCreation).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                   </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6 text-start">
                   <div className="flex items-start gap-4 p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
                      <div className="w-11 h-11 bg-surface rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-500 shadow-sm border border-border shrink-0">
                         <User size={20} />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[11px] font-bold text-primary-600 dark:text-primary-500 uppercase tracking-wider mb-1">{t('driver.delivery_details.recipient')}</p>
                         <h3 className="text-base font-bold text-text-primary">{order.client?.nom || order.client?.name}</h3>
                         <div className="flex flex-wrap gap-4 mt-2">
                            <a href={`tel:${order.client?.phones?.[0]?.phoneNumber || order.client?.telephone}`} className="text-xs font-semibold text-primary-600 dark:text-primary-500 flex items-center gap-1.5 hover:underline">
                               <Phone size={13} className="text-primary-500" /> {order.client?.phones?.[0]?.phoneNumber || order.client?.telephone || '—'}
                            </a>
                         </div>
                      </div>
                   </div>
 
                   <div className="flex items-start gap-4 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                      <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-500 shadow-sm border border-border shrink-0">
                         <MapPin size={18} />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[11px] font-bold text-teal-600 dark:text-teal-500 uppercase tracking-wider mb-1">{t('driver.delivery_details.address')}</p>
                         <p className="text-sm font-medium text-text-primary leading-snug">{order.client?.addresses?.[0]?.address || t('driver.delivery_details.no_address')}</p>
                         <button 
                           onClick={() => {
                             const lat = order.client?.addresses?.[0]?.latitude;
                             const lng = order.client?.addresses?.[0]?.longitude;
                             if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                             else window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.client?.addresses?.[0]?.address || '')}`, '_blank');
                           }}
                           className="flex items-center gap-1.5 mt-3 text-xs font-bold text-teal-700 dark:text-teal-500 hover:opacity-80 transition-opacity uppercase tracking-wide"
                         >
                            {t('driver.delivery_details.directions', 'Itinéraire')} <MapIcon size={13} strokeWidth={2.5} className="rtl:rotate-180" />
                         </button>
                      </div>
                   </div>
                </div>
            </div>

            {/* ARTICULES LIST */}
            <div className="bg-surface rounded-2xl shadow-card border border-border/60 p-6 sm:p-8 space-y-6 text-start">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-text-primary border border-border">
                     <Package size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary tracking-tight">{t('driver.delivery_details.package_items')}</h3>
               </div>

               <div className="divide-y divide-border/50">
                  {order.commandeTapis?.map((item, idx) => {
                    const photo = item.tapis?.imageUrls?.[0] || item.tapis?.imageUrl;
                    const fullPhotoUrl = photo ? (photo.startsWith('http') ? photo : `${baseUrl}${photo}`) : null;
                    
                    return (
                      <div key={idx} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-xl bg-background flex items-center justify-center overflow-hidden border border-border/60 group-hover:border-primary-200 transition-colors shrink-0 shadow-sm">
                              {fullPhotoUrl ? (
                                <img src={fullPhotoUrl} alt={item.tapis?.nom} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-text-muted">{idx + 1}</span>
                              )}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-text-primary group-hover:text-primary-600 transition-colors leading-tight">{item.tapis?.nom}</p>
                              <p className="text-[11px] font-semibold text-text-muted mt-0.5">
                                {item.quantite} x {item.prixUnitaire.toFixed(2)} DH
                                {item.largeur && ` • ${item.largeur}x${item.hauteur}m`}
                              </p>
                           </div>
                        </div>
                        <p className="text-sm font-bold text-text-primary">{(item.quantite * item.prixUnitaire).toFixed(2)} DH</p>
                      </div>
                    );
                  })}
               </div>

               <div className="pt-6 mt-2 border-t border-dashed border-border flex items-center justify-between">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('driver.delivery_details.total_order')}</p>
                  <div className="text-end">
                     <p className="text-2xl font-bold text-primary-600 tracking-tight">{order.montantTotal.toFixed(0)} <span className="text-sm font-semibold opacity-70">DH</span></p>
                  </div>
               </div>
            </div>

            {/* SECONDARY ACTIONS */}
            <div className="grid grid-cols-2 gap-4">
               <button 
                 onClick={() => handleCancel('absent')}
                 disabled={isCancelling}
                 className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all border border-amber-500/20 group"
               >
                  <div className="w-11 h-11 bg-surface rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-border">
                     <UserX size={20} className="text-amber-600 dark:text-amber-500" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t('driver.ready_delivery.card.absent', 'Client Absent')}</span>
               </button>
               <button 
                 onClick={() => handleCancel('cancelled')}
                 disabled={isCancelling}
                 className="bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-500 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all border border-red-500/20 group"
               >
                  <div className="w-11 h-11 bg-surface rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-border">
                     <XCircle size={20} className="text-red-600 dark:text-red-500" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t('driver.ready_delivery.actions.cancel', 'Annuler Livraison')}</span>
               </button>
            </div>
        </div>

        {/* RIGHT COLUMN: ACTION / PAYMENT */}
        <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-surface rounded-2xl shadow-xl border-2 border-primary-500 overflow-hidden sticky top-24">
                <div className="bg-primary-500 p-6 sm:p-8 text-white relative">
                   <div className="absolute top-0 end-0 p-4 opacity-15">
                      <Wallet size={70} strokeWidth={1} />
                   </div>
                   <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-white">
                      <CreditCard size={16} strokeWidth={2.5} /> {t('driver.delivery_details.payment_summary')}
                   </h3>
                   <div className="flex items-baseline gap-1 text-white">
                      <span className="text-4xl font-bold tracking-tight">{order.montantTotal.toFixed(0)}</span>
                      <span className="text-base font-semibold opacity-80">DH</span>
                   </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6 text-start">
                   <div className="space-y-4">
                      <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider px-1">{t('driver.delivery_details.payment_method_label')}</p>
                      <div className="grid grid-cols-1 gap-3">
                         {paymentTypes?.length > 0 ? (
                           paymentTypes.map((opt, pidx) => (
                            <button
                                key={opt.id || pidx}
                                type="button"
                                onClick={() => setPaymentMethod(opt.id)}
                                className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all group ${
                                  paymentMethod === opt.id
                                    ? 'bg-primary-500/10 border-primary-500 shadow-sm'
                                    : 'bg-background border-transparent hover:border-border'
                                }`}
                              >
                                 <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      paymentMethod === opt.id ? 'border-primary-500 bg-surface' : 'border-border bg-background'
                                    }`}>
                                       {paymentMethod === opt.id && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                    </div>
                                    <span className={`text-sm font-bold transition-colors ${
                                      paymentMethod === opt.id ? 'text-primary-700 dark:text-primary-500' : 'text-text-muted group-hover:text-text-primary'
                                    }`}>{opt.label}</span>
                                 </div>
                                 {opt.code === 'especes' || opt.label?.toLowerCase().includes('esp') ? <Banknote size={18} className={paymentMethod === opt.id ? 'text-primary-500' : 'text-text-muted'} /> : 
                                  opt.code === 'carte' || opt.label?.toLowerCase().includes('cart') ? <CreditCard size={18} className={paymentMethod === opt.id ? 'text-primary-500' : 'text-text-muted'} /> :
                                  <FileText size={18} className={paymentMethod === opt.id ? 'text-primary-500' : 'text-text-muted'} />}
                              </button>
                           ))
                         ) : (
                           <div className="py-4 px-6 bg-red-500/10 text-red-600 rounded-xl text-xs font-bold text-center">
                              {t('driver.delivery_details.payment_unavailable')}
                           </div>
                         )}
                      </div>
                   </div>

                   <button
                     onClick={handleRecordPayment}
                     disabled={loading?.confirmPayment}
                     className="w-full bg-primary-500 text-white rounded-xl py-4 font-bold text-sm tracking-wide shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                   >
                     {loading?.confirmPayment ? (
                       <Loader2 className="animate-spin" size={20} />
                     ) : (
                       <>
                         {t('driver.delivery_details.validate_btn')}
                         <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform rtl:rotate-180" />
                       </>
                     )}
                   </button>
                   
                   <p className="text-[10px] text-center font-semibold text-text-muted px-4 leading-relaxed">
                      {t('driver.delivery_details.warning_note')}
                   </p>
                </div>
            </div>

        </div>
      </div>

    </div>
  );
}
