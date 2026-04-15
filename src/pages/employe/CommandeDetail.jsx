import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Loader2, Package, CheckCircle2, Clock, Wrench, Truck,
  User, CalendarDays, ChevronRight, Upload, Plus, RefreshCw, X, Image as ImageIcon,
  Zap, ListChecks, AlertCircle, History, Phone, PieChart
} from 'lucide-react';
import {
  fetchCommandeById,
  updateCommandeStatus,
  updateTapisEtat,
  addTapisImages
} from '../../store/employe/employeThunk';
import { selectSelectedCommande, selectLoading } from '../../store/employe/employeSelectors';
import { clearSelectedCommande } from '../../store/employe/employeSlice';
import { StatusBadge } from '../../components/StatusBadge';

const BASE_URL = import.meta.env.VITE_API_URL;

const COMMANDE_STATUS = {
  EN_ATTENTE: 'en_attente',
  VALIDEE: 'validee',
  EN_TRAITEMENT: 'en_traitement',
  PRETE: 'prete',
  LIVREE: 'livree',
  PAYEE: 'payee',
  RETOURNEE: 'retournee'
};

const TAPIS_ETAT = {
  EN_ATTENTE: 'en_attente',
  EN_NETTOYAGE: 'en_nettoyage',
  NETTOYE: 'nettoye',
  LIVRE: 'livre'
};

const TAPIS_IMAGE_TYPE = {
  BEFORE: 'BEFORE',
  AFTER: 'AFTER'
};

const ETAT_CONFIG = {
  [TAPIS_ETAT.EN_ATTENTE]: { label: 'status.en_attente', color: 'bg-orange-500', next: TAPIS_ETAT.EN_NETTOYAGE },
  [TAPIS_ETAT.EN_NETTOYAGE]: { label: 'status.en_traitement', color: 'bg-blue-500', next: TAPIS_ETAT.NETTOYE },
  [TAPIS_ETAT.NETTOYE]: { label: 'status.prete', color: 'bg-green-500', next: null },
  [TAPIS_ETAT.LIVRE]: { label: 'status.livree', color: 'bg-teal-500', next: null }
};

const NEXT_COMMAND_LABEL = {
  [COMMANDE_STATUS.EN_ATTENTE]: "Démarrer",
  [COMMANDE_STATUS.VALIDEE]: "Démarrer",
  [COMMANDE_STATUS.EN_TRAITEMENT]: "Marquer comme Prête",
  [COMMANDE_STATUS.RETOURNEE]: "Démarrer le retraitement"
};

export default function CommandeDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const commande = useSelector(selectSelectedCommande);
  const isLoading = useSelector(selectLoading).selectedCommande;

  const [uploadingTapisId, setUploadingTapisId] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingTapis, setIsUpdatingTapis] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    dispatch(fetchCommandeById(id));
    return () => { dispatch(clearSelectedCommande()); };
  }, [id, dispatch]);

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await dispatch(updateCommandeStatus({ id, status: newStatus })).unwrap();
      toast.success(t('workshop.detail.toasts.status_updated'));
    } catch (err) {
      toast.error(err || t('workshop.detail.toasts.error'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTapisStatusUpdate = async (tapisId, currentEtat) => {
    const nextEtat = ETAT_CONFIG[currentEtat]?.next;
    if (!nextEtat) return;
    setIsUpdatingTapis(true);
    try {
      await dispatch(updateTapisEtat({ tapisId, status: nextEtat })).unwrap();
      toast.success(t('workshop.detail.toasts.carpet_updated'));
    } catch (err) {
      toast.error(err || t('workshop.detail.toasts.error'));
    } finally {
      setIsUpdatingTapis(false);
    }
  };

  const handleBulkUpdate = async (targetEtat) => {
    setIsBulkUpdating(true);
    try {
      const items = commande.commandeTapis || [];
      const toUpdate = items.filter(ct => {
        if (targetEtat === TAPIS_ETAT.EN_NETTOYAGE) return ct.etat === TAPIS_ETAT.EN_ATTENTE;
        if (targetEtat === TAPIS_ETAT.NETTOYE) return ct.etat === TAPIS_ETAT.EN_NETTOYAGE || ct.etat === TAPIS_ETAT.EN_ATTENTE;
        return false;
      });

      for (const item of toUpdate) {
        await dispatch(updateTapisEtat({ tapisId: item.id, status: targetEtat })).unwrap();
      }
      toast.success(t('workshop.detail.toasts.bulk_success'));
    } catch (err) {
      toast.error(t('workshop.detail.toasts.error'));
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleImageUpload = async (tapisId, files, type) => {
    if (!files.length) return;
    setUploadingTapisId(tapisId);
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('images', f));
    formData.append('type', type);

    try {
      await dispatch(addTapisImages({ tapisId, formData })).unwrap();
      toast.success(t('workshop.detail.toasts.upload_success'));
    } catch (err) {
      toast.error(t('workshop.detail.toasts.error'));
    } finally {
      setUploadingTapisId(null);
    }
  };

  const onStatusBtnClick = () => {
    if (commande.status === COMMANDE_STATUS.EN_ATTENTE || commande.status === COMMANDE_STATUS.VALIDEE || commande.status === COMMANDE_STATUS.RETOURNEE) {
      handleStatusUpdate(COMMANDE_STATUS.EN_TRAITEMENT);
    } else if (commande.status === COMMANDE_STATUS.EN_TRAITEMENT) {
      handleStatusUpdate(COMMANDE_STATUS.PRETE);
    }
  };

  const isReadOnly = [COMMANDE_STATUS.LIVREE, COMMANDE_STATUS.PAYEE, COMMANDE_STATUS.ANNULEE].includes(commande?.status);
  const canAdvance = [COMMANDE_STATUS.EN_ATTENTE, COMMANDE_STATUS.VALIDEE, COMMANDE_STATUS.EN_TRAITEMENT, COMMANDE_STATUS.RETOURNEE].includes(commande?.status);

  const totalTapis = commande?.commandeTapis?.length || 0;
  const completedTapis = commande?.commandeTapis?.filter(ct => ct.etat === TAPIS_ETAT.NETTOYE || ct.etat === TAPIS_ETAT.LIVRE).length || 0;
  const progressPct = totalTapis > 0 ? Math.round((completedTapis / totalTapis) * 100) : 0;

  const circumference = 2 * Math.PI * 50;
  const strokeDash = (progressPct / 100) * circumference;

  const pendingBulkCleaning = useMemo(() => commande?.commandeTapis?.some(ct => ct.etat === TAPIS_ETAT.EN_ATTENTE), [commande]);
  const pendingBulkReady = useMemo(() => commande?.commandeTapis?.some(ct => ct.etat === TAPIS_ETAT.EN_NETTOYAGE || ct.etat === TAPIS_ETAT.EN_ATTENTE), [commande]);

  if (isLoading || !commande) {
    return (
      <div className="py-32 flex flex-col items-center justify-center opacity-40">
        <Loader2 size={40} className="animate-spin text-primary-500 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="pb-16 max-w-6xl mx-auto px-4 md:px-0 animate-fade-in text-start">
      
      {/* HEADER & BACK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button 
          onClick={() => navigate('/employe/dashboard')} 
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary transition-all active:scale-95 bg-surface px-4 py-2 rounded-xl border border-border/50 shadow-sm"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {t('workshop.detail.back')}
        </button>
        <button
          onClick={() => dispatch(fetchCommandeById(id))}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border/50 text-text-muted hover:text-primary-500 transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin text-primary-500' : ''} strokeWidth={2.5} />
        </button>
      </div>

      {isReadOnly && (
        <div className="bg-surface/50 border border-border/50 rounded-[2rem] p-6 mb-6 flex items-center gap-5 text-start animate-in fade-in duration-500 shadow-sm">
          <div className="w-12 h-12 bg-background rounded-[1.25rem] flex items-center justify-center text-text-muted shadow-sm border border-border/50 shrink-0">
            <History size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-black text-text-primary uppercase tracking-tight mb-1">{t('admin.pro_ui.archived_order')}</p>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-80 leading-relaxed">
              {t('workshop.pro_ui.archived_order_desc')}
            </p>
          </div>
        </div>
      )}

      {/* MAIN COMMAND CARD */}
      <div className="bg-surface rounded-[2rem] shadow-card p-6 md:p-8 mb-8 text-start border border-border/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
           <Package size={120} className="text-primary-500" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Package size={14} className="text-primary-500" />
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.detail.labels.order')}</p>
              {commande.status === COMMANDE_STATUS.RETOURNEE && (
                <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ring-1 ring-red-100 dark:ring-red-500/20 flex items-center gap-1 ms-2">
                  <AlertCircle size={10} strokeWidth={3} /> {t('status.retournee')}
                </span>
              )}
            </div>
            <p className="text-4xl md:text-5xl font-black text-text-primary mb-4 tracking-tighter">#{commande.numeroCommande}</p>
            
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={commande.status} />
              <span className="inline-flex items-center gap-2 text-[10px] font-black text-text-muted bg-background px-3 py-1.5 rounded-lg border border-border/50 uppercase tracking-widest">
                <CalendarDays size={14} />
                {new Date(commande.dateCreation || commande.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </div>

          {canAdvance && !isReadOnly && (
            <button
              onClick={onStatusBtnClick}
              disabled={isUpdatingStatus}
              className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white rounded-2xl px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary-500/20 active:scale-95 disabled:opacity-50 self-start md:self-center group/btn"
            >
              {isUpdatingStatus ? <Loader2 size={20} className="animate-spin" /> : <ChevronRight size={20} strokeWidth={3} className="rtl:rotate-180 group-hover/btn:translate-x-1 transition-transform" />}
              {t(NEXT_COMMAND_LABEL[commande.status]) || NEXT_COMMAND_LABEL[commande.status]}
            </button>
          )}
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      {(pendingBulkCleaning || pendingBulkReady) && (
        <div className="bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/20 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 start-0 w-1.5 h-full bg-violet-500" />
          
          <div className="flex items-center gap-4 ps-2 text-start">
            <div className="w-12 h-12 bg-violet-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
              <Zap size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-black text-violet-700 dark:text-violet-400 uppercase tracking-tight mb-0.5">{t('workshop.table.view_all')}</p>
              <p className="text-[10px] text-violet-600/70 dark:text-violet-500/60 font-bold uppercase tracking-widest">{t('admin.pro_ui.bulk_actions')}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:auto">
            {pendingBulkCleaning && (
              <button
                onClick={() => handleBulkUpdate(TAPIS_ETAT.EN_NETTOYAGE)}
                disabled={isBulkUpdating}
                className="w-full sm:w-auto bg-surface hover:bg-background text-violet-600 border border-violet-200 dark:border-violet-500/30 rounded-xl px-6 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isBulkUpdating ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} strokeWidth={2.5} />}
                {t('admin.pro_ui.in_cleaning')}
              </button>
            )}
            {pendingBulkReady && (
              <button
                onClick={() => handleBulkUpdate(TAPIS_ETAT.NETTOYE)}
                disabled={isBulkUpdating}
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-6 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
              >
                {isBulkUpdating ? <Loader2 size={16} className="animate-spin" /> : <ListChecks size={16} strokeWidth={2.5} />}
                {t('admin.pro_ui.all_cleaned')}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* LEFT/MAIN: ARTICLES LIST */}
        <div className="lg:col-span-2 space-y-6">
          {commande.commandeTapis?.map((ct, idx) => {
            const tapis = ct.tapis;
            const etatCfg = ETAT_CONFIG[ct.etat];
            const beforeImgs = tapis?.images?.filter(i => i.imageType === TAPIS_IMAGE_TYPE.BEFORE) || [];
            const afterImgs = tapis?.images?.filter(i => i.imageType === TAPIS_IMAGE_TYPE.AFTER) || [];
            const isUploading = uploadingTapisId === ct.id;

            return (
              <div key={ct.id} className="bg-surface rounded-[2rem] shadow-card p-6 md:p-8 text-start border border-border/50 hover:shadow-card-hover transition-all relative overflow-hidden group">
                <div className={`absolute top-0 start-0 w-1.5 h-full transition-colors ${ct.etat === TAPIS_ETAT.NETTOYE || ct.etat === TAPIS_ETAT.LIVRE ? 'bg-emerald-500' : 'bg-primary-500'}`} />
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 ps-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1 opacity-60">
                       <Package size={12} className="text-primary-500" />
                       <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.detail.sections.carpet', { index: idx + 1 })}</span>
                    </div>
                    <h3 className="font-black text-text-primary text-xl md:text-2xl tracking-tighter uppercase leading-none">{tapis?.nom}</h3>
                  </div>
                  <div className="self-start">
                     <StatusBadge status={ct.etat} />
                  </div>
                </div>

                {tapis?.description && (
                  <div className="bg-amber-500/5 rounded-2xl p-5 text-sm font-bold text-amber-700 dark:text-amber-500 mb-8 border border-amber-500/20 flex items-start gap-3 shadow-sm ms-2">
                    <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                    <p className="leading-relaxed">{tapis.description}</p>
                  </div>
                )}

                <div className="space-y-8 ms-2">
                  
                  {/* BEFORE IMAGES */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                       <ImageIcon size={14} className="text-text-muted opacity-60" />
                       <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.detail.sections.before')}</p>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                      {beforeImgs.map((img, i) => (
                        <div key={i} className="relative group/img flex-shrink-0">
                          <img src={`${BASE_URL}${img.imageUrl}`} alt="" className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover shadow-sm cursor-pointer border-2 border-border hover:border-primary-500 transition-all" onClick={() => setPreviewImg(img.imageUrl)} />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 rounded-2xl pointer-events-none transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Plus size={24} className="text-white drop-shadow-md" />
                          </div>
                        </div>
                      ))}
                      {!isReadOnly && (
                        <label className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-500/5 flex-shrink-0 transition-all group/btn bg-background">
                          {isUploading ? <Loader2 size={24} className="text-primary-500 animate-spin" /> : (
                            <>
                              <div className="w-10 h-10 rounded-[1rem] bg-surface flex items-center justify-center text-text-muted group-hover/btn:text-primary-500 transition-colors shadow-sm mb-2 border border-border/50">
                                <Plus size={20} strokeWidth={2.5} />
                              </div>
                              <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em] group-hover/btn:text-primary-600">{t('workshop.pro_ui.add')}</span>
                            </>
                          )}
                          <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(ct.id, e.target.files, TAPIS_IMAGE_TYPE.BEFORE)} />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* AFTER IMAGES */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                       <CheckCircle2 size={14} className="text-text-muted opacity-60" />
                       <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.detail.sections.after')}</p>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                      {afterImgs.map((img, i) => (
                        <div key={i} className="relative group/img flex-shrink-0">
                          <img src={`${BASE_URL}${img.imageUrl}`} alt="" className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover shadow-sm cursor-pointer border-2 border-border hover:border-primary-500 transition-all" onClick={() => setPreviewImg(img.imageUrl)} />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 rounded-2xl pointer-events-none transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Plus size={24} className="text-white drop-shadow-md" />
                          </div>
                        </div>
                      ))}
                      {!isReadOnly && (
                        <label className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-500/5 flex-shrink-0 transition-all group/btn bg-background">
                          {isUploading ? <Loader2 size={24} className="text-primary-500 animate-spin" /> : (
                            <>
                              <div className="w-10 h-10 rounded-[1rem] bg-surface flex items-center justify-center text-text-muted group-hover/btn:text-primary-500 transition-colors shadow-sm mb-2 border border-border/50">
                                <Plus size={20} strokeWidth={2.5} />
                              </div>
                              <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em] group-hover/btn:text-primary-600">{t('workshop.pro_ui.add')}</span>
                            </>
                          )}
                          <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(ct.id, e.target.files, TAPIS_IMAGE_TYPE.AFTER)} />
                        </label>
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 mt-8 border-t border-border/40 ms-2">
                  <span className="bg-background text-text-secondary text-[11px] font-black px-5 py-2.5 rounded-xl uppercase tracking-widest border border-border/50 shadow-sm self-start">
                    {t('workshop.detail.labels.qty', { count: ct.quantite })}
                  </span>
                  {etatCfg?.next && !isReadOnly && (
                    <button
                      onClick={() => handleTapisStatusUpdate(ct.id, ct.etat)}
                      disabled={isUpdatingTapis}
                      className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-8 py-4 sm:py-3.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {isUpdatingTapis ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} strokeWidth={3} className="rtl:rotate-180" />}
                      {t('workshop.detail.actions.next_step', { label: t(ETAT_CONFIG[etatCfg.next]?.label) })}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: PROGRESS & LOGISTICS */}
        <div className="space-y-6 text-start">
          
          {/* PROGRESS WIDGET */}
          <div className="bg-surface rounded-[2rem] shadow-card p-8 border border-border/50 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <PieChart size={100} />
            </div>
            
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-8 text-center relative z-10">{t('workshop.detail.progress.title')}</h3>
            
            <div className="flex justify-center mb-8 relative z-10">
              <svg viewBox="0 0 120 120" className="w-40 h-40 rotate-[-90deg] drop-shadow-md">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-border/50" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#3B82F6" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`}
                  className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-text-primary tracking-tighter leading-none">{progressPct}%</span>
                <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mt-2 bg-background px-2 py-0.5 rounded-md border border-border/50">{t('workshop.detail.progress.completed')}</span>
              </div>
            </div>

            <div className="bg-background rounded-2xl p-5 border border-border/50 shadow-sm relative z-10">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                <span className="text-text-muted">{t('workshop.detail.progress.title')}</span>
                <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">{completedTapis} / {totalTapis}</span>
              </div>
              <div className="w-full h-2.5 bg-border/50 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 transition-all duration-1000 relative" style={{ width: `${progressPct}%` }}>
                  <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* LOGISTICS WIDGET */}
          <div className="bg-surface rounded-[2rem] shadow-card p-6 md:p-8 border border-border/50 space-y-5">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">{t('workshop.detail.logistics.title')}</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-background rounded-2xl p-5 border border-border/50 shadow-sm">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">{t('workshop.detail.logistics.driver')}</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-primary-500 shadow-sm border border-border/50 shrink-0">
                    <Truck size={18} strokeWidth={2.5} className="rtl:rotate-180" />
                  </div>
                  <p className="text-sm font-black text-text-primary uppercase tracking-tight">
                    {commande.livreur?.name || t('workshop.detail.labels.not_assigned')}
                  </p>
                </div>
              </div>
              
              {commande.livreur?.phone && (
                <div className="bg-background rounded-2xl p-5 border border-border/50 shadow-sm">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">{t('admin.users.phone')}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-primary-500 shadow-sm border border-border/50 shrink-0">
                      <Phone size={18} strokeWidth={2.5} />
                    </div>
                    <a href={`tel:${commande.livreur.phone}`} className="text-sm font-black text-text-primary hover:text-primary-600 transition-colors uppercase tracking-tight">{commande.livreur.phone}</a>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Summary Footer Card */}
      <div className="bg-surface rounded-[2rem] border border-border/50 p-8 mt-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-card text-center md:text-start">
         <div className="space-y-2">
            <h4 className="text-lg font-black text-text-primary uppercase tracking-tight">{t('admin.pro_ui.production_summary')}</h4>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em]">{t('workshop.detail.labels.order')}: {tapis.length} Tapis • {commande?.commandeTapis?.reduce((s,t) => s + (t.quantite || 1), 0)} Units</p>
         </div>
         <div className="h-12 w-px bg-border/50 hidden md:block" />
         <div className="text-center md:text-end">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-60">{t('admin.pro_ui.financial_status')}</p>
            <StatusBadge status={commande.status === 'PAYEE' ? 'PAYEE' : 'VALIDEE'} />
         </div>
      </div>

      {/* Lightbox Modal */}
      {previewImg && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 md:p-8 animate-fade-in" onClick={() => setPreviewImg(null)}>
          <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white transition-all hover:bg-white/20">
            <X size={24} strokeWidth={3} />
          </button>
          <img src={`${BASE_URL}${previewImg}`} alt="" className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl ring-4 ring-white/10" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
