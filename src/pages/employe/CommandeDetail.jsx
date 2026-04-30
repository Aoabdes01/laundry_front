import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  fetchCommandeById, updateCommandeStatus, updateTapisEtat,
  addTapisImages, uploadEmployeImages
} from '../../store/employe/employeThunk';
import {
  selectSelectedCommande, selectIsLoadingSelectedCommande,
  selectIsUpdatingStatus, selectIsUpdatingTapis
} from '../../store/employe/employeSelectors';
import { COMMANDE_STATUS, TAPIS_ETAT, clearSelectedCommande } from '../../store/employe/employeSlice';
import { StatusBadge } from '../../components/StatusBadge';
import ConfirmModal from '../../components/ui/ConfirmModal';

const TAPIS_IMAGE_TYPE = { BEFORE: 'BEFORE', AFTER: 'AFTER' };

const BASE_URL = import.meta.env.VITE_API_URL;

export default function CommandeDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const commande = useSelector(selectSelectedCommande);

  const isLoading = useSelector(selectIsLoadingSelectedCommande);
  const isUpdatingStatus = useSelector(selectIsUpdatingStatus);
  const isUpdatingTapis = useSelector(selectIsUpdatingTapis);

  const [previewImg, setPreviewImg] = useState(null);
  const [uploadingTapisId, setUploadingTapisId] = useState(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const NEXT_COMMAND_LABEL = {
    [COMMANDE_STATUS.EN_ATTENTE]: t('workshop.detail.actions.validate'),
    [COMMANDE_STATUS.VALIDEE]: t('workshop.detail.actions.start'),
    [COMMANDE_STATUS.EN_TRAITEMENT]: t('workshop.detail.actions.ready'),
    [COMMANDE_STATUS.PRETE]: t('workshop.detail.actions.exit'),
    [COMMANDE_STATUS.RETOURNEE]: t('workshop.detail.actions.redeliver'),
  };

  const ETAT_CONFIG = useMemo(() => ({
    [TAPIS_ETAT.EN_ATTENTE]: { label: t('workshop.stats.en_attente'), next: TAPIS_ETAT.EN_NETTOYAGE },
    [TAPIS_ETAT.EN_NETTOYAGE]: { label: t('workshop.stats.en_traitement'), next: TAPIS_ETAT.NETTOYE },
    [TAPIS_ETAT.NETTOYE]: { label: t('status.prete'), next: null },
    [TAPIS_ETAT.LIVRE]: { label: t('status.livree'), next: null },
  }), [t]);

  const NEXT_COMMANDE_STATUS = {
    [COMMANDE_STATUS.EN_ATTENTE]: COMMANDE_STATUS.VALIDEE,
    [COMMANDE_STATUS.VALIDEE]: COMMANDE_STATUS.EN_TRAITEMENT,
    [COMMANDE_STATUS.EN_TRAITEMENT]: COMMANDE_STATUS.PRETE,
    [COMMANDE_STATUS.PRETE]: COMMANDE_STATUS.LIVREE,
    [COMMANDE_STATUS.RETOURNEE]: COMMANDE_STATUS.LIVREE,
  };

  useEffect(() => {
    dispatch(fetchCommandeById(id));
    return () => dispatch(clearSelectedCommande());
  }, [dispatch, id]);

  const handleStatusUpdate = async () => {
    const nextStatus = NEXT_COMMANDE_STATUS[commande.status];
    if (!nextStatus) return;

    try {
      await dispatch(updateCommandeStatus({ id: commande.id, newStatus: nextStatus })).unwrap();
      toast.success(t('workshop.detail.toasts.status_updated'));

      if (nextStatus === COMMANDE_STATUS.LIVREE) {
        navigate('/employe/dashboard');
      }
    } catch (err) {
      toast.error(err || t('workshop.detail.toasts.update_error'));
    }
  };

  const onStatusBtnClick = () => {
    const nextStatus = NEXT_COMMANDE_STATUS[commande.status];
    if (nextStatus === COMMANDE_STATUS.LIVREE) {
      setIsConfirmModalOpen(true);
    } else {
      handleStatusUpdate();
    }
  };

  const handleTapisStatusUpdate = async (commandeTapisId, currentEtat) => {
    const cfg = ETAT_CONFIG[currentEtat];
    if (!cfg?.next) return;
    try {
      await dispatch(updateTapisEtat({ tapisId: commandeTapisId, newEtat: cfg.next })).unwrap();
      toast.success(t('workshop.detail.toasts.item_updated'));
    } catch (err) {
      toast.error(err || t('common.error'));
    }
  };

  const handleBulkUpdate = async (targetEtat) => {
    const toUpdate = commande.commandeTapis.filter(ct => {
      const cfg = ETAT_CONFIG[ct.etat];
      return cfg?.next === targetEtat;
    });

    if (toUpdate.length === 0) return;

    setIsBulkUpdating(true);
    try {
      await Promise.all(toUpdate.map(ct =>
        dispatch(updateTapisEtat({ tapisId: ct.id, newEtat: targetEtat })).unwrap()
      ));
      toast.success(t('common.success_msg'));
      dispatch(fetchCommandeById(id));
    } catch (err) {
      toast.error(err || t('common.error'));
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleImageUpload = async (commandeTapisId, files, imageType) => {
    if (!files.length) return;
    setUploadingTapisId(commandeTapisId);
    try {
      const uploadedUrls = await dispatch(uploadEmployeImages(Array.from(files))).unwrap();
      const imageUrls = uploadedUrls.map(r => r.imageUrl);
      await dispatch(addTapisImages({ tapisId: commandeTapisId, imageUrls, type: imageType })).unwrap();
      await dispatch(fetchCommandeById(id));
      toast.success(t('workshop.detail.toasts.images_added'));
    } catch (err) {
      toast.error(err || t('workshop.detail.toasts.upload_error'));
    } finally {
      setUploadingTapisId(null);
    }
  };

  const completedTapis = commande?.commandeTapis?.filter(ct => ct.etat === TAPIS_ETAT.NETTOYE || ct.etat === TAPIS_ETAT.LIVRE).length || 0;
  const totalTapis = commande?.commandeTapis?.length || 0;
  const progressPct = totalTapis > 0 ? Math.round((completedTapis / totalTapis) * 100) : 0;
  const circumference = 2 * Math.PI * 50;
  const strokeDash = (progressPct / 100) * circumference;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-32 bg-surface rounded-2xl animate-pulse" />
        <div className="h-48 bg-surface rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="py-20 flex flex-col items-center text-center">
        <Package size={36} className="text-text-muted mb-3" />
        <h3 className="font-semibold text-text-primary mb-1">{t('workshop.detail.not_found')}</h3>
        <button onClick={() => navigate('/employe/dashboard')} className="bg-primary-600 text-white rounded-xl px-5 py-2.5 text-sm mt-3">{t('common.back')}</button>
      </div>
    );
  }

  const canAdvance = !!NEXT_COMMANDE_STATUS[commande.status];
  const isReadOnly = commande.status === COMMANDE_STATUS.LIVREE || commande.status === COMMANDE_STATUS.PAYEE;
  const pendingBulkCleaning = !isReadOnly && commande.commandeTapis.some(ct => ct.etat === TAPIS_ETAT.EN_ATTENTE);
  const pendingBulkReady = !isReadOnly && commande.commandeTapis.some(ct => ct.etat === TAPIS_ETAT.EN_NETTOYAGE);

  return (
    <div className="pb-16 max-w-6xl mx-auto px-4 md:px-0 animate-fade-in text-start">
      {/* 
      {/* HEADER & BACK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate('/employe/dashboard')}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted hover:text-text-primary transition-all active:scale-95 bg-surface px-4 py-2 rounded-xl border border-border/50 shadow-sm"
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
            <p className="text-sm font-black text-text-primary uppercase tracking-tight mb-1">{t('admin.pro_ui.archived_order', 'Commande Archivée')}</p>
            <p className="text-xs text-text-muted font-bold uppercase tracking-widest opacity-80 leading-relaxed">
              {t('workshop.pro_ui.archived_order_desc', "Cette commande a déjà été remise au livreur (Sortie de l'atelier).")}
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
              <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.detail.labels.order')}</p>
              {commande.status === COMMANDE_STATUS.RETOURNEE && (
                <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-widest ring-1 ring-red-100 dark:ring-red-500/20 flex items-center gap-1 ms-2">
                  <AlertCircle size={10} strokeWidth={3} /> {t('status.retournee')}
                </span>
              )}
            </div>
            <p className="text-2xl md:text-3xl font-black text-text-primary mb-4 tracking-tighter">#{commande.numeroCommande}</p>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={commande.status} />
              <span className="inline-flex items-center gap-2 text-xs font-black text-text-muted bg-background px-3 py-1.5 rounded-lg border border-border/50 uppercase tracking-widest">
                <CalendarDays size={14} />
                {new Date(commande.dateCreation || commande.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </div>

          {canAdvance && !isReadOnly && (
            <button
              onClick={onStatusBtnClick}
              disabled={isUpdatingStatus}
              className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white rounded-2xl px-8 py-5 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary-500/20 active:scale-95 disabled:opacity-50 self-start md:self-center group/btn"
            >
              {isUpdatingStatus ? <Loader2 size={20} className="animate-spin" /> : <ChevronRight size={20} strokeWidth={3} className="rtl:rotate-180 group-hover/btn:translate-x-1 transition-transform" />}
              {NEXT_COMMAND_LABEL[commande.status]}
            </button>
          )}
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      {/* {(pendingBulkCleaning || pendingBulkReady) && (
        <div className="bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/20 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 start-0 w-1.5 h-full bg-violet-500" />

          <div className="flex items-center gap-4 ps-2">
            <div className="w-12 h-12 bg-violet-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
              <Zap size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-black text-violet-700 dark:text-violet-400 uppercase tracking-tight mb-0.5">{t('workshop.table.view_all')}</p>
              <p className="text-xs text-violet-600/70 dark:text-violet-500/60 font-bold uppercase tracking-widest">{t('admin.pro_ui.bulk_actions', 'Actions groupées sur les articles')}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {pendingBulkCleaning && (
              <button
                onClick={() => handleBulkUpdate(TAPIS_ETAT.EN_NETTOYAGE)}
                disabled={isBulkUpdating}
                className="w-full sm:w-auto bg-surface hover:bg-background text-violet-600 border border-violet-200 dark:border-violet-500/30 rounded-xl px-6 py-3.5 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isBulkUpdating ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} strokeWidth={2.5} />}
                {t('admin.pro_ui.in_cleaning', 'En Nettoyage')}
              </button>
            )}
            {pendingBulkReady && (
              <button
                onClick={() => handleBulkUpdate(TAPIS_ETAT.NETTOYE)}
                disabled={isBulkUpdating}
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-6 py-3.5 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
              >
                {isBulkUpdating ? <Loader2 size={16} className="animate-spin" /> : <ListChecks size={16} strokeWidth={2.5} />}
                {t('admin.pro_ui.all_cleaned', 'Tout Nettoyé')}
              </button>
            )}
          </div>
        </div>
      )}  */}

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
                      <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.detail.sections.carpet', { index: idx + 1 })}</span>
                    </div>
                    <h3 className="font-black text-text-primary text-lg md:text-xl tracking-tighter uppercase leading-none">{tapis?.nom}</h3>
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
                      <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.detail.sections.before')}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-2">
                      {beforeImgs.map((img, i) => (
                        <div key={i} className="relative group/img flex-shrink-0">
                          <img src={`${BASE_URL}${img.imageUrl}`} alt="" className="w-full aspect-square rounded-2xl object-cover shadow-sm cursor-pointer border-2 border-border hover:border-primary-500 transition-all" onClick={() => setPreviewImg(img.imageUrl)} />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 rounded-2xl pointer-events-none transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Plus size={24} className="text-white drop-shadow-md" />
                          </div>
                        </div>
                      ))}
                      {!isReadOnly && (
                        <label className="w-full aspect-square rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-500/5 flex-shrink-0 transition-all group/btn bg-background">
                          {isUploading ? <Loader2 size={24} className="text-primary-500 animate-spin" /> : (
                            <>
                              <div className="w-10 h-10 rounded-[1rem] bg-surface flex items-center justify-center text-text-muted group-hover/btn:text-primary-500 transition-colors shadow-sm mb-2 border border-border/50">
                                <Plus size={20} strokeWidth={2.5} />
                              </div>
                              <span className="text-xs font-black text-text-muted uppercase tracking-[0.15em] group-hover/btn:text-primary-600">{t('workshop.pro_ui.add', 'Ajouter')}</span>
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
                      <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.detail.sections.after')}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-2">
                      {afterImgs.map((img, i) => (
                        <div key={i} className="relative group/img flex-shrink-0">
                          <img src={`${BASE_URL}${img.imageUrl}`} alt="" className="w-full aspect-square rounded-2xl object-cover shadow-sm cursor-pointer border-2 border-border hover:border-primary-500 transition-all" onClick={() => setPreviewImg(img.imageUrl)} />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 rounded-2xl pointer-events-none transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Plus size={24} className="text-white drop-shadow-md" />
                          </div>
                        </div>
                      ))}
                      {!isReadOnly && (
                        <label className="w-full aspect-square rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-500/5 flex-shrink-0 transition-all group/btn bg-background">
                          {isUploading ? <Loader2 size={24} className="text-primary-500 animate-spin" /> : (
                            <>
                              <div className="w-10 h-10 rounded-[1rem] bg-surface flex items-center justify-center text-text-muted group-hover/btn:text-primary-500 transition-colors shadow-sm mb-2 border border-border/50">
                                <Plus size={20} strokeWidth={2.5} />
                              </div>
                              <span className="text-xs font-black text-text-muted uppercase tracking-[0.15em] group-hover/btn:text-primary-600">{t('workshop.pro_ui.add', 'Ajouter')}</span>
                            </>
                          )}
                          <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(ct.id, e.target.files, TAPIS_IMAGE_TYPE.AFTER)} />
                        </label>
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 mt-8 border-t border-border/40 ms-2">
                  <span className="bg-background text-text-secondary text-xs font-black px-5 py-2.5 rounded-xl uppercase tracking-widest border border-border/50 shadow-sm self-start">
                    {t('workshop.detail.labels.qty', { count: ct.quantite })}
                  </span>
                  {/* {etatCfg?.next && !isReadOnly && (
                    <button
                      onClick={() => handleTapisStatusUpdate(ct.id, ct.etat)}
                      disabled={isUpdatingTapis}
                      className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-8 py-3 sm:py-4 sm:py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {isUpdatingTapis ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} strokeWidth={3} className="rtl:rotate-180" />}
                      {t('workshop.detail.actions.next_step', { label: ETAT_CONFIG[etatCfg.next]?.label })}
                    </button>
                  )} */}
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

            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-8 text-center relative z-10">{t('workshop.detail.progress.title')}</h3>

            <div className="flex justify-center mb-8 relative z-10">
              <svg viewBox="0 0 120 120" className="w-40 h-40 rotate-[-90deg] drop-shadow-md">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-border/50" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#3B82F6" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`}
                  className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-text-primary tracking-tighter leading-none">{progressPct}%</span>
                <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mt-2 bg-background px-2 py-0.5 rounded-md border border-border/50">{t('workshop.detail.progress.completed')}</span>
              </div>
            </div>

            <div className="bg-background rounded-2xl p-5 border border-border/50 shadow-sm relative z-10">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-3">
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
            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-2">{t('workshop.detail.logistics.title')}</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-background rounded-2xl p-5 border border-border/50 shadow-sm">
                <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-3">{t('workshop.detail.logistics.driver')}</p>
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
                  <p className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-3">{t('admin.users.phone')}</p>
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

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleStatusUpdate}
        title={t('workshop.detail.actions.exit')}
        message="Voulez-vous confirmer la sortie de cette commande ? Elle sera remise au livreur pour livraison et ne sera plus visible dans votre atelier."
        type="info"
      />

      {previewImg && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center md:items-start justify-center bg-black/95 p-0 animate-fade-in" onClick={() => setPreviewImg(null)}>
          <button onClick={() => setPreviewImg(null)} className="absolute top-6 end-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 border border-white/10 z-[10000]">
            <X size={24} />
          </button>
          <div className="w-full h-full flex items-center md:items-start justify-center overflow-hidden p-4 md:p-12 md:pt-32">
            <img 
              src={`${BASE_URL}${previewImg}`} 
              alt="zoom" 
              className="w-full h-full md:max-w-[80vw] md:max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500" 
              onClick={e => e.stopPropagation()} 
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
