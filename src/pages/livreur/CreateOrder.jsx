import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Plus, Minus, Trash2, MapPin, Phone,
  Camera,
  X, ShoppingBag,
  ArrowLeft, Loader2, Info, AlertCircle,
  Users, UserCircle, CheckCircle,
  Ruler, DollarSign, AlertTriangle
} from 'lucide-react';
import { createOrder, uploadImages, fetchCarpetTypes } from '../../store/livreur/livreurThunk';
import { useTranslation } from 'react-i18next';
import { selectLoading, selectPendingClient } from '../../store/livreur/livreurSelectors';
import { compressImage } from '../../utils/imageCompression';

const EMPTY_ARTICLE = () => ({
  id: Date.now() + Math.random(),
  carpetTypeId: null,
  carpetTypeNom: '',
  pricePerM2: null,
  pricingMode: 'SIZE_BASED',  // 'SIZE_BASED' | 'MANUAL'
  largeur: '',
  hauteur: '',
  prixCalcule: '',   // read-only result of W×H×pricePerM2
  prixFinal: '',     // editable override (pre-filled with prixCalcule)
  prixEstime: '',    // used in MANUAL mode
  quantite: 1,
  notes: '',
  photos: [],
  mainPhotoIndex: 0
});

export default function CreateOrder() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pendingClient = useSelector(selectPendingClient);
  const loading = useSelector(selectLoading);
  const carpetTypes = useSelector(state => state.livreur.carpetTypes);

  const [articles, setArticles] = useState([EMPTY_ARTICLE()]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeStatus, setFinalizeStatus] = useState('');
  const photoInputRefs = useRef({});

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      articles.forEach(article => {
        article.photos.forEach(photo => {
          if (photo.preview) URL.revokeObjectURL(photo.preview);
        });
      });
    };
  }, []);

  useEffect(() => { dispatch(fetchCarpetTypes()); }, [dispatch]);

  // ─── LANDING UI ────────────────────────────────────────────────────────────
  if (!pendingClient && !loading?.pendingClient) {
    return (
      <div className="bg-[var(--bg)] min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 animate-fade-in text-start">
        <div className="bg-white rounded-[20px] shadow-[var(--shadow-md)] p-8 max-w-md w-full border border-[rgba(0,0,0,0.06)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--primary)]" />
          
          <div className="w-16 h-16 bg-[var(--primary-surface)] rounded-[14px] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="text-[var(--primary)]" size={32} />
          </div>
          
          <h1 className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[var(--text)] tracking-tight text-center mb-2">
            {t('driver.create_order.steps.title')}
          </h1>
          
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[14px] p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="text-[#D97706] shrink-0 mt-0.5" size={18} />
            <p className="font-['Inter'] text-[13px] font-medium text-[#D97706] leading-tight">
              {t('driver.create_order.steps.notice')}
            </p>
          </div>

          <div className="space-y-5 mb-8">
            {[
              { id: 1, text: t('driver.create_order.steps.step1') },
              { id: 2, text: t('driver.create_order.steps.step2') },
              { id: 3, text: t('driver.create_order.steps.step3') }
            ].map(step => (
              <div key={step.id} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--primary-surface)] text-[var(--primary)] font-bold text-[12px] flex items-center justify-center shrink-0 border border-[rgba(13,115,119,0.1)]">
                  {step.id}
                </div>
                <p className="font-['Inter'] text-[13px] font-semibold text-[var(--text-secondary)] tracking-tight">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/livreur/clients')}
              className="w-full bg-[var(--primary)] text-white rounded-[12px] py-4 text-[14px] font-bold uppercase tracking-wider shadow-[var(--shadow-teal)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Users size={18} /> {t('driver.create_order.buttons.select_client')}
            </button>
            <button
              onClick={() => navigate('/livreur')}
              className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.06)] text-[var(--text-secondary)] rounded-[12px] py-4 text-[12px] font-bold uppercase tracking-wider hover:bg-white active:scale-95 transition-all"
            >
              {t('driver.create_order.buttons.back_dashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!pendingClient) return null;

  // ─── ARTICLE HANDLERS ───────────────────────────────────────────────────────

  const recalculatePrice = (article, updatedFields = {}) => {
    const merged = { ...article, ...updatedFields };
    const { largeur, hauteur, pricePerM2, pricingMode } = merged;
    if (pricingMode === 'SIZE_BASED' && largeur && hauteur && pricePerM2) {
      const calc = (parseFloat(largeur) * parseFloat(hauteur) * parseFloat(pricePerM2)).toFixed(2);
      return { ...merged, prixCalcule: calc, prixFinal: merged.prixFinal === merged.prixCalcule || !merged.prixFinal ? calc : merged.prixFinal };
    }
    return merged;
  };

  const handleTypeChange = (index, typeId) => {
    const selectedType = carpetTypes.find(t => String(t.id) === String(typeId));
    if (!selectedType) return;
    const newArticles = [...articles];
    newArticles[index] = recalculatePrice(newArticles[index], {
      carpetTypeId: selectedType.id,
      carpetTypeNom: selectedType.nom,
      pricePerM2: selectedType.prixParM2,
    });
    setArticles(newArticles);
  };

  const handleDimensionChange = (index, field, value) => {
    const newArticles = [...articles];
    newArticles[index] = recalculatePrice(newArticles[index], { [field]: value });
    setArticles(newArticles);
  };

  const handlePricingModeChange = (index, mode) => {
    const newArticles = [...articles];
    newArticles[index] = { ...newArticles[index], pricingMode: mode };
    setArticles(newArticles);
  };

  const updateArticle = (index, field, value) => {
    const newArticles = [...articles];
    newArticles[index][field] = value;
    setArticles(newArticles);
  };

  const handleAddArticle = () => setArticles([...articles, EMPTY_ARTICLE()]);

  const handleRemoveArticle = (id) => {
    if (articles.length > 1) {
      setArticles(articles.filter(a => a.id !== id));
      toast.info(t('driver.create_order.toasts.article_removed'));
    } else {
      toast.warning(t('driver.create_order.toasts.min_article'));
    }
  };

  // ─── PHOTO HANDLERS ─────────────────────────────────────────────────────────

  const handleImageUpload = async (index, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const currentPhotosCount = articles[index].photos.length;
    if (currentPhotosCount + files.length > 6) {
      return toast.warning(t('driver.create_order.toasts.max_photos'));
    }
    const newPhotos = files.map((file, idx) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrincipal: currentPhotosCount === 0 && idx === 0
    }));
    const newArticles = [...articles];
    newArticles[index].photos = [...newArticles[index].photos, ...newPhotos];
    setArticles(newArticles);
    toast.success(t('driver.create_order.toasts.photos_added', { count: files.length }));
    e.target.value = null;
  };

  const setMainPhoto = (articleIndex, photoIndex) => {
    const newArticles = [...articles];
    newArticles[articleIndex].photos = newArticles[articleIndex].photos.map((p, i) => ({
      ...p, isPrincipal: i === photoIndex
    }));
    setArticles(newArticles);
  };

  const handleRemovePhoto = (articleIndex, photoIndex) => {
    const newArticles = [...articles];
    const photoToRemove = newArticles[articleIndex].photos[photoIndex];
    if (photoToRemove.preview) URL.revokeObjectURL(photoToRemove.preview);
    const wasMain = photoToRemove.isPrincipal;
    newArticles[articleIndex].photos = newArticles[articleIndex].photos.filter((_, i) => i !== photoIndex);
    if (wasMain && newArticles[articleIndex].photos.length > 0) {
      newArticles[articleIndex].photos[0].isPrincipal = true;
    }
    setArticles(newArticles);
    toast.info(t('driver.create_order.toasts.photo_removed'));
  };

  // ─── TOTALS ─────────────────────────────────────────────────────────────────

  const getArticleEffectivePrice = (a) => {
    if (a.pricingMode === 'MANUAL') return parseFloat(a.prixEstime) || 0;
    return parseFloat(a.prixFinal) || parseFloat(a.prixCalcule) || 0;
  };

  const totalUnits = articles.reduce((s, a) => s + (parseInt(a.quantite) || 0), 0);
  const totalEstime = articles.reduce((s, a) => s + getArticleEffectivePrice(a) * (parseInt(a.quantite) || 0), 0);

  // ─── SUBMIT ─────────────────────────────────────────────────────────────────

  const handleFinalizeOrder = async () => {
    const invalid = articles.some(a => {
      if (!a.carpetTypeNom) return true;
      if (a.pricingMode === 'MANUAL') return !a.prixEstime;
      return !a.largeur || !a.hauteur || !a.prixFinal;
    });
    if (invalid) return toast.warning(t('driver.create_order.toasts.validation_error'));
    if (isFinalizing) return;
    setIsFinalizing(true);

    try {
      setFinalizeStatus('compressing');
      const withCompressed = await Promise.all(articles.map(async (article) => {
        if (!article.photos.length) return article;
        const compressed = await Promise.all(article.photos.map(async (p) => {
          try {
            const f = await compressImage(p.file, { maxWidth: 1200 });
            return { ...p, file: f };
          } catch { return p; }
        }));
        return { ...article, photos: compressed };
      }));

      setFinalizeStatus('uploading');
      const withUrls = await Promise.all(withCompressed.map(async (article) => {
        if (!article.photos.length) return { ...article, uploadedUrls: [] };
        const filesToUpload = article.photos.map(p => p.file);
        const uploadResults = await dispatch(uploadImages(filesToUpload)).unwrap();
        const urls = Array.isArray(uploadResults)
          ? uploadResults.map(r => typeof r === 'string' ? r : r.imageUrl)
          : [];
        return { ...article, uploadedUrls: urls };
      }));

      setFinalizeStatus('creating');
      await dispatch(createOrder({
        clientId: pendingClient.id,
        tapis: withUrls.map(a => {
          const finalPrice = a.pricingMode === 'MANUAL'
            ? (parseFloat(a.prixEstime) || 0)
            : (parseFloat(a.prixFinal) || parseFloat(a.prixCalcule) || 0);
          return {
            nom: a.carpetTypeNom,
            description: a.notes,
            prixUnitaire: finalPrice,
            quantite: parseInt(a.quantite) || 1,
            imageUrls: a.uploadedUrls,
            mainImageIndex: a.photos.findIndex(p => p.isPrincipal) >= 0 ? a.photos.findIndex(p => p.isPrincipal) : 0,
            carpetTypeId: a.carpetTypeId,
            largeur: a.pricingMode === 'SIZE_BASED' ? (parseFloat(a.largeur) || 0) : 0,
            hauteur: a.pricingMode === 'SIZE_BASED' ? (parseFloat(a.hauteur) || 0) : 0,
            prixCalcule: a.pricingMode === 'SIZE_BASED' ? (parseFloat(a.prixCalcule) || 0) : 0,
            prixFinal: finalPrice,
            modeTarification: a.pricingMode,
          };
        })
      })).unwrap();

      toast.success(t('driver.create_order.toasts.success'));
      navigate('/livreur');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : t('driver.create_order.toasts.error'));
    } finally {
      setIsFinalizing(false);
      setFinalizeStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] animate-fade-in pb-40 text-start">

      {/* TOPBAR */}
      <div className="fixed top-0 start-0 end-0 md:start-16 lg:start-64 z-[60] bg-white border-b border-[rgba(0,0,0,0.06)] h-[60px] px-5 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-[10px] bg-[var(--bg)] border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft size={18} className="rtl:rotate-180" />
          </button>
          <h2 className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[var(--text)] tracking-tight">{t('driver.create_order.title')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-[10px] bg-[var(--bg)] border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-[var(--text-secondary)] relative active:scale-95 transition-all">
            <Info size={18} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--danger)] rounded-full border-2 border-white"></span>
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D7377] to-[#14A3A8] text-white flex items-center justify-center font-bold text-[14px] shadow-[0_2px_8px_rgba(13,115,119,0.3)]">
            {pendingClient.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto pt-[80px] px-5">

        {/* CLIENT SUMMARY */}
        <div className="bg-white rounded-[20px] shadow-[var(--shadow-sm)] p-5 mb-6 animate-in slide-in-from-top duration-500 border border-[rgba(0,0,0,0.06)]">
          <p className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 px-1">{t('driver.create_order.client_details')}</p>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--primary-surface)] text-[var(--primary)] rounded-[14px] flex items-center justify-center shrink-0 border border-[rgba(13,115,119,0.1)]">
              <UserCircle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)] tracking-tight leading-tight">{pendingClient.name}</h3>
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center gap-2 text-[var(--text-secondary)] font-['Inter'] text-[13px] font-medium">
                  <Phone size={14} className="text-[#10B981] shrink-0" />
                  <span className="truncate">{pendingClient.phones?.[0]?.phoneNumber}</span>
                </div>
                <div className="flex items-start gap-2 text-[var(--text-secondary)] font-['Inter'] text-[13px] font-medium">
                  <MapPin size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-tight">
                    {pendingClient.addresses?.[0]?.address || t('driver.create_order.unknown_address')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ARTICLES SECTION */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)]">{t('driver.create_order.articles.title')}</h3>
          <span className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.1em]">{t('driver.create_order.articles.count', { count: articles.length })}</span>
        </div>

        {articles.map((article, index) => (
          <div key={article.id} className="bg-white rounded-[20px] shadow-[var(--shadow-md)] p-5 mb-5 animate-in slide-in-from-bottom duration-500 border border-[rgba(0,0,0,0.06)] relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <span className="font-['Inter'] text-[11px] font-bold text-[var(--primary)] bg-[var(--primary-surface)] px-3 py-1 rounded-full uppercase tracking-wider border border-[rgba(13,115,119,0.1)]">{t('driver.create_order.article_label')} {index + 1}</span>
            </div>

            {/* ── TYPE SELECTION ─────────────────────────────────────────── */}
            <div className="space-y-1.5 mb-5">
              <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.create_order.articles.type_label')}</label>
              <select
                value={article.carpetTypeId || ''}
                onChange={(e) => handleTypeChange(index, e.target.value)}
                className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-bold text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none h-[52px] transition-all"
              >
                <option value="">{t('driver.create_order.articles.choose_type')}</option>
                {carpetTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.nom} — {t.prixParM2} DH/m²</option>
                ))}
              </select>
            </div>

            {/* ── PRICING MODE TOGGLE ────────────────────────────────────── */}
            <div className="mb-5">
              <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1 mb-2.5 block">{t('driver.create_order.articles.pricing_mode')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePricingModeChange(index, 'SIZE_BASED')}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-[12px] text-[12px] font-bold border transition-all ${article.pricingMode === 'SIZE_BASED'
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-[var(--shadow-teal)]'
                      : 'bg-[var(--bg)] text-[var(--text-muted)] border-[rgba(0,0,0,0.08)] hover:bg-white'
                    }`}
                >
                  <Ruler size={14} />
                  {t('driver.create_order.articles.by_size').toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={() => handlePricingModeChange(index, 'MANUAL')}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-[12px] text-[12px] font-bold border transition-all ${article.pricingMode === 'MANUAL'
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-[var(--shadow-teal)]'
                      : 'bg-[var(--bg)] text-[var(--text-muted)] border-[rgba(0,0,0,0.08)] hover:bg-white'
                    }`}
                >
                  <DollarSign size={14} />
                  {t('driver.create_order.articles.manual').toUpperCase()}
                </button>
              </div>
            </div>

            {/* ── SIZE-BASED MODE ────────────────────────────────────────── */}
            {article.pricingMode === 'SIZE_BASED' && (
              <div className="mb-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.width')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 2.00"
                      value={article.largeur}
                      onChange={(e) => handleDimensionChange(index, 'largeur', e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-bold text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none h-[52px] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.height')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 3.00"
                      value={article.hauteur}
                      onChange={(e) => handleDimensionChange(index, 'hauteur', e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-bold text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none h-[52px] transition-all"
                    />
                  </div>
                </div>

                {article.prixCalcule && (
                  <div className="bg-[var(--primary-surface)] border border-[rgba(13,115,119,0.1)] rounded-[16px] p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white rounded-[10px] flex items-center justify-center shadow-sm text-[var(--primary)]">
                          <Ruler size={16} />
                        </div>
                        <div>
                          <p className="font-['Inter'] text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">{t('driver.create_order.articles.labels.calculated_price')}</p>
                          <p className="font-['Inter'] text-[11px] font-semibold text-[var(--text-muted)]">
                            {article.largeur}m × {article.hauteur}m × {article.pricePerM2} DH/m²
                          </p>
                        </div>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-[10px] border border-[rgba(0,0,0,0.06)] shadow-sm">
                        <span className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--primary)]">{article.prixCalcule}</span>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] ms-1">DH</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-['Inter'] text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.final_price')}</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={article.prixFinal}
                          onChange={(e) => updateArticle(index, 'prixFinal', e.target.value)}
                          className="w-full bg-white border border-[var(--primary)] rounded-[12px] px-4 py-3 text-lg font-bold text-[var(--text)] outline-none h-[52px] shadow-sm focus:ring-4 focus:ring-[var(--primary-glow)] transition-all"
                        />
                        <span className="absolute end-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[var(--text-muted)]">DH</span>
                      </div>
                    </div>

                    {article.prixFinal && article.prixCalcule &&
                      parseFloat(article.prixFinal) !== parseFloat(article.prixCalcule) && (
                        <div className="flex items-center gap-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] px-3 py-2">
                          <AlertTriangle size={14} className="text-[#D97706] shrink-0" />
                          <span className="font-['Inter'] text-[11px] font-bold text-[#D97706] uppercase tracking-tight">
                            {t('driver.create_order.articles.pricing_warning.modified', {
                              type: parseFloat(article.prixFinal) < parseFloat(article.prixCalcule) ? t('driver.create_order.articles.pricing_warning.discount') : t('driver.create_order.articles.pricing_warning.extra'),
                              diff: Math.abs(parseFloat(article.prixCalcule) - parseFloat(article.prixFinal)).toFixed(2)
                            })}
                          </span>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* ── MANUAL MODE ───────────────────────────────────────────── */}
            {article.pricingMode === 'MANUAL' && (
              <div className="space-y-1.5 mb-5">
                <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.estimated_price')}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t('driver.create_order.articles.placeholders.manual_price')}
                    value={article.prixEstime}
                    onChange={(e) => updateArticle(index, 'prixEstime', e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-bold text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none h-[52px] transition-all"
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[var(--text-muted)]">DH</span>
                </div>
              </div>
            )}

            {/* ── QUANTITY ───────────────────────────────────────────────── */}
            <div className="space-y-1.5 mb-5">
              <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.quantity')}</label>
              <div className="flex items-center border border-[rgba(0,0,0,0.08)] rounded-[12px] overflow-hidden h-[52px] bg-[var(--bg)]">
                <button
                  onClick={() => updateArticle(index, 'quantite', Math.max(1, article.quantite - 1))}
                  className="flex-1 h-full hover:bg-white flex items-center justify-center transition-all active:scale-90"
                >
                  <Minus size={20} className="text-[var(--text-secondary)]" />
                </button>
                <div className="w-20 text-center font-bold text-lg text-[var(--text)] bg-white h-full flex items-center justify-center border-x border-[rgba(0,0,0,0.06)]">
                  {article.quantite}
                </div>
                <button
                  onClick={() => updateArticle(index, 'quantite', article.quantite + 1)}
                  className="flex-1 h-full hover:bg-white flex items-center justify-center transition-all active:scale-90"
                >
                  <Plus size={20} className="text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>

            {/* ── NOTES ─────────────────────────────────────────────────── */}
            <div className="space-y-1.5 mb-5">
              <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.notes')}</label>
              <textarea
                rows={2}
                placeholder={t('driver.create_order.articles.placeholders.notes')}
                value={article.notes}
                onChange={(e) => updateArticle(index, 'notes', e.target.value)}
                className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-medium focus:bg-white focus:border-[var(--primary)] outline-none resize-none shadow-sm min-h-[80px] transition-all text-[var(--text)]"
              />
            </div>

            {/* ── PHOTOS ────────────────────────────────────────────────── */}
            <div className="space-y-3">
              <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.photos', { count: article.photos.length })}</label>
              <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
                {article.photos.map((photo, pIdx) => (
                  <div
                    key={pIdx}
                    onClick={() => setMainPhoto(index, pIdx)}
                    className={`w-28 h-24 rounded-[16px] shrink-0 cursor-pointer relative overflow-hidden group border-2 transition-all ${photo.isPrincipal ? 'border-[var(--primary)] shadow-md' : 'border-transparent'}`}
                  >
                    <img src={photo.preview} alt="photo" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemovePhoto(index, pIdx); }}
                      className="absolute top-1.5 end-1.5 w-6 h-6 rounded-[6px] bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-[#EF4444] transition-colors"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                    {photo.isPrincipal && (
                      <div className="absolute bottom-0 left-0 right-0 bg-[var(--primary)] text-white text-[9px] font-bold py-1 text-center uppercase tracking-wider">
                        {t('driver.create_order.articles.labels.principal')}
                      </div>
                    )}
                  </div>
                ))}

                {article.photos.length < 6 && (
                  <>
                    <input
                      ref={el => photoInputRefs.current[index] = el}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(index, e)}
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRefs.current[index]?.click()}
                      className="w-28 h-24 border-2 border-dashed border-[rgba(0,0,0,0.08)] rounded-[16px] flex flex-col items-center justify-center cursor-pointer bg-[var(--bg)] hover:border-[var(--primary)] hover:bg-[var(--primary-surface)] transition-all group"
                    >
                      <Camera size={22} className="text-[var(--text-muted)] mb-1.5 group-hover:text-[var(--primary)] transition-colors" />
                      <span className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider group-hover:text-[var(--primary)]">Photo</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* DELETE ACTION */}
            {articles.length > 1 && (
              <button
                onClick={() => handleRemoveArticle(article.id)}
                className="mt-6 w-full flex items-center justify-center gap-2 text-[#EF4444] font-['Inter'] text-[11px] font-bold uppercase tracking-[0.1em] py-4 border-t border-[rgba(0,0,0,0.04)] hover:bg-[#FEF2F2] transition-colors rounded-b-[20px]"
              >
                <Trash2 size={15} /> {t('driver.create_order.articles.actions.delete')}
              </button>
            )}
          </div>
        ))}

        {/* ADD ARTICLE BUTTON */}
        <button
          onClick={handleAddArticle}
          className="w-full border-2 border-dashed border-[rgba(0,0,0,0.08)] py-10 flex flex-col items-center justify-center gap-3 rounded-[20px] text-[var(--text-muted)] hover:border-[var(--primary)] hover:bg-[var(--primary-surface)] hover:text-[var(--primary)] transition-all active:scale-[0.98] group mb-12"
        >
          <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-[rgba(0,0,0,0.06)] group-hover:scale-110 transition-transform">
            <Plus size={24} strokeWidth={2.5} className="text-[var(--primary)]" />
          </div>
          <span className="font-['Inter'] text-[12px] font-bold uppercase tracking-widest">{t('driver.create_order.buttons.add_article')}</span>
        </button>
      </div>

      {/* STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 start-0 end-0 md:start-16 lg:start-64 z-[110] flex justify-center">
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-[16px] border-t border-[rgba(0,0,0,0.06)] rounded-t-[24px] shadow-[0_-12px_40px_rgba(0,0,0,0.08)] pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 px-6 flex flex-col items-stretch gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col">
              <span className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('driver.create_order.footer.articles', { count: totalUnits })}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-['Inter'] text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{t('driver.create_order.footer.total')}</span>
              <span className="font-['Plus_Jakarta_Sans'] text-[28px] font-bold text-[var(--primary)] tracking-tight leading-none">{totalEstime.toFixed(0)}</span>
              <span className="text-[12px] font-bold text-[var(--text-muted)] uppercase">DH</span>
            </div>
          </div>

          <button
            onClick={handleFinalizeOrder}
            disabled={loading.createOrder || isFinalizing}
            className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[14px] py-4.5 text-[15px] font-bold shadow-[var(--shadow-teal)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-60 transition-all h-[56px]"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span className="uppercase tracking-wider">
                  {finalizeStatus === 'compressing' ? t('driver.create_order.status.compressing') :
                    finalizeStatus === 'uploading' ? t('driver.create_order.status.uploading') :
                      t('driver.create_order.status.creating')}
                </span>
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                <span className="uppercase tracking-wider">{t('driver.create_order.finalize_btn')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
