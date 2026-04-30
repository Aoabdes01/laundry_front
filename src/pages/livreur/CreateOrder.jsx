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
      <div className="bg-background min-h-[calc(100vh-80px)] flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-surface rounded-2xl shadow-card p-8 max-w-md w-full text-center border border-border/60">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="text-primary-500" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">{t('driver.create_order.steps.title')}</h1>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 sm:py-4 mb-8 text-start flex items-start gap-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-medium text-amber-600 dark:text-amber-500 leading-snug">
              {t('driver.create_order.steps.notice')}
            </p>
          </div>
          <div className="text-start mb-8 space-y-4">
            {[
              { id: 1, text: t('driver.create_order.steps.step1') },
              { id: 2, text: t('driver.create_order.steps.step2') },
              { id: 3, text: t('driver.create_order.steps.step3') }
            ].map(step => (
              <div key={step.id} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-500 text-sm font-bold flex items-center justify-center shrink-0 border border-primary-500/20">
                  {step.id}
                </div>
                <p className="text-sm font-semibold text-text-secondary tracking-tight">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/livreur/clients')}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/10 active:scale-95"
            >
              <Users size={18} strokeWidth={2} /> {t('driver.create_order.buttons.select_client')}
            </button>
            <button
              onClick={() => navigate('/livreur')}
              className="w-full border border-border bg-surface hover:bg-background text-text-secondary rounded-xl py-3 text-xs font-semibold transition-colors"
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
    <div className="min-h-screen bg-background animate-fade-in pb-32">

      {/* TOPBAR */}
      <div className="fixed top-0 start-0 end-0 md:start-16 lg:start-64 z-[60] bg-surface border-b border-border h-14 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-lg hover:bg-background flex items-center justify-center transition-colors text-text-secondary"
          >
            <ArrowLeft size={18} className="rtl:rotate-180" />
          </button>
          <h2 className="text-base font-bold text-text-primary tracking-tight">{t('driver.create_order.title')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-primary-500 transition-colors relative">
            <Info size={18} />
            <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-500 flex items-center justify-center font-bold text-xs border border-primary-500/20">
            {pendingClient.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pt-16 px-4 sm:px-6">

        {/* CLIENT SUMMARY */}
        <div className="bg-surface rounded-2xl shadow-card p-5 mb-5 mt-4 animate-in slide-in-from-top duration-500 border border-border/40">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">{t('driver.create_order.client_details')}</p>
          <div className="flex items-start gap-4 text-start">
            <div className="w-12 h-12 bg-primary-500/10 text-primary-600 dark:text-primary-500 rounded-2xl flex items-center justify-center shrink-0 border border-primary-500/20">
              <UserCircle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">{pendingClient.name}</h3>
              <div className="flex flex-col gap-2 mt-3">
                <div className="flex items-center gap-2.5 text-text-secondary text-xs font-medium">
                  <Phone size={14} className="text-primary-500 shrink-0" />
                  <span className="truncate">{pendingClient.phones?.[0]?.phoneNumber}</span>
                </div>
                <div className="flex items-start gap-2.5 text-text-secondary text-xs font-medium">
                  <MapPin size={14} className="text-primary-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">
                    {pendingClient.addresses?.[0]?.address || t('driver.create_order.unknown_address')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ARTICLES SECTION */}
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="text-lg font-bold text-text-primary tracking-tight">{t('driver.create_order.articles.title')}</h3>
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('driver.create_order.articles.count', { count: articles.length })}</span>
        </div>

        {articles.map((article, index) => (
          <div key={article.id} className="bg-surface rounded-2xl shadow-card p-5 mb-5 animate-in slide-in-from-bottom duration-500 border border-border/40">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold text-primary-600 dark:text-primary-500 bg-primary-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wide border border-primary-500/20">{t('driver.create_order.article_label')} {index + 1}</span>
            </div>

            {/* ── TYPE SELECTION ─────────────────────────────────────────── */}
            <div className="space-y-2 mb-5 text-start">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">{t('driver.create_order.articles.type_label')}</label>
              <div className="relative">
                <select
                  value={article.carpetTypeId || ''}
                  onChange={(e) => handleTypeChange(index, e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none appearance-none h-[52px] text-text-primary"
                >
                  <option value="">{t('driver.create_order.articles.choose_type')}</option>
                  {carpetTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.nom} — {t.prixParM2} DH/m²</option>
                  ))}
                  {!carpetTypes.length && (
                    <option disabled>{t('driver.create_order.articles.no_types')}</option>
                  )}
                </select>
              </div>
            </div>

            {/* ── PRICING MODE TOGGLE ────────────────────────────────────── */}
            <div className="mb-5 text-start">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1 mb-2.5 block">{t('driver.create_order.articles.pricing_mode')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePricingModeChange(index, 'SIZE_BASED')}
                  className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold border transition-all ${article.pricingMode === 'SIZE_BASED'
                      ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/10'
                      : 'bg-background text-text-secondary border-border hover:border-primary-200'
                    }`}
                >
                  <Ruler size={14} />
                  {t('driver.create_order.articles.by_size')}
                </button>
                <button
                  type="button"
                  onClick={() => handlePricingModeChange(index, 'MANUAL')}
                  className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-bold border transition-all ${article.pricingMode === 'MANUAL'
                      ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/10'
                      : 'bg-background text-text-secondary border-border hover:border-primary-200'
                    }`}
                >
                  <DollarSign size={14} />
                  {t('driver.create_order.articles.manual')}
                </button>
              </div>
            </div>

            {/* ── SIZE-BASED MODE ────────────────────────────────────────── */}
            {article.pricingMode === 'SIZE_BASED' && (
              <div className="mb-5 space-y-4 text-start">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.width')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 2.00"
                      value={article.largeur}
                      onChange={(e) => handleDimensionChange(index, 'largeur', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none h-[52px] text-text-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.height')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 3.00"
                      value={article.hauteur}
                      onChange={(e) => handleDimensionChange(index, 'hauteur', e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none h-[52px] text-text-primary"
                    />
                  </div>
                </div>

                {article.prixCalcule && (
                  <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 space-y-4 text-start">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                          <Ruler size={14} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{t('driver.create_order.articles.labels.calculated_price')}</p>
                          <p className="text-xs font-semibold text-text-muted">
                            {article.largeur}m × {article.hauteur}m × {article.pricePerM2} DH/m²
                          </p>
                        </div>
                      </div>
                      <div className="bg-surface px-3.5 py-1.5 rounded-xl border border-border shadow-sm">
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{article.prixCalcule}</span>
                        <span className="text-xs font-bold text-text-muted ms-1">DH</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.final_price')}</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={article.prixFinal}
                          onChange={(e) => updateArticle(index, 'prixFinal', e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base font-bold focus:border-primary-400 outline-none h-[48px] text-text-primary shadow-sm"
                        />
                        <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">DH</span>
                      </div>
                    </div>

                    {article.prixFinal && article.prixCalcule &&
                      parseFloat(article.prixFinal) !== parseFloat(article.prixCalcule) && (
                        <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mt-2">
                          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wide">
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
              <div className="space-y-2 mb-5 text-start">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.estimated_price')}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t('driver.create_order.articles.placeholders.manual_price')}
                    value={article.prixEstime}
                    onChange={(e) => updateArticle(index, 'prixEstime', e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none h-[52px] text-text-primary"
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">DH</span>
                </div>
              </div>
            )}

            {/* ── QUANTITY ───────────────────────────────────────────────── */}
            <div className="space-y-2 mb-5 text-start">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.quantity')}</label>
              <div className="flex items-center border border-border rounded-xl overflow-hidden h-[52px] bg-background">
                <button
                  onClick={() => updateArticle(index, 'quantite', Math.max(1, article.quantite - 1))}
                  className="flex-1 h-full hover:bg-surface flex items-center justify-center transition-all bg-background/50"
                >
                  <Minus size={18} strokeWidth={2.5} className="text-text-secondary" />
                </button>
                <div className="w-20 text-center font-bold text-base text-text-primary bg-surface h-full flex items-center justify-center border-x border-border/50">
                  {article.quantite}
                </div>
                <button
                  onClick={() => updateArticle(index, 'quantite', article.quantite + 1)}
                  className="flex-1 h-full hover:bg-surface flex items-center justify-center transition-all bg-background/50"
                >
                  <Plus size={18} strokeWidth={2.5} className="text-text-secondary" />
                </button>
              </div>
            </div>

            {/* ── NOTES ─────────────────────────────────────────────────── */}
            <div className="space-y-2 mb-5 text-start">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.notes')}</label>
              <textarea
                rows={2}
                placeholder={t('driver.create_order.articles.placeholders.notes')}
                value={article.notes}
                onChange={(e) => updateArticle(index, 'notes', e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-medium focus:bg-surface focus:border-primary-400 outline-none resize-none shadow-sm min-h-[70px] transition-all text-text-primary"
              />
            </div>

            {/* ── PHOTOS ────────────────────────────────────────────────── */}
            <div className="space-y-3 text-start">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.photos', { count: article.photos.length })}</label>
              <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
                {article.photos.map((photo, pIdx) => (
                  <div
                    key={pIdx}
                    onClick={() => setMainPhoto(index, pIdx)}
                    className={`w-28 h-24 rounded-2xl object-cover shrink-0 cursor-pointer relative overflow-hidden group border-2 transition-all ${photo.isPrincipal ? 'border-primary-500 shadow-md' : 'border-transparent hover:border-primary-500/30'}`}
                  >
                    <img src={photo.preview} alt="photo" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemovePhoto(index, pIdx); }}
                      className="absolute top-1.5 end-1.5 w-6 h-6 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                    {photo.isPrincipal && (
                      <div className="absolute top-1.5 start-1.5 bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
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
                      className="w-28 h-24 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-background hover:border-primary-400 hover:bg-primary-500/5 transition-all group"
                    >
                      <Camera size={22} className="text-text-muted mb-1.5 group-hover:text-primary-500 transition-colors" />
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest group-hover:text-primary-600 dark:group-hover:text-primary-400">Photo</span>
                    </button>
                  </>
                )}
              </div>
              {!article.carpetTypeId && (
                <p className="text-xs font-medium text-text-muted text-center py-2 opacity-70">
                  {t('driver.create_order.articles.pricing_warning.prompt')}
                </p>
              )}
            </div>

            {/* DELETE ACTION */}
            {articles.length > 1 && (
              <button
                onClick={() => handleRemoveArticle(article.id)}
                className="mt-6 w-full flex items-center justify-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest py-3 border-t border-border/50 hover:text-red-600 transition-colors"
              >
                <Trash2 size={15} /> {t('driver.create_order.articles.actions.delete')}
              </button>
            )}
          </div>
        ))}

        {/* ADD ARTICLE BUTTON */}
        <button
          onClick={handleAddArticle}
          className="w-full border-2 border-dashed border-border py-8 flex flex-col items-center justify-center gap-2.5 rounded-2xl text-text-muted hover:border-primary-500 hover:bg-primary-500/5 hover:text-primary-600 dark:hover:text-primary-400 transition-all group mb-8"
        >
          <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
            <Plus size={24} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">{t('driver.create_order.buttons.add_article')}</span>
        </button>
      </div>

      {/* STICKY BOTTOM BAR */}
      <div className="fixed bottom-[64px] pb-safe md:bottom-0 start-0 end-0 md:start-16 lg:start-64 z-[110] flex justify-center px-4 sm:px-6">
        <div className="w-full max-w-4xl bg-surface/95 backdrop-blur-lg border-t border-x border-border rounded-t-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.1)] py-3 md:py-3 sm:py-4 px-5 flex flex-col items-stretch gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t('driver.create_order.footer.articles', { count: totalUnits })}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t('driver.create_order.footer.total')}</span>
              <span className="text-2xl font-bold text-primary-500 tracking-tighter leading-none">{totalEstime.toFixed(0)}</span>
              <span className="text-xs font-bold text-text-muted uppercase">DH</span>
            </div>
          </div>

          <button
            onClick={handleFinalizeOrder}
            disabled={loading.createOrder || isFinalizing}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span className="tracking-wide text-xs">
                  {finalizeStatus === 'compressing' ? t('driver.create_order.status.compressing') :
                    finalizeStatus === 'uploading' ? t('driver.create_order.status.uploading') :
                      t('driver.create_order.status.creating')}
                </span>
              </>
            ) : (
              <>
                <CheckCircle size={18} strokeWidth={2.5} />
                <span className="tracking-wide">{t('driver.create_order.finalize_btn')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
