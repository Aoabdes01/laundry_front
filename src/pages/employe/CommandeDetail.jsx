import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Loader2, Package, CheckCircle2, Clock, Wrench, Truck,
  User, CalendarDays, ChevronRight, Upload, Plus, RefreshCw, X, Image as ImageIcon,
  Zap, ListChecks, AlertCircle, History, Phone
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

const BASE_URL = import.meta.env.VITE_API_URL

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
    <div className="pb-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/employe/dashboard')} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary text-start transition-colors">
          <ArrowLeft size={16} className="rtl:rotate-180" />
          {t('workshop.detail.back')}
        </button>
        <button
          onClick={() => dispatch(fetchCommandeById(id))}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface border border-border/50 text-text-muted hover:bg-background transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin text-primary-500' : ''} />
        </button>
      </div>

      {isReadOnly && (
        <div className="bg-background border border-border rounded-2xl p-4 mb-5 flex items-center gap-3 text-start animate-in fade-in duration-500">
          <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-text-muted shadow-sm border border-border/50">
            <History size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-text-primary uppercase tracking-tight">Commande Archivée</p>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Cette commande a déjà été remise au livreur (Sortie).</p>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-card p-5 mb-5 text-start border border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('workshop.detail.labels.order')}</p>
              {commande.status === COMMANDE_STATUS.RETOURNEE && (
                <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ring-1 ring-red-100 dark:ring-red-500/20 flex items-center gap-1">
                  <AlertCircle size={8} /> {t('status.retournee')}
                </span>
              )}
            </div>
            <p className="text-3xl font-black text-text-primary mb-2 tracking-tight">#{commande.numeroCommande}</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={commande.status} />
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-text-muted bg-background px-2.5 py-1 rounded-full border border-border/50">
                <CalendarDays size={12} />
                {new Date(commande.dateCreation || commande.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </div>
          {canAdvance && !isReadOnly && (
            <button
              onClick={onStatusBtnClick}
              disabled={isUpdatingStatus}
              className="bg-primary-500 hover:bg-primary-600 text-white rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50 self-start sm:self-center whitespace-nowrap"
            >
              {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} className="rtl:rotate-180" />}
              {NEXT_COMMAND_LABEL[commande.status]}
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {(pendingBulkCleaning || pendingBulkReady) && (
        <div className="bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/20 rounded-2xl p-4 mb-5 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-500 text-white rounded-xl flex items-center justify-center shadow-md">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-violet-700 dark:text-violet-400 uppercase tracking-tight">{t('workshop.table.view_all')}</p>
              <p className="text-[10px] text-violet-600/70 dark:text-violet-500/60 font-bold uppercase tracking-widest">Actions groupées disponibles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingBulkCleaning && (
              <button
                onClick={() => handleBulkUpdate(TAPIS_ETAT.EN_NETTOYAGE)}
                disabled={isBulkUpdating}
                className="bg-surface hover:bg-background text-violet-600 border border-violet-200 dark:border-violet-500/30 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {isBulkUpdating ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                En Nettoyage
              </button>
            )}
            {pendingBulkReady && (
              <button
                onClick={() => handleBulkUpdate(TAPIS_ETAT.NETTOYE)}
                disabled={isBulkUpdating}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-md"
              >
                {isBulkUpdating ? <Loader2 size={14} className="animate-spin" /> : <ListChecks size={14} />}
                Tout Nettoyé
              </button>
            )}
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-3 lg:gap-5">
        <div className="lg:col-span-2 space-y-4">
          {commande.commandeTapis?.map((ct, idx) => {
            const tapis = ct.tapis;
            const etatCfg = ETAT_CONFIG[ct.etat];
            const beforeImgs = tapis?.images?.filter(i => i.imageType === TAPIS_IMAGE_TYPE.BEFORE) || [];
            const afterImgs = tapis?.images?.filter(i => i.imageType === TAPIS_IMAGE_TYPE.AFTER) || [];
            const isUploading = uploadingTapisId === ct.id;

            return (
              <div key={ct.id} className="bg-surface rounded-2xl shadow-card p-5 text-start border border-border/40 hover:shadow-card-hover transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('workshop.detail.sections.carpet', { index: idx + 1 })}</span>
                    <h3 className="font-black text-text-primary text-xl mt-0.5 tracking-tight uppercase">{tapis?.nom}</h3>
                  </div>
                  <StatusBadge status={ct.etat} />
                </div>

                {tapis?.description && (
                  <div className="bg-background rounded-2xl p-4 text-xs font-bold text-text-secondary italic mb-5 border border-border flex items-start gap-3">
                    <AlertCircle size={16} className="text-primary-500 shrink-0 mt-0.5" />
                    <p>{tapis.description}</p>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">{t('workshop.detail.sections.before')}</p>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {beforeImgs.map((img, i) => (
                      <div key={i} className="relative group flex-shrink-0">
                        <img src={`${BASE_URL}${img.imageUrl}`} alt="" className="w-24 h-24 rounded-2xl object-cover shadow-sm cursor-pointer ring-offset-2 hover:ring-2 ring-primary-500 transition-all" onClick={() => setPreviewImg(img.imageUrl)} />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-2xl pointer-events-none transition-opacity flex items-center justify-center">
                          <Plus size={20} className="text-white" />
                        </div>
                      </div>
                    ))}
                    {!isReadOnly && (
                      <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-background flex-shrink-0 transition-all group">
                        {isUploading ? <Loader2 size={24} className="text-primary-500 animate-spin" /> : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-text-muted group-hover:bg-surface group-hover:text-primary-500 transition-colors">
                              <Plus size={18} />
                            </div>
                            <span className="text-[9px] font-black text-text-muted mt-2 uppercase tracking-tight">{t('workshop.detail.sections.before')}</span>
                          </>
                        )}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(ct.id, e.target.files, TAPIS_IMAGE_TYPE.BEFORE)} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="mb-6 text-start">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">{t('workshop.detail.sections.after')}</p>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {afterImgs.map((img, i) => (
                      <div key={i} className="relative group flex-shrink-0">
                        <img src={`${BASE_URL}${img.imageUrl}`} alt="" className="w-24 h-24 rounded-2xl object-cover shadow-sm cursor-pointer ring-offset-2 hover:ring-2 ring-primary-500 transition-all" onClick={() => setPreviewImg(img.imageUrl)} />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-2xl pointer-events-none transition-opacity flex items-center justify-center">
                          <Plus size={20} className="text-white" />
                        </div>
                      </div>
                    ))}
                    {!isReadOnly && (
                      <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-background flex-shrink-0 transition-all group">
                        {isUploading ? <Loader2 size={24} className="text-primary-500 animate-spin" /> : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-text-muted group-hover:bg-surface group-hover:text-primary-500 transition-colors">
                              <Plus size={18} />
                            </div>
                            <span className="text-[9px] font-black text-text-muted mt-2 uppercase tracking-tight">{t('workshop.detail.sections.after')}</span>
                          </>
                        )}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(ct.id, e.target.files, TAPIS_IMAGE_TYPE.AFTER)} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  <span className="bg-background text-text-secondary text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest border border-border/50">{t('workshop.detail.labels.qty', { count: ct.quantite })}</span>
                  {etatCfg?.next && !isReadOnly && (
                    <button
                      onClick={() => handleTapisStatusUpdate(ct.id, ct.etat)}
                      disabled={isUpdatingTapis}
                      className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-primary-500/10 active:scale-95 disabled:opacity-50"
                    >
                      {isUpdatingTapis ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={13} className="rtl:rotate-180" />}
                      {t('workshop.detail.actions.next_step', { label: ETAT_CONFIG[etatCfg.next]?.label })}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-5 mt-5 lg:mt-0 text-start">
          <div className="bg-surface rounded-3xl shadow-card p-6 border border-border/40">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-6 text-center">{t('workshop.detail.progress.title')}</h3>
            <div className="flex justify-center mb-6 relative">
              <svg viewBox="0 0 120 120" className="w-32 h-32 md:w-44 md:h-44 rotate-[-90deg]">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className="text-border" strokeWidth="12" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#6366F1" strokeWidth="12"
                  strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`}
                  className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-text-primary tracking-tighter leading-none">{progressPct}%</span>
                <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mt-2">{t('workshop.detail.progress.completed')}</span>
              </div>
            </div>
            <div className="bg-background rounded-2xl p-4 border border-border/50">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span className="text-text-muted">Progression</span>
                <span className="text-primary-600">{completedTapis} / {totalTapis}</span>
              </div>
              <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-3xl shadow-card p-6 border border-border/40 space-y-4">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('workshop.detail.logistics.title')}</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-background rounded-2xl p-4 border border-border/50">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5">{t('workshop.detail.logistics.driver')}</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-primary-500 shadow-sm border border-border/50">
                    <User size={14} />
                  </div>
                  <p className="text-sm font-black text-text-primary uppercase tracking-tight">
                    {commande.livreur?.name || t('workshop.detail.labels.not_assigned')}
                  </p>
                </div>
              </div>
              {commande.livreur?.phone && (
                <div className="bg-background rounded-2xl p-4 border border-border/50">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1.5">{t('admin.users.phone')}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-primary-500 shadow-sm border border-border/50">
                      <Phone size={14} />
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

      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300" onClick={() => setPreviewImg(null)}>
          <button onClick={() => setPreviewImg(null)} className="absolute top-6 end-6 w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-95">
            <X size={24} />
          </button>
          <img src={`${BASE_URL}${previewImg}`} alt="" className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl ring-4 ring-white/10" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
