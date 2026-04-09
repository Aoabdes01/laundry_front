import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Package, User, CalendarDays,
  MapPin, Phone, CreditCard, Truck, X, ChevronLeft, ChevronRight, Image as ImageIcon, AlertTriangle,
  Calculator
} from 'lucide-react';
import { fetchCommandeById } from '../../store/admin/adminThunk';
import { clearSelectedCommande } from '../../store/admin/adminSlice';
import { StatusBadge } from '../../components/StatusBadge';
import { useTranslation } from 'react-i18next';

export default function AdminCommandeDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const ETAT_CONFIG = {
    en_attente: { label: t('status.en_attente'), accentText: 'text-orange-500', accentBg: 'bg-orange-50' },
    en_nettoyage: { label: t('status.en_traitement'), accentText: 'text-blue-500', accentBg: 'bg-blue-50' },
    nettoye: { label: t('status.prete'), accentText: 'text-green-500', accentBg: 'bg-green-50' },
    livre: { label: t('status.livree'), accentText: 'text-teal-500', accentBg: 'bg-teal-50' },
  };
  const { selectedCommande: commande, loading } = useSelector(s => s.admin);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    dispatch(fetchCommandeById(id));
    return () => { dispatch(clearSelectedCommande()); };
  }, [id, dispatch]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  if (loading || !commande) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-600 mb-3" />
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  const tapis = commande.commandeTapis || [];

  return (
    <div className="max-w-2xl mx-auto pb-8 space-y-4">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary text-start">
        <ArrowLeft size={16} className="rtl:rotate-180" />
        {t('common.back')}
      </button>

      {/* Header */}
      <div className="bg-surface rounded-3xl shadow-card p-6 border border-border/50">
        <div className="flex items-start justify-between mb-6">
          <div className="text-start">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 px-1">{t('admin.orders.details.ref')}</p>
            <div className="flex items-center gap-3">
              <p className="text-xl font-black text-text-primary tracking-tight">#{commande.numeroCommande}</p>
              <StatusBadge status={commande.status} size="sm" />
            </div>
          </div>
          {commande.montantTotal != null && (
            <div className="text-end">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{t('admin.orders.details.collection')}</p>
              <div className="bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100 flex items-baseline gap-1">
                <span className="text-xl font-black text-primary-600 tracking-tight">{commande.montantTotal}</span>
                <span className="text-[10px] font-black text-primary-400 uppercase">{t('admin.orders.kpi.unit_dh')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: User, label: t('admin.orders.details.labels.driver'), value: commande.livreur?.name, color: 'bg-indigo-50 text-indigo-500' },
            { icon: User, label: t('admin.orders.details.labels.client'), value: commande.client?.name, color: 'bg-teal-50 text-teal-600' },
            { icon: Phone, label: t('admin.orders.details.labels.phone'), value: commande.client?.telephone || commande.client?.phone || commande.client?.phones?.[0]?.phoneNumber, color: 'bg-amber-50 text-amber-600' },
            { icon: CalendarDays, label: t('admin.orders.details.labels.created_at'), value: formatDate(commande.dateCreation), color: 'bg-gray-50 text-text-muted' },
            { icon: Truck, label: t('admin.orders.details.labels.expected_delivery'), value: commande.dateLivraison ? formatDate(commande.dateLivraison) : null, color: 'bg-emerald-50 text-emerald-600' },
            { icon: CreditCard, label: t('admin.orders.details.labels.payment'), value: commande.modePaiement, color: 'bg-rose-50 text-rose-600' },
          ].filter(r => r.value).map((row, i) => {
            const Icon = row.icon;
            return (
              <div key={i} className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100 flex flex-col gap-1.5 text-start">
                <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">{row.label}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${row.color}`}>
                    <Icon size={12} strokeWidth={2.5} />
                  </div>
                  <p className="text-[11px] font-black text-text-primary truncate">{row.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {commande.client?.address && (
          <div className="flex items-center gap-2.5 bg-background rounded-2xl px-4 py-3 mt-4 border border-border/50 text-start">
            <MapPin size={14} className="text-primary-500 shrink-0" />
            <span className="text-xs font-bold text-text-secondary tracking-tight">{commande.client.address}</span>
          </div>
        )}
      </div>

      {/* Tapis List */}
      {tapis.length > 0 && (
        <div className="text-start">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
            <Package size={16} className="text-primary-600" />
            {t('admin.orders.details.articles', { count: tapis.length })}
          </h3>
          <div className="space-y-4">
            {tapis.map((item, i) => {
              const etatCfg = ETAT_CONFIG[item.etat] || ETAT_CONFIG.en_attente;
              const tapisInfo = item.tapis || {};

              const baseUrl = import.meta.env.VITE_API_URL;

              const getFullUrl = (img) => {
                const url = img?.imageUrl || img?.url || (typeof img === 'string' ? img : null);
                if (!url) return null;
                return url.startsWith('http') ? url : `${baseUrl}${url}`;
              };

              const avantImages = (item.tapisImages?.filter(
                img => img.imageType === 'BEFORE' || img.type === 'avant' || img.isAvant === true || !img.imageType
              ) || item.images?.filter(
                img => img.type === 'avant' || img.isAvant === true || !img.type
              ) || item.photosAvant || []).map(getFullUrl).filter(Boolean);

              const apresImages = (item.tapisImages?.filter(
                img => img.imageType === 'AFTER' || img.type === 'apres' || img.isApres === true
              ) || item.images?.filter(
                img => img.type === 'apres' || img.isApres === true
              ) || item.photosApres || []).map(getFullUrl).filter(Boolean);

              return (
                <div key={item.id || i} className="bg-surface rounded-2xl shadow-card p-4 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                           <ImageIcon size={14} className="text-text-muted" />
                           <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('admin.orders.details.photos.title')}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${etatCfg.accentBg} ${etatCfg.accentText}`}>{etatCfg.label}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest px-1">{t('admin.orders.details.photos.before')}</p>
                          {avantImages.length > 0 ? (
                            <div className="relative h-20 rounded-xl overflow-hidden border border-border group cursor-pointer" onClick={() => { setLightboxImages(avantImages); setLightboxIndex(0); setLightboxOpen(true); }}>
                               <img src={avantImages[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Avant" />
                               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <span className="text-white text-[10px] font-black uppercase">{t('admin.see_all') || 'VOIR'}</span>
                               </div>
                            </div>
                          ) : (
                            <div className="h-20 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50/50">
                               <ImageIcon size={16} className="text-gray-300 mb-1" />
                               <span className="text-[8px] text-gray-400 font-bold uppercase">{t('admin.orders.details.photos.unavailable')}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest px-1">{t('admin.orders.details.photos.after')}</p>
                          {apresImages.length > 0 ? (
                            <div className="relative h-20 rounded-xl overflow-hidden border border-border group cursor-pointer" onClick={() => { setLightboxImages(apresImages); setLightboxIndex(0); setLightboxOpen(true); }}>
                               <img src={apresImages[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Après" />
                               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <span className="text-white text-[10px] font-black uppercase">{t('admin.see_all') || 'VOIR'}</span>
                               </div>
                            </div>
                          ) : (
                            <div className="h-20 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50/50">
                               <ImageIcon size={16} className="text-gray-300 mb-1" />
                               <span className="text-[8px] text-gray-400 font-bold uppercase">{t('admin.orders.details.photos.unavailable')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                       <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                             <Calculator size={14} className="text-primary-500" />
                             <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{tapisInfo.nom || tapisInfo.name || `Tapis ${i + 1}`}</p>
                          </div>
                          
                          <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">{t('admin.orders.details.modes.size')}</span>
                                <span className="text-xs font-black text-text-primary">{item.largeur}m × {item.longueur || item.hauteur}m</span>
                             </div>
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">{t('admin.orders.details.modes.manual')}</span>
                                <span className="text-xs font-black text-primary-600">{item.prixFinal} <span className="text-[9px] uppercase">{t('admin.orders.kpi.unit_dh')}</span></span>
                             </div>
                          </div>
                          
                          {item.prixFinal !== item.prixCalcule && (
                            <div className="bg-amber-50 rounded-xl p-2 border border-amber-100 flex items-center gap-2">
                              <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                              <p className="text-[9px] font-black text-amber-700 uppercase tracking-tighter leading-tight">
                                {t('admin.orders.details.pricing.manual_warning')}
                              </p>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Summary */}
      <div className="bg-primary-600 rounded-3xl p-6 text-white shadow-xl shadow-primary-500/20 flex flex-col items-center text-center gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-200">{t('admin.orders.details.footer.total_calculated')}</p>
        <div className="flex items-baseline gap-2">
           <span className="text-4xl font-black tracking-tight">{commande.montantTotal}</span>
           <span className="text-xs font-bold uppercase opacity-60">{t('admin.orders.kpi.unit_dh')}</span>
        </div>
        <p className="text-[11px] font-bold text-primary-100/80 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md mt-2">
          {t('admin.orders.details.footer.summary', { carpets: tapis.length, units: tapis.reduce((s,t) => s + (t.quantite || 1), 0) })}
        </p>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
        >
          <button
            className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="absolute top-4 start-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>

          {lightboxIndex > 0 && (
            <button
              className="absolute start-4 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              onClick={() => setLightboxIndex(i => i - 1)}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          <img
            src={lightboxImages[lightboxIndex]}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl"
            alt="zoom"
          />

          {lightboxIndex < lightboxImages.length - 1 && (
            <button
              className="absolute end-4 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              onClick={() => setLightboxIndex(i => i + 1)}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {lightboxImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                className={`w-12 h-12 rounded-lg object-cover cursor-pointer border-2 ${idx === lightboxIndex ? 'border-white opacity-100' : 'border-transparent opacity-50'
                  }`}
                onClick={() => setLightboxIndex(idx)}
                alt="thumb"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
