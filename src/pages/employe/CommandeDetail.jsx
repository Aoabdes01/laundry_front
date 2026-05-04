import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Loader2, Package, CheckCircle2, Clock, Wrench, Truck,
  User, CalendarDays, ChevronRight, Upload, Plus, RefreshCw, X, Image as ImageIcon,
  Zap, ListChecks, AlertCircle, History, Phone, PieChart, Sun
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
  const circumference = 2 * Math.PI * 54;
  const strokeDash = (progressPct / 100) * circumference;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 opacity-40">
        <Loader2 size={40} className="animate-spin text-[var(--primary)] mb-4" />
        <p className="font-['Inter'] text-[12px] font-bold uppercase tracking-wider">{t('common.loading')}</p>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="py-20 flex flex-col items-center text-center px-6 opacity-40">
        <Package size={64} className="text-[var(--text-muted)] mb-4" />
        <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)] mb-1">{t('workshop.detail.not_found')}</h3>
        <button onClick={() => navigate('/employe/dashboard')} className="font-bold text-[var(--primary)] mt-3 uppercase tracking-wider text-[12px]">{t('common.back')}</button>
      </div>
    );
  }

  const canAdvance = !!NEXT_COMMANDE_STATUS[commande.status];
  const isReadOnly = commande.status === COMMANDE_STATUS.LIVREE || commande.status === COMMANDE_STATUS.PAYEE;

  return (
    <div className="max-w-2xl mx-auto pb-32 space-y-6 animate-fade-in text-start px-5 md:px-0">

      {/* HEADER & BACK */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employe/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[rgba(0,0,0,0.08)] rounded-[10px] text-[12px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-all active:scale-95 shadow-sm"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" />
          {t('common.back')}
        </button>
        <button
          onClick={() => dispatch(fetchCommandeById(id))}
          className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-[rgba(0,0,0,0.08)] text-[var(--text-secondary)] shadow-sm active:scale-95 transition-all"
        >
          <RefreshCw size={18} className={`${isLoading ? 'animate-spin' : ''} text-[var(--primary)]`} />
        </button>
      </div>

      {isReadOnly && (
        <div className="bg-white border border-[rgba(0,0,0,0.06)] rounded-[16px] p-5 flex items-center gap-4 text-start animate-in fade-in duration-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[var(--text-muted)]" />
          <div className="w-11 h-11 bg-[var(--bg)] rounded-[10px] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[rgba(0,0,0,0.06)]">
            <History size={20} />
          </div>
          <div>
            <p className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[var(--text)] uppercase tracking-tight">{t('admin.pro_ui.archived_order')}</p>
            <p className="font-['Inter'] text-[12px] text-[var(--text-muted)] font-medium mt-0.5">
              {t('workshop.pro_ui.archived_order_desc')}
            </p>
          </div>
        </div>
      )}

      {/* MAIN COMMAND CARD */}
      <div className="bg-white rounded-[20px] shadow-[var(--shadow-md)] p-6 border border-[rgba(0,0,0,0.06)] relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--primary)]" />
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Package size={100} className="text-[var(--primary)]" />
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package size={14} className="text-[var(--primary)]" />
              <p className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('workshop.detail.labels.order')}</p>
              {commande.status === COMMANDE_STATUS.RETOURNEE && (
                <span className="bg-[#FEF2F2] text-[#EF4444] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-[#FECACA] flex items-center gap-1 ms-2 animate-pulse">
                  <AlertCircle size={10} /> {t('status.retournee')}
                </span>
              )}
            </div>
            <p className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[var(--text)] tracking-tight">#{commande.numeroCommande}</p>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <StatusBadge status={commande.status} />
              <div className="flex items-center gap-2 bg-[var(--bg)] px-3 py-1.5 rounded-[10px] border border-[rgba(0,0,0,0.04)]">
                 <CalendarDays size={14} className="text-[var(--text-muted)]" />
                 <span className="font-['Inter'] text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                   {new Date(commande.dateCreation || commande.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}
                 </span>
              </div>
            </div>
          </div>

          {canAdvance && !isReadOnly && (
            <button
              onClick={onStatusBtnClick}
              disabled={isUpdatingStatus}
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[12px] py-4.5 text-[15px] font-bold uppercase tracking-wider shadow-[var(--shadow-teal)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-60 transition-all h-[56px]"
            >
              {isUpdatingStatus ? <Loader2 size={20} className="animate-spin" /> : <ChevronRight size={20} className="rtl:rotate-180" />}
              {NEXT_COMMAND_LABEL[commande.status]}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
          {/* ARTICLES LIST */}
          <div className="space-y-4">
            <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)] px-1">{t('admin.pro_ui.detailed_articles')}</h3>
            
            {commande.commandeTapis?.map((ct, idx) => {
              const tapisItem = ct.tapis;
              const etatCfg = ETAT_CONFIG[ct.etat];
              const beforeImgs = tapisItem?.images?.filter(i => i.imageType === TAPIS_IMAGE_TYPE.BEFORE) || [];
              const afterImgs = tapisItem?.images?.filter(i => i.imageType === TAPIS_IMAGE_TYPE.AFTER) || [];
              const isUploading = uploadingTapisId === ct.id;

              return (
                <div key={ct.id} className="bg-white rounded-[20px] shadow-[var(--shadow-md)] border border-[rgba(0,0,0,0.06)] overflow-hidden relative">
                  <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${ct.etat === TAPIS_ETAT.NETTOYE || ct.etat === TAPIS_ETAT.LIVRE ? 'bg-[#10B981]' : 'bg-[var(--primary)]'}`} />

                  <div className="p-5 border-b border-[rgba(0,0,0,0.04)] bg-[var(--bg)] flex items-center justify-between">
                    <div className="ps-2">
                      <div className="flex items-center gap-2 mb-0.5 opacity-60">
                        <span className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('workshop.detail.sections.carpet', { index: idx + 1 })}</span>
                      </div>
                      <h3 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)] uppercase tracking-tight">{tapisItem?.nom}</h3>
                    </div>
                    <StatusBadge status={ct.etat} />
                  </div>

                  {tapisItem?.description && (
                    <div className="mx-5 mt-5 p-4 bg-[#FFFBEB] rounded-[12px] border border-[#FDE68A] flex items-start gap-3">
                      <AlertCircle size={18} className="text-[#D97706] shrink-0 mt-0.5" />
                      <p className="font-['Inter'] text-[13px] font-medium text-[#D97706] leading-tight">{tapisItem.description}</p>
                    </div>
                  )}

                  <div className="p-5 space-y-6 ps-7">
                    {/* BEFORE IMAGES */}
                    <div className="space-y-3">
                      <p className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('workshop.detail.sections.before')}</p>
                      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                        {beforeImgs.map((img, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-[12px] overflow-hidden border border-[rgba(0,0,0,0.08)] cursor-pointer group shrink-0" onClick={() => setPreviewImg(img.imageUrl)}>
                            <img src={`${BASE_URL}${img.imageUrl}`} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Plus size={20} className="text-white" />
                            </div>
                          </div>
                        ))}
                        {!isReadOnly && (
                          <label className="w-24 h-24 rounded-[12px] border-2 border-dashed border-[rgba(0,0,0,0.08)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-surface)] transition-all shrink-0 bg-[var(--bg)]">
                            {isUploading ? <Loader2 size={20} className="text-[var(--primary)] animate-spin" /> : <Plus size={24} className="text-[var(--text-muted)]" />}
                            <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(ct.id, e.target.files, TAPIS_IMAGE_TYPE.BEFORE)} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* AFTER IMAGES */}
                    <div className="space-y-3">
                      <p className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('workshop.detail.sections.after')}</p>
                      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                        {afterImgs.map((img, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-[12px] overflow-hidden border border-[rgba(0,0,0,0.08)] cursor-pointer group shrink-0" onClick={() => setPreviewImg(img.imageUrl)}>
                            <img src={`${BASE_URL}${img.imageUrl}`} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Plus size={20} className="text-white" />
                            </div>
                          </div>
                        ))}
                        {!isReadOnly && (
                          <label className="w-24 h-24 rounded-[12px] border-2 border-dashed border-[rgba(0,0,0,0.08)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-surface)] transition-all shrink-0 bg-[var(--bg)]">
                            {isUploading ? <Loader2 size={20} className="text-[var(--primary)] animate-spin" /> : <Plus size={24} className="text-[var(--text-muted)]" />}
                            <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(ct.id, e.target.files, TAPIS_IMAGE_TYPE.AFTER)} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-[var(--bg)] border-t border-[rgba(0,0,0,0.04)] flex items-center justify-between ps-7">
                    <div className="flex items-center gap-2">
                       <p className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">QUANTITÉ:</p>
                       <span className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)]">{ct.quantite}</span>
                    </div>
                    {etatCfg?.next && !isReadOnly && (
                      <button
                        onClick={() => handleTapisStatusUpdate(ct.id, ct.etat)}
                        disabled={isUpdatingTapis}
                        className="bg-white border border-[var(--primary)] text-[var(--primary)] px-4 py-2 rounded-[10px] text-[12px] font-bold uppercase tracking-wider hover:bg-[var(--primary-surface)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isUpdatingTapis ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                        {ETAT_CONFIG[etatCfg.next]?.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PROGRESS & LOGISTICS */}
          <div className="space-y-6">

            {/* PROGRESS WIDGET */}
            <div className="bg-white rounded-[20px] shadow-[var(--shadow-md)] p-6 border border-[rgba(0,0,0,0.06)] relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                <PieChart size={80} />
              </div>

              <h3 className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6">{t('workshop.detail.progress.title')}</h3>

              <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-full h-full rotate-[-90deg]">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="54" fill="none" stroke="var(--primary)" strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`}
                    className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[var(--text)] tracking-tight leading-none">{progressPct}%</span>
                </div>
              </div>

              <div className="bg-[var(--bg)] rounded-[12px] p-3 border border-[rgba(0,0,0,0.04)] inline-flex items-center gap-2 px-4">
                <span className="font-['Inter'] text-[12px] font-bold text-[var(--text-secondary)]">{completedTapis} / {totalTapis}</span>
                <span className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('workshop.detail.progress.completed')}</span>
              </div>
            </div>

            {/* LOGISTICS WIDGET */}
            <div className="bg-white rounded-[20px] shadow-[var(--shadow-md)] p-6 border border-[rgba(0,0,0,0.06)] space-y-4">
              <h3 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[var(--text)] uppercase tracking-tight mb-2">{t('workshop.detail.logistics.title')}</h3>
              
              <div className="bg-[var(--bg)] rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] flex items-center gap-4">
                <div className="w-10 h-10 rounded-[10px] bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-[var(--primary)] shadow-sm shrink-0">
                  <Truck size={20} className="rtl:rotate-180" />
                </div>
                <div className="text-start overflow-hidden">
                  <p className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{t('workshop.detail.logistics.driver')}</p>
                  <p className="font-['Inter'] text-[13px] font-bold text-[var(--text)] truncate">
                    {commande.livreur?.name || t('workshop.detail.labels.not_assigned')}
                  </p>
                </div>
              </div>

              {commande.livreur?.phone && (
                <div className="bg-[var(--bg)] rounded-[14px] p-4 border border-[rgba(0,0,0,0.04)] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[10px] bg-[#ECFDF5] border border-[rgba(16,185,129,0.1)] flex items-center justify-center text-[#10B981] shadow-sm shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="text-start overflow-hidden">
                    <p className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{t('admin.users.phone')}</p>
                    <a href={`tel:${commande.livreur.phone}`} className="font-['Inter'] text-[13px] font-bold text-[var(--text)] hover:text-[var(--primary)] transition-colors">{commande.livreur.phone}</a>
                  </div>
                </div>
              )}
            </div>

          </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleStatusUpdate}
        title={t('workshop.detail.actions.exit')}
        message="Voulez-vous confirmer la sortie de cette commande ? Elle sera remise au livreur pour livraison."
        type="info"
      />

      {previewImg && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-0 animate-fade-in" onClick={() => setPreviewImg(null)}>
          <button onClick={() => setPreviewImg(null)} className="absolute top-6 end-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 border border-white/10 z-[10000]">
            <X size={24} />
          </button>
          <div className="w-full h-full flex items-center justify-center p-4">
            <img 
              src={`${BASE_URL}${previewImg}`} 
              alt="zoom" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500" 
              onClick={e => e.stopPropagation()} 
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
