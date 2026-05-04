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
        <Loader2 size={40} className="animate-spin text-[var(--primary)] mb-4" />
        <p className="font-['Inter'] text-[12px] font-bold uppercase tracking-[0.2em]">{t('common.loading')}</p>
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
    <div className="max-w-2xl mx-auto pb-12 space-y-6 animate-fade-in text-start px-5 md:px-0">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[rgba(0,0,0,0.08)] rounded-[10px] text-[12px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {t('common.back')}
        </button>
        <div className="flex items-center gap-2">
          <Hash size={14} className="text-[var(--primary)]" />
          <span className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('admin.pro_ui.order_details')}</span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-[20px] shadow-[var(--shadow-md)] p-6 border border-[rgba(0,0,0,0.06)] relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--primary)]" />
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Package size={100} className="text-[var(--primary)]" />
        </div>

        <div className="flex flex-col gap-6 mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={commande.status} />
              <span className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('admin.pro_ui.created_at')} {formatDate(commande.dateCreation)}</span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[var(--text)] tracking-tight">#{commande.numeroCommande}</h1>
          </div>
          
          <div className="bg-[var(--primary-surface)] rounded-[16px] p-5 border border-[rgba(13,115,119,0.1)] flex items-center justify-between">
            <div className="text-start">
              <p className="font-['Inter'] text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] mb-1">{t('admin.orders.kpi.value')}</p>
              <p className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[var(--text)] tracking-tight leading-none">
                {commande.montantTotal} <span className="text-sm font-bold text-[var(--text-muted)]">DH</span>
              </p>
            </div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[var(--primary)] border border-[rgba(13,115,119,0.1)]">
              <CreditCard size={20} />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 relative z-10">
          {[
            { icon: Truck, label: t('admin.orders.details.labels.driver'), value: commande.livreur?.name, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary-surface)]' },
            { icon: User, label: t('admin.orders.details.labels.client'), value: getClientDisplayName(commande), color: 'text-[var(--primary)]', bg: 'bg-[var(--primary-surface)]' },
            { icon: Phone, label: t('admin.orders.details.labels.phone'), value: clientPhone, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]', isLink: clientPhone !== '—', href: `tel:${clientPhone}` },
            { icon: CalendarDays, label: t('admin.orders.details.labels.expected_delivery'), value: commande.dateLivraison ? formatDate(commande.dateLivraison) : t('admin.orders.details.labels.not_planned'), color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--bg)]' },
            { icon: MapPin, label: t('admin.pro_ui.address'), value: commande.client?.address || (Array.isArray(commande.client?.addresses) && commande.client.addresses[0]?.fullAddress), color: 'text-[var(--primary)]', bg: 'bg-[var(--primary-surface)]' },
          ].filter(r => r.value).map((row, i) => {
            const Icon = row.icon;
            return (
              <div key={i} className="bg-[var(--bg)] rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] flex items-start gap-4">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${row.bg} ${row.color} border border-[rgba(0,0,0,0.04)]`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">{row.label}</p>
                  {row.isLink ? (
                    <a href={row.href} className="font-['Inter'] text-[13px] font-bold text-[var(--text)] truncate block hover:text-[var(--primary)] transition-colors">{row.value}</a>
                  ) : (
                    <p className="font-['Inter'] text-[13px] font-bold text-[var(--text)] leading-tight">{row.value}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carpet List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)] flex items-center gap-2">
            <Package size={20} className="text-[var(--primary)]" />
            {t('admin.pro_ui.detailed_articles')} ({tapis.length})
          </h3>
        </div>

        <div className="space-y-4">
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
              <div key={item.id || i} className="bg-white rounded-[20px] shadow-[var(--shadow-md)] border border-[rgba(0,0,0,0.06)] overflow-hidden">
                <div className="p-5 border-b border-[rgba(0,0,0,0.04)] bg-[var(--bg)] flex items-center justify-between">
                   <div className="flex items-center gap-3 text-start">
                      <div className="w-9 h-9 rounded-[10px] bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-[var(--primary)] font-bold text-[13px]">
                        {i+1}
                      </div>
                      <p className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)]">{item.tapis?.nom || t('admin.dashboard.carpets')}</p>
                   </div>
                   <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-white ${etatCfg.accentText} border-[rgba(0,0,0,0.08)]`}>
                     {etatCfg.label}
                   </span>
                </div>

                <div className="p-5 space-y-6">
                  {/* Photos */}
                  <div className="grid grid-cols-2 gap-4">
                    {[{ label: t('workshop.detail.sections.before'), imgs: avantImages }, { label: t('workshop.detail.sections.after'), imgs: apresImages }].map((set, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.1em] text-center">{set.label}</p>
                        {set.imgs.length > 0 ? (
                          <div className="relative h-28 rounded-[12px] overflow-hidden border border-[rgba(0,0,0,0.08)] cursor-pointer group" onClick={() => { setLightboxImages(set.imgs); setLightboxIndex(0); setLightboxOpen(true); }}>
                            <img src={set.imgs[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={set.label} />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <RefreshCw size={16} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-28 rounded-[12px] border border-dashed border-[rgba(0,0,0,0.1)] flex flex-col items-center justify-center bg-[var(--bg)] opacity-50">
                            <ImageIcon size={18} className="text-[var(--text-muted)] mb-1" />
                            <span className="text-[10px] font-bold uppercase">{t('common.empty')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[var(--bg)] rounded-[12px] border border-[rgba(0,0,0,0.04)] text-start">
                       <p className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('admin.pro_ui.dimensions')}</p>
                       <p className="font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-[var(--text)]">{item.largeur}m × {item.longueur || item.hauteur}m</p>
                    </div>
                    <div className="p-3 bg-[var(--bg)] rounded-[12px] border border-[rgba(0,0,0,0.04)] text-start">
                       <p className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('admin.pro_ui.total_surface')}</p>
                       <p className="font-['Plus_Jakarta_Sans'] text-[14px] font-bold text-[var(--text)]">{(item.largeur * (item.longueur || item.hauteur)).toFixed(2)} m²</p>
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--primary-surface)] rounded-[12px] border border-[rgba(13,115,119,0.1)] flex items-center justify-between">
                    <div className="text-start">
                      <p className="font-['Inter'] text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider mb-1">{t('admin.pro_ui.service_price')}</p>
                      <p className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--primary)] leading-none">{item.prixFinal} <span className="text-xs">DH</span></p>
                    </div>
                    {item.prixFinal !== item.prixCalcule && (
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-[#F59E0B]">
                        <AlertTriangle size={16} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer Card */}
      <div className="bg-white rounded-[20px] border border-[rgba(0,0,0,0.06)] p-6 shadow-[var(--shadow-md)] flex flex-col gap-6 text-start relative overflow-hidden">
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[var(--primary)]" />
        <div>
          <h4 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)] tracking-tight mb-2">{t('admin.pro_ui.production_summary')}</h4>
          <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] font-medium leading-relaxed">
            {tapis.length} {t('admin.dashboard.carpets')} • {tapis.reduce((s, t) => s + (t.quantite || 1), 0)} {t('admin.pro_ui.members')} • {tapis.reduce((s, t) => s + (t.largeur * (t.longueur || t.hauteur)), 0).toFixed(2)}m² Total
          </p>
        </div>
        <div className="h-px bg-[rgba(0,0,0,0.06)] w-full" />
        <div className="flex items-center justify-between">
          <p className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('admin.pro_ui.financial_status')}</p>
          <StatusBadge status={commande.status === 'PAYEE' ? 'PAYEE' : 'VALIDEE'} />
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-500" onClick={e => e.target === e.currentTarget && setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-6 end-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all z-[10000] border border-white/10 shadow-lg active:scale-90"><X size={24} /></button>
          
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="absolute top-6 inset-x-0 flex justify-center items-center z-[10000]">
              <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[11px] font-bold text-white uppercase tracking-widest border border-white/10">{lightboxIndex + 1} / {lightboxImages.length} IMAGES</span>
            </div>

            <div className="relative flex-1 w-full flex items-center justify-center group">
              {lightboxIndex > 0 && <button className="absolute start-4 z-[10000] w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10" onClick={() => setLightboxIndex(i => i - 1)}><ChevronLeft size={24} /></button>}
              
              <div className="w-full h-full flex items-center justify-center p-4">
                <img 
                  src={lightboxImages[lightboxIndex]} 
                  className="max-w-full max-h-full object-contain rounded-lg animate-in zoom-in-95 duration-500" 
                  alt="zoom" 
                />
              </div>

              {lightboxIndex < lightboxImages.length - 1 && <button className="absolute end-4 z-[10000] w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/10" onClick={() => setLightboxIndex(i => i + 1)}><ChevronRight size={24} /></button>}
            </div>

            <div className="h-20 flex gap-3 mb-6 overflow-x-auto no-scrollbar max-w-full px-8 items-center">
              {lightboxImages.map((img, idx) => (
                <img key={idx} src={img} className={`w-14 h-14 rounded-lg object-cover cursor-pointer border-2 transition-all shrink-0 ${idx === lightboxIndex ? 'border-[var(--primary)] scale-110 shadow-lg' : 'border-white/10 opacity-40'}`} onClick={() => setLightboxIndex(idx)} alt="thumb" />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
