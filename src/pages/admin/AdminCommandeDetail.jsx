import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Package, User, CalendarDays,
  MapPin, Phone, CreditCard, Truck, RefreshCw, X, ChevronLeft, ChevronRight, Image as ImageIcon, AlertTriangle,
  Calculator, Hash
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
    en_attente: { label: t('status.en_attente'), accentText: 'text-orange-500', accentBg: 'bg-orange-50 dark:bg-orange-500/10' },
    en_nettoyage: { label: t('status.en_traitement'), accentText: 'text-blue-500', accentBg: 'bg-blue-50 dark:bg-blue-500/10' },
    nettoye: { label: t('status.prete'), accentText: 'text-green-500', accentBg: 'bg-green-50 dark:bg-green-500/10' },
    livre: { label: t('status.livree'), accentText: 'text-teal-500', accentBg: 'bg-teal-50 dark:bg-teal-500/10' },
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
      <div className="flex flex-col items-center justify-center py-32 opacity-40">
        <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.2em]">{t('common.loading')}</p>
      </div>
    );
  }

  const getClientDisplayName = (order) => {
    return order.client?.name || order.clientNom || 'Client #' + (order.client?.id || order.clientId || '?');
  };

  const getClientPhone = (client) => {
    if (!client) return '—';
    if (client.phone) return client.phone;
    if (client.telephone) return client.telephone;
    if (Array.isArray(client.phones) && client.phones.length > 0) {
      return client.phones[0].phoneNumber || client.phones[0].phone || '—';
    }
    return '—';
  };

  const tapis = commande.commandeTapis || [];
  const clientPhone = getClientPhone(commande.client);

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6 animate-fade-in text-start px-4 md:px-0">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border/50 rounded-xl text-xs font-black uppercase tracking-widest text-text-muted hover:text-text-primary transition-all active:scale-95 shadow-sm">
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {t('common.back')}
        </button>
        <div className="flex items-center gap-2">
          <Hash size={14} className="text-primary-500" />
          <span className="text-xs font-black text-text-muted uppercase tracking-widest">{t('admin.pro_ui.order_details')}</span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-surface rounded-[2rem] shadow-card p-6 md:p-10 border border-border/40 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Package size={120} className="text-primary-500" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={commande.status} />
              <span className="text-xs font-black text-text-muted uppercase tracking-widest opacity-60">{t('admin.pro_ui.created_at')} {formatDate(commande.dateCreation)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-text-primary tracking-tight truncate">#{commande.numeroCommande}</h1>
          </div>
          {commande.montantTotal != null && (
            <div className="bg-primary-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-primary-500/20 text-center min-w-[160px] md:min-w-[180px]">
              <p className="text-xs sm:text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-1">{t('admin.orders.kpi.value')}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl sm:text-3xl font-black tracking-tight">{commande.montantTotal}</span>
                <span className="text-xs sm:text-xs font-bold uppercase opacity-60">DH</span>
              </div>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 relative z-10">
          {[
            { icon: User, label: t('admin.orders.details.labels.driver'), value: commande.livreur?.name, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
            { icon: User, label: t('admin.orders.details.labels.client'), value: getClientDisplayName(commande), color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
            { icon: Phone, label: t('admin.orders.details.labels.phone'), value: clientPhone, color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', isLink: clientPhone !== '—', href: `tel:${clientPhone}` },
            { icon: CalendarDays, label: t('admin.orders.details.labels.expected_delivery'), value: commande.dateLivraison ? formatDate(commande.dateLivraison) : t('admin.orders.details.labels.not_planned'), color: 'bg-gray-500/10 text-text-muted' },
            { icon: CreditCard, label: t('admin.orders.details.labels.payment'), value: commande.modePaiement || t('admin.orders.details.labels.not_defined'), color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
            { icon: MapPin, label: t('admin.pro_ui.address'), value: commande.client?.address || (Array.isArray(commande.client?.addresses) && commande.client.addresses[0]?.fullAddress), color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', fullWidth: true },
          ].filter(r => r.value).map((row, i) => {
            const Icon = row.icon;
            return (
              <div key={i} className={`bg-background/50 rounded-2xl p-4 border border-border/50 flex items-start gap-4 ${row.fullWidth ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${row.color} border border-current/10`}>
                  <Icon size={18} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-xs font-black text-text-muted uppercase tracking-widest mb-0.5 sm:mb-1">{row.label}</p>
                  {row.isLink ? (
                    <a href={row.href} className="text-xs sm:text-sm font-black text-text-primary hover:text-primary-500 transition-colors truncate block">{row.value}</a>
                  ) : (
                    <p className="text-xs sm:text-sm font-black text-text-primary truncate">{row.value}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carpet List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-3">
            <Package size={18} className="text-primary-500" />
            {t('admin.pro_ui.detailed_articles')} ({tapis.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {tapis.map((item, i) => {
            const etatCfg = ETAT_CONFIG[item.etat] || ETAT_CONFIG.en_attente;
            const baseUrl = import.meta.env.VITE_API_URL;
            const getFullUrl = (img) => {
              const url = img?.imageUrl || img?.url || (typeof img === 'string' ? img : null);
              if (!url) return null;
              return url.startsWith('http') ? url : `${baseUrl}${url}`;
            };

            const avantImages = (item.tapisImages?.filter(img => img.imageType === 'BEFORE') || []).map(getFullUrl).filter(Boolean);
            const apresImages = (item.tapisImages?.filter(img => img.imageType === 'AFTER') || []).map(getFullUrl).filter(Boolean);

            return (
              <div key={item.id || i} className="bg-surface rounded-3xl shadow-card border border-border/40 overflow-hidden hover:shadow-xl transition-all duration-500">
                <div className="flex flex-col lg:flex-row">
                  {/* Left: Photos */}
                  <div className="lg:w-1/2 p-6 bg-background/30 border-b lg:border-b-0 lg:border-e border-border/50">
                    <div className="flex items-center justify-between mb-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${etatCfg.accentBg} ${etatCfg.accentText} border-current/10`}>{etatCfg.label}</span>
                      <div className="flex items-center gap-2 text-text-muted">
                        <ImageIcon size={14} />
                        <span className="text-xs font-black uppercase tracking-widest">{t('admin.pro_ui.carpet_photos')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[{ label: t('workshop.detail.sections.before'), imgs: avantImages }, { label: t('workshop.detail.sections.after'), imgs: apresImages }].map((set, idx) => (
                        <div key={idx} className="space-y-3 text-center">
                          <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">{set.label}</p>
                          {set.imgs.length > 0 ? (
                            <div className="relative h-32 rounded-2xl overflow-hidden border-2 border-surface shadow-sm group cursor-pointer" onClick={() => { setLightboxImages(set.imgs); setLightboxIndex(0); setLightboxOpen(true); }}>
                              <img src={set.imgs[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={set.label} />
                              <div className="absolute inset-0 bg-primary-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <div className="w-8 h-8 rounded-full bg-white text-primary-600 flex items-center justify-center shadow-lg"><RefreshCw size={16} /></div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-32 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-background/50 opacity-40">
                              <ImageIcon size={20} className="text-text-muted mb-2" />
                              <span className="text-xs font-black uppercase">{t('common.empty')}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Technical Specs */}
                  <div className="lg:w-1/2 p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center border border-primary-500/20"><Calculator size={24} /></div>
                      <div className="text-start">
                        <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-0.5">{t('admin.pro_ui.category')}</p>
                        <h4 className="text-lg font-black text-text-primary uppercase tracking-tight">{item.tapis?.nom || `${t('admin.dashboard.carpets')} #${i + 1}`}</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-background rounded-2xl p-5 border border-border/50">
                      <div className="text-start">
                        <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">{t('admin.pro_ui.dimensions')}</p>
                        <p className="text-sm font-black text-text-primary uppercase tracking-tight">{item.largeur}m × {item.longueur || item.hauteur}m</p>
                      </div>
                      <div className="text-start">
                        <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">{t('admin.pro_ui.total_surface')}</p>
                        <p className="text-sm font-black text-text-primary uppercase tracking-tight">{(item.largeur * (item.longueur || item.hauteur)).toFixed(2)} m²</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-primary-500/5 rounded-2xl border border-primary-500/10">
                      <div className="text-start">
                        <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-1">{t('admin.pro_ui.service_price')}</p>
                        <p className="text-xl font-black text-primary-600">{item.prixFinal} <span className="text-xs font-bold">DH</span></p>
                      </div>
                      {item.prixFinal !== item.prixCalcule && (
                        <div className="group relative">
                          <AlertTriangle size={20} className="text-amber-500 animate-pulse" />
                          <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-surface border border-border rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            <p className="text-xs font-bold text-text-primary text-center">{t('admin.pro_ui.manual_pricing_applied')}</p>
                          </div>
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

      {/* Summary Footer Card */}
      <div className="bg-surface rounded-[2rem] border border-border/50 p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-card text-center md:text-start">
        <div className="space-y-2">
          <h4 className="text-lg font-black text-text-primary uppercase tracking-tight">{t('admin.pro_ui.production_summary')}</h4>
          <p className="text-xs text-text-muted font-bold uppercase tracking-[0.2em]">{tapis.length} {t('admin.dashboard.carpets')} • {tapis.reduce((s, t) => s + (t.quantite || 1), 0)} {t('admin.pro_ui.members')} • {tapis.reduce((s, t) => s + (t.largeur * (t.longueur || t.hauteur)), 0).toFixed(2)}m² Total</p>
        </div>
        <div className="h-12 w-px bg-border/50 hidden md:block" />
        <div className="text-center md:text-end">
          <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1 opacity-60">{t('admin.pro_ui.financial_status')}</p>
          <StatusBadge status={commande.status === 'PAYEE' ? 'PAYEE' : 'VALIDEE'} />
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center md:items-start justify-center p-0 animate-in fade-in duration-500" onClick={e => e.target === e.currentTarget && setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-6 end-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all z-[10000] border border-white/10 shadow-lg"><X size={24} /></button>
          
          <div className="relative w-full h-full flex flex-col items-center justify-center md:pt-32">
            <div className="absolute top-4 inset-x-0 flex justify-center items-center z-[10000]">
              <span className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black text-white uppercase tracking-widest border border-white/10">{lightboxIndex + 1} / {lightboxImages.length} IMAGES</span>
            </div>

            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden group">
              {lightboxIndex > 0 && <button className="absolute start-4 z-[10000] w-14 h-14 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-all border border-white/10 shadow-xl" onClick={() => setLightboxIndex(i => i - 1)}><ChevronLeft size={32} /></button>}
              
              <div className="w-full h-full flex items-center justify-center overflow-hidden p-4 md:p-12">
                <img 
                  src={lightboxImages[lightboxIndex]} 
                  className="w-full h-full md:max-w-[80vw] md:max-h-[70vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500" 
                  alt="zoom" 
                />
              </div>

              {lightboxIndex < lightboxImages.length - 1 && <button className="absolute end-4 z-[10000] w-14 h-14 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-all border border-white/10 shadow-xl" onClick={() => setLightboxIndex(i => i + 1)}><ChevronRight size={32} /></button>}
            </div>

            <div className="h-24 flex gap-3 mt-4 overflow-x-auto no-scrollbar max-w-full px-8 items-center pb-2">
              {lightboxImages.map((img, idx) => (
                <img key={idx} src={img} className={`w-16 h-16 rounded-xl object-cover cursor-pointer border-2 transition-all flex-shrink-0 ${idx === lightboxIndex ? 'border-primary-500 scale-110 shadow-lg' : 'border-white/10 opacity-40 hover:opacity-100'}`} onClick={() => setLightboxIndex(idx)} alt="thumb" />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
