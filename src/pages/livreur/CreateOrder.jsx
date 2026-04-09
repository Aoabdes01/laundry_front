import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Plus, Minus, Trash2, MapPin, Phone,
  Package, Camera,
  X, ShoppingBag,
  ArrowLeft, Loader2, Info, AlertCircle,
  Users, UserCircle, CheckCircle, Pencil,
  Ruler, DollarSign, AlertTriangle, ToggleLeft, ToggleRight
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
      <div className="bg-[#F8F9FA] min-h-[calc(100vh-80px)] flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full text-center border border-border/50">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="text-primary-300" size={40} />
          </div>
          <h1 className="text-2xl font-black text-text-primary mb-2 uppercase tracking-tight">{t('driver.create_order.steps.title')}</h1>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 mb-8 text-start flex items-start gap-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-bold text-amber-700 leading-tight">
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
                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 text-sm font-black flex items-center justify-center shrink-0 shadow-sm border border-primary-100">
                  {step.id}
                </div>
                <p className="text-sm font-bold text-text-secondary uppercase tracking-tight">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/livreur/clients')}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-4 text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95"
            >
              <Users size={18} strokeWidth={3} /> {t('driver.create_order.buttons.select_client')}
            </button>
            <button
              onClick={() => navigate('/livreur')}
              className="w-full border border-border bg-white hover:bg-gray-50 text-text-secondary rounded-xl py-3.5 text-xs font-black uppercase tracking-widest transition-colors"
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
      // 1. COMPRESSION
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

      // 2. UPLOAD
      setFinalizeStatus('uploading');
      const withUrls = await Promise.all(withCompressed.map(async (article) => {
        if (!article.photos.length) return { ...article, uploadedUrls: [] };
        const formData = new FormData();
        article.photos.forEach(p => formData.append('images', p.file));
        const urls = await dispatch(uploadImages(formData)).unwrap();
        return { ...article, uploadedUrls: urls };
      }));

      // 3. CREATE ORDER
      setFinalizeStatus('creating');
      await dispatch(createOrder({
        clientId: pendingClient.id,
        tapis: withUrls.map(a => {
          const finalPrice = a.pricingMode === 'MANUAL'
            ? parseFloat(a.prixEstime)
            : parseFloat(a.prixFinal) || parseFloat(a.prixCalcule);
          return {
            nom: a.carpetTypeNom,
            description: a.notes,
            prixUnitaire: finalPrice,
            quantite: parseInt(a.quantite),
            imageUrls: a.uploadedUrls,
            mainImageIndex: a.photos.findIndex(p => p.isPrincipal) >= 0 ? a.photos.findIndex(p => p.isPrincipal) : 0,
            carpetTypeId: a.carpetTypeId,
            largeur: a.pricingMode === 'SIZE_BASED' ? parseFloat(a.largeur) || null : null,
            hauteur: a.pricingMode === 'SIZE_BASED' ? parseFloat(a.hauteur) || null : null,
            prixCalcule: a.pricingMode === 'SIZE_BASED' ? parseFloat(a.prixCalcule) || null : null,
            prixFinal: finalPrice,
            modeTarification: a.pricingMode,
          };
        })
      })).unwrap();

      toast.success(t('driver.create_order.toasts.success'));
      navigate('/livreur');
    } catch (err) {
      console.error("Finalization error:", err);
      toast.error(typeof err === 'string' ? err : t('driver.create_order.toasts.error'));
    } finally {
      setIsFinalizing(false);
      setFinalizeStatus('');
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8F9FA] animate-fade-in pb-32">

      {/* TOPBAR */}
      <div className="fixed top-0 start-0 end-0 md:start-16 lg:start-64 z-[60] bg-white border-b border-border h-14 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors text-text-secondary"
          >
            <ArrowLeft size={20} className="rtl:rotate-180" />
          </button>
          <h2 className="text-lg font-black text-text-primary tracking-tight uppercase">{t('driver.create_order.title')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-primary-500 transition-colors relative">
            <Info size={20} />
            <span className="absolute top-2 end-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-black text-xs border border-primary-200">
            {pendingClient.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pt-20 px-4 sm:px-6">

        {/* CLIENT SUMMARY */}
        <div className="bg-white rounded-2xl shadow-card p-4 mb-4 mt-2 animate-in slide-in-from-top duration-500">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{t('driver.create_order.client_details')}</p>
          <div className="flex items-start gap-4 text-start">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center shrink-0 shadow-sm">
              <UserCircle size={24} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-text-primary tracking-tight uppercase truncate leading-tight">{pendingClient.name}</h3>
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-2 text-text-muted text-xs font-medium">
                  <Phone size={14} className="text-primary-500 shrink-0" />
                  <span className="truncate">{pendingClient.phones?.[0]?.phoneNumber}</span>
                </div>
                <div className="flex items-start gap-2 text-text-muted text-xs font-medium">
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
        <div className="flex items-baseline justify-between mb-4 px-1">
          <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">{t('driver.create_order.articles.title')}</h3>
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('driver.create_order.articles.count', { count: articles.length })}</span>
        </div>

        {articles.map((article, index) => (
          <div key={article.id} className="bg-white rounded-2xl shadow-card p-4 mb-4 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-primary-500 bg-primary-50 px-2 py-1 rounded-lg uppercase tracking-widest">{t('driver.create_order.article_label')} {index + 1}</span>
            </div>

            {/* ── TYPE SELECTION ─────────────────────────────────────────── */}
            <div className="space-y-1.5 mb-4 text-start">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-wider px-1">{t('driver.create_order.articles.type_label')}</label>
              <select
                value={article.carpetTypeId || ''}
                onChange={(e) => handleTypeChange(index, e.target.value)}
                className="w-full bg-gray-50 border border-border rounded-xl px-3 py-3 text-xs font-bold focus:bg-white focus:border-primary-400 outline-none appearance-none uppercase h-[48px]"
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

            {/* ── PRICING MODE TOGGLE ────────────────────────────────────── */}
            <div className="mb-4 text-start">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-wider px-1 mb-2 block">{t('driver.create_order.articles.pricing_mode')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePricingModeChange(index, 'SIZE_BASED')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    article.pricingMode === 'SIZE_BASED'
                      ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                      : 'bg-gray-50 text-text-muted border-border hover:border-primary-300'
                  }`}
                >
                  <Ruler size={13} />
                  {t('driver.create_order.articles.by_size')}
                </button>
                <button
                  type="button"
                  onClick={() => handlePricingModeChange(index, 'MANUAL')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    article.pricingMode === 'MANUAL'
                      ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                      : 'bg-gray-50 text-text-muted border-border hover:border-primary-300'
                  }`}
                >
                  <DollarSign size={13} />
                  {t('driver.create_order.articles.manual')}
                </button>
              </div>
            </div>

            {/* ── SIZE-BASED MODE ────────────────────────────────────────── */}
            {article.pricingMode === 'SIZE_BASED' && (
              <div className="mb-4 space-y-3 text-start">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.width')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 2.00"
                      value={article.largeur}
                      onChange={(e) => handleDimensionChange(index, 'largeur', e.target.value)}
                      className="w-full bg-gray-50 border border-border rounded-xl px-3 py-3 text-xs font-bold focus:bg-white focus:border-primary-400 outline-none h-[48px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.height')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 3.00"
                      value={article.hauteur}
                      onChange={(e) => handleDimensionChange(index, 'hauteur', e.target.value)}
                      className="w-full bg-gray-50 border border-border rounded-xl px-3 py-3 text-xs font-bold focus:bg-white focus:border-primary-400 outline-none h-[48px]"
                    />
                  </div>
                </div>

                {article.prixCalcule && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 space-y-3 text-start">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Ruler size={13} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{t('driver.create_order.articles.labels.calculated_price')}</p>
                          <p className="text-[10px] font-bold text-blue-400">
                            {article.largeur}m × {article.hauteur}m × {article.pricePerM2} DH/m²
                          </p>
                        </div>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-200">
                        <span className="text-lg font-black text-blue-600">{article.prixCalcule}</span>
                        <span className="text-[9px] font-black text-blue-400 ms-1">DH</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest px-1">{t('driver.create_order.articles.labels.final_price')}</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={article.prixFinal}
                          onChange={(e) => updateArticle(index, 'prixFinal', e.target.value)}
                          className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 pe-10 text-sm font-black focus:border-primary-400 outline-none h-[44px] text-text-primary"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted">DH</span>
                      </div>
                    </div>

                    {article.prixFinal && article.prixCalcule &&
                      parseFloat(article.prixFinal) !== parseFloat(article.prixCalcule) && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
                          <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                          <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">
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
              <div className="space-y-1.5 mb-4 text-start">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.estimated_price')}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t('driver.create_order.articles.placeholders.manual_price')}
                    value={article.prixEstime}
                    onChange={(e) => updateArticle(index, 'prixEstime', e.target.value)}
                    className="w-full bg-gray-50 border border-border rounded-xl px-3 py-3 text-xs font-bold focus:bg-white focus:border-primary-400 outline-none h-[48px]"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted">DH</span>
                </div>
              </div>
            )}

            {/* ── QUANTITY ───────────────────────────────────────────────── */}
            <div className="space-y-1.5 mb-4 text-start">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.quantity')}</label>
              <div className="flex items-center border border-border rounded-xl overflow-hidden h-[48px] bg-gray-50">
                <button
                  onClick={() => updateArticle(index, 'quantite', Math.max(1, article.quantite - 1))}
                  className="flex-1 h-full hover:bg-white flex items-center justify-center transition-all bg-gray-100/50"
                >
                  <Minus size={18} strokeWidth={3} className="text-text-secondary" />
                </button>
                <div className="w-16 text-center font-black text-base text-text-primary bg-white h-full flex items-center justify-center border-x border-border/50">
                  {article.quantite}
                </div>
                <button
                  onClick={() => updateArticle(index, 'quantite', article.quantite + 1)}
                  className="flex-1 h-full hover:bg-white flex items-center justify-center transition-all bg-gray-100/50"
                >
                  <Plus size={18} strokeWidth={3} className="text-text-secondary" />
                </button>
              </div>
            </div>

            {/* ── NOTES ─────────────────────────────────────────────────── */}
            <div className="space-y-1.5 mb-4 text-start">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.notes')}</label>
              <textarea
                rows={2}
                placeholder={t('driver.create_order.articles.placeholders.notes')}
                value={article.notes}
                onChange={(e) => updateArticle(index, 'notes', e.target.value)}
                className="w-full bg-gray-50 border border-border rounded-xl px-3 py-3 text-xs font-bold focus:bg-white outline-none resize-none shadow-sm min-h-[60px]"
              />
            </div>

            {/* ── PHOTOS ────────────────────────────────────────────────── */}
            <div className="space-y-2 text-start">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-wider px-1">{t('driver.create_order.articles.labels.photos', { count: article.photos.length })}</label>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {article.photos.map((photo, pIdx) => (
                  <div
                    key={pIdx}
                    onClick={() => setMainPhoto(index, pIdx)}
                    className={`w-28 h-24 rounded-2xl object-cover shrink-0 cursor-pointer relative overflow-hidden group border-2 transition-all ${photo.isPrincipal ? 'border-primary-500' : 'border-transparent'}`}
                  >
                    <img src={photo.preview} alt="photo" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemovePhoto(index, pIdx); }}
                      className="absolute top-1 end-1 w-6 h-6 rounded-lg bg-black/60 flex items-center justify-center text-white"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                    {photo.isPrincipal && (
                      <div className="absolute top-1 start-1 bg-primary-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
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
                      className="w-28 h-24 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 shrink-0 hover:border-primary-400 hover:bg-primary-50/30 transition-all"
                    >
                      <Camera size={20} className="text-text-muted mb-1" />
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Photo</span>
                    </button>
                  </>
                )}
              </div>
              {!article.carpetTypeId && (
                <p className="text-[10px] font-bold text-text-muted text-center py-2 italic rtl:text-start">
                  {t('driver.create_order.articles.pricing_warning.prompt')}
                </p>
              )}
            </div>

            {/* DELETE ACTION */}
            {articles.length > 1 && (
              <button
                onClick={() => handleRemoveArticle(article.id)}
                className="mt-4 flex items-center justify-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest py-3 border-t border-gray-50"
              >
                <Trash2 size={14} /> {t('driver.create_order.articles.actions.delete')}
              </button>
            )}
          </div>
        ))}

        {/* ADD ARTICLE BUTTON */}
        <button
          onClick={handleAddArticle}
          className="w-full border-2 border-dashed border-border py-6 flex flex-col items-center justify-center gap-2 rounded-2xl text-text-muted hover:border-primary-500 hover:bg-primary-50/30 hover:text-primary-600 transition-all"
        >
          <Plus size={24} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('driver.create_order.buttons.add_article')}</span>
        </button>
      </div>

      {/* STICKY BOTTOM BAR */}
      <div className="fixed bottom-[64px] pb-safe md:bottom-0 start-0 end-0 md:start-16 lg:start-64 z-[110] bg-white/95 backdrop-blur-md border-t border-border/80 px-4 pt-4 sm:pb-4 flex flex-col items-stretch gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('driver.create_order.footer.articles', { count: totalUnits })}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('driver.create_order.footer.total')}</span>
            <span className="text-2xl font-black text-primary-500 tracking-tighter leading-none">{totalEstime.toFixed(0)}</span>
            <span className="text-[10px] font-black text-text-muted uppercase">DH</span>
          </div>
        </div>

        <button
          onClick={handleFinalizeOrder}
          disabled={loading.createOrder || isFinalizing}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-2xl py-4 text-sm font-black uppercase tracking-[0.1em] shadow-lg shadow-primary-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isFinalizing ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>
                {finalizeStatus === 'compressing' ? t('driver.create_order.status.compressing') :
                 finalizeStatus === 'uploading' ? t('driver.create_order.status.uploading') :
                 t('driver.create_order.status.creating')}
              </span>
            </>
          ) : (
            <>
              <CheckCircle size={20} strokeWidth={3} />
              {t('driver.create_order.finalize_btn')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

