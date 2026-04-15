import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Plus, Minus, Trash2, Camera, X, CheckCircle,
  ChevronRight, ArrowLeft, Ruler, DollarSign,
  Loader2, UserCircle, MapPin, Phone, ShoppingBag,
  Info, Target, Calculator, AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createOrder, fetchCarpetTypes } from '../../store/livreur/livreurThunk';
import { selectPendingClient, selectCarpetTypes, selectLoading } from '../../store/livreur/livreurSelectors';
import { resetOrderCreated } from '../../store/livreur/livreurSlice';
import { compressImage } from '../../utils/imageCompression';

export default function CreateOrder() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pendingClient = useSelector(selectPendingClient);
  const carpetTypes = useSelector(selectCarpetTypes);
  const loading = useSelector(selectLoading);

  const [articles, setArticles] = useState([
    { id: Date.now(), carpetTypeId: '', nom: '', quantite: 1, prixEstime: '', prixParM2: 0, pricingMode: 'SIZE_BASED', largeur: '', hauteur: '', prixCalcule: '', prixFinal: '', photos: [], notes: '' }
  ]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeStatus, setFinalizeStatus] = useState(''); // compressing, uploading, creating
  const photoInputRefs = useRef({});

  useEffect(() => {
    dispatch(fetchCarpetTypes());
    if (!pendingClient) navigate('/livreur/register-client');
  }, [dispatch, pendingClient, navigate]);

  const handleAddArticle = () => {
    setArticles([...articles, { id: Date.now(), carpetTypeId: '', nom: '', quantite: 1, prixEstime: '', prixParM2: 0, pricingMode: 'SIZE_BASED', largeur: '', hauteur: '', prixCalcule: '', prixFinal: '', photos: [], notes: '' }]);
  };

  const handleRemoveArticle = (id) => {
    if (articles.length > 1) setArticles(articles.filter(a => a.id !== id));
  };

  const updateArticle = (index, field, value) => {
    const newArticles = [...articles];
    newArticles[index][field] = value;
    setArticles(newArticles);
  };

  const handleTypeChange = (index, typeId) => {
    const type = carpetTypes.find(t => t.id === parseInt(typeId));
    if (type) {
      const newArticles = [...articles];
      newArticles[index].carpetTypeId = type.id;
      newArticles[index].nom = type.nom;
      newArticles[index].pricePerM2 = type.prixParM2;
      setArticles(newArticles);
      if (newArticles[index].pricingMode === 'SIZE_BASED') {
        calculatePrice(index, newArticles[index].largeur, newArticles[index].hauteur, type.prixParM2);
      }
    }
  };

  const handlePricingModeChange = (index, mode) => {
    const newArticles = [...articles];
    newArticles[index].pricingMode = mode;
    if (mode === 'SIZE_BASED' && newArticles[index].carpetTypeId) {
      calculatePrice(index, newArticles[index].largeur, newArticles[index].hauteur, newArticles[index].pricePerM2);
    }
    setArticles(newArticles);
  };

  const handleDimensionChange = (index, field, val) => {
    const newArticles = [...articles];
    newArticles[index][field] = val;
    setArticles(newArticles);
    if (newArticles[index].carpetTypeId) {
      calculatePrice(index, newArticles[index].largeur, newArticles[index].hauteur, newArticles[index].pricePerM2);
    }
  };

  const calculatePrice = (index, w, h, p) => {
    if (w && h && p) {
      const calc = (parseFloat(w) * parseFloat(h) * parseFloat(p)).toFixed(2);
      updateArticle(index, 'prixCalcule', calc);
      updateArticle(index, 'prixFinal', calc);
    }
  };

  const handleImageUpload = async (index, e) => {
    const files = Array.from(e.target.files);
    if (articles[index].photos.length + files.length > 6) {
      return toast.warning(t('driver.create_order.toasts.max_photos'));
    }

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isPrincipal: false
    }));

    const newArticles = [...articles];
    newArticles[index].photos = [...newArticles[index].photos, ...newPhotos];
    if (newArticles[index].photos.length > 0 && !newArticles[index].photos.some(p => p.isPrincipal)) {
      newArticles[index].photos[0].isPrincipal = true;
    }
    setArticles(newArticles);
  };

  const handleRemovePhoto = (articleIndex, photoIndex) => {
    const newArticles = [...articles];
    const removed = newArticles[articleIndex].photos.splice(photoIndex, 1)[0];
    if (removed.isPrincipal && newArticles[articleIndex].photos.length > 0) {
      newArticles[articleIndex].photos[0].isPrincipal = true;
    }
    setArticles(newArticles);
  };

  const setMainPhoto = (articleIndex, photoIndex) => {
    const newArticles = [...articles];
    newArticles[articleIndex].photos.forEach((p, i) => p.isPrincipal = i === photoIndex);
    setArticles(newArticles);
  };

  const handleFinalizeOrder = async () => {
    const invalid = articles.some(a => !a.carpetTypeId || (a.pricingMode === 'SIZE_BASED' && !a.prixFinal) || (a.pricingMode === 'MANUAL' && !a.prixEstime));
    if (invalid) return toast.warning(t('driver.create_order.toasts.incomplete_articles'));

    setIsFinalizing(true);
    setFinalizeStatus('compressing');

    try {
      const finalizedArticles = await Promise.all(articles.map(async (art) => {
        const compressedPhotos = await Promise.all(art.photos.map(p => compressImage(p.file)));
        return {
          ...art,
          compressedPhotos,
          mainPhotoIndex: art.photos.findIndex(p => p.isPrincipal)
        };
      }));

      setFinalizeStatus('creating');
      const formData = new FormData();
      formData.append('clientId', pendingClient.id);

      finalizedArticles.forEach((art, index) => {
        formData.append(`tapis[${index}].nom`, art.nom);
        formData.append(`tapis[${index}].carpetTypeId`, art.carpetTypeId);
        formData.append(`tapis[${index}].quantite`, art.quantite);
        formData.append(`tapis[${index}].prixUnitaire`, art.pricingMode === 'SIZE_BASED' ? art.prixFinal : art.prixEstime);
        formData.append(`tapis[${index}].largeur`, art.largeur || '');
        formData.append(`tapis[${index}].hauteur`, art.hauteur || '');
        formData.append(`tapis[${index}].modeTarification`, art.pricingMode);
        formData.append(`tapis[${index}].description`, art.notes || '');
        formData.append(`tapis[${index}].mainImageIndex`, art.mainPhotoIndex >= 0 ? art.mainPhotoIndex : 0);

        art.compressedPhotos.forEach(file => {
          formData.append(`tapis[${index}].images`, file);
        });
      });

      await dispatch(createOrder(formData)).unwrap();
      toast.success(t('driver.create_order.toasts.success'));
      navigate('/livreur/dashboard');
    } catch (err) {
      toast.error(err || t('driver.create_order.toasts.error'));
    } finally {
      setIsFinalizing(false);
      setFinalizeStatus('');
    }
  };

  const totalUnits = articles.reduce((sum, a) => sum + parseInt(a.quantite || 0), 0);
  const totalEstime = articles.reduce((sum, a) => {
    const val = a.pricingMode === 'SIZE_BASED' ? (a.prixFinal || 0) : (a.prixEstime || 0);
    return sum + (parseFloat(val) * parseInt(a.quantite || 0));
  }, 0);

  if (!pendingClient) return null;

  return (
    <div className="min-h-screen bg-background animate-fade-in pb-40">

      {/* TOPBAR */}
      <div className="fixed top-0 start-0 end-0 md:start-16 lg:start-64 z-[60] bg-surface/80 backdrop-blur-xl border-b border-border/50 h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-4 md:px-8 flex items-center justify-between shadow-sm transition-all">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center transition-all active:scale-90 text-text-muted hover:text-primary-500 shadow-sm"
          >
            <ArrowLeft size={20} className="rtl:rotate-180" />
          </button>
          <div className="flex flex-col text-start">
            <h2 className="text-sm font-black text-text-primary tracking-tight uppercase">{t('driver.create_order.title')}</h2>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">{t('driver.pro_ui.active_collection')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-end">
            <span className="text-[10px] font-black text-text-primary uppercase tracking-tighter truncate max-w-[120px]">{pendingClient?.name}</span>
            <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{t('driver.pro_ui.current_client')}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center font-black text-sm border border-primary-200 shadow-sm uppercase">
            {pendingClient?.name?.[0]}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pt-24 px-4 md:px-0 text-start">

        {/* CLIENT SUMMARY */}
        <div className="bg-surface rounded-[2rem] shadow-card p-6 md:p-8 mb-8 animate-in slide-in-from-top duration-500 border border-border/40 relative overflow-hidden group">
          <div className="absolute top-0 end-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <UserCircle size={120} className="text-primary-500" />
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            <div className="w-16 h-16 bg-primary-500 text-white rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-xl shadow-primary-500/20 border-4 border-surface ring-1 ring-primary-500/10">
              <UserCircle size={32} />
            </div>
            <div className="flex-1 min-w-0 text-center md:text-start">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
                <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight leading-tight">{pendingClient?.name}</h3>
                <span className="inline-flex self-center md:self-auto items-center px-3 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-primary-500/10">
                  {t('driver.pro_ui.active_account')}
                </span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-y-2 gap-x-6">
                <div className="flex items-center gap-2 text-text-muted text-xs font-bold">
                  <Phone size={14} className="text-primary-500 shrink-0" />
                  <span>{pendingClient?.phones?.[0]?.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted text-xs font-bold">
                  <MapPin size={14} className="text-primary-500 shrink-0" />
                  <span className="truncate max-w-[250px]">
                    {pendingClient?.addresses?.[0]?.address || t('driver.create_order.unknown_address')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ARTICLES SECTION */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-primary-500" />
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">{t('driver.create_order.articles.title')}</h3>
          </div>
          <span className="bg-background border border-border/50 px-3 py-1 rounded-lg text-[10px] font-black text-text-muted uppercase tracking-widest">{t('driver.create_order.articles.count', { count: articles.length })}</span>
        </div>

        {articles.map((article, index) => (
          <div key={article.id} className="bg-surface rounded-[2rem] shadow-card p-6 md:p-8 mb-6 animate-in slide-in-from-bottom duration-500 border border-border/40 group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-primary-500/20">
                  {index + 1}
                </div>
                <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">{t('driver.create_order.article_label')}</span>
              </div>
              {articles.length > 1 && (
                <button
                  onClick={() => handleRemoveArticle(article.id)}
                  className="w-9 h-9 rounded-xl bg-background border border-border/50 flex items-center justify-center text-text-muted hover:text-red-500 transition-all active:scale-90"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                {/* TYPE SELECTION */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                    <ShoppingBag size={12} /> {t('driver.create_order.articles.type_label')}
                  </label>
                  <select
                    value={article.carpetTypeId || ''}
                    onChange={(e) => handleTypeChange(index, e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-2xl px-5 py-4 text-sm font-black focus:border-primary-500 outline-none appearance-none transition-all text-text-primary cursor-pointer"
                  >
                    <option value="">{t('driver.create_order.articles.choose_type')}</option>
                    {carpetTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.nom} — {t.prixParM2} DH/m²</option>
                    ))}
                  </select>
                </div>

                {/* PRICING MODE */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                    <DollarSign size={12} /> {t('driver.create_order.articles.pricing_mode')}
                  </label>
                  <div className="flex bg-background p-1.5 rounded-2xl border border-border/60 shadow-sm">
                    <button
                      type="button"
                      onClick={() => handlePricingModeChange(index, 'SIZE_BASED')}
                      className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${article.pricingMode === 'SIZE_BASED'
                        ? 'bg-surface text-primary-600 shadow-md border border-border/50'
                        : 'text-text-muted hover:text-text-primary'
                        }`}
                    >
                      <Ruler size={14} /> {t('driver.create_order.articles.by_size')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePricingModeChange(index, 'MANUAL')}
                      className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${article.pricingMode === 'MANUAL'
                        ? 'bg-surface text-primary-600 shadow-md border border-border/50'
                        : 'text-text-muted hover:text-text-primary'
                        }`}
                    >
                      <DollarSign size={14} /> {t('driver.create_order.articles.manual')}
                    </button>
                  </div>
                </div>

                {/* QUANTITY */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                    <CheckCircle size={12} /> {t('driver.create_order.articles.labels.quantity')}
                  </label>
                  <div className="flex items-center bg-background border border-border/60 rounded-2xl overflow-hidden p-1 shadow-sm">
                    <button
                      onClick={() => updateArticle(index, 'quantite', Math.max(1, article.quantite - 1))}
                      className="w-12 h-12 rounded-xl bg-surface border border-border/50 flex items-center justify-center transition-all active:scale-90 text-text-muted hover:text-primary-500 shadow-sm"
                    >
                      <Minus size={20} strokeWidth={3} />
                    </button>
                    <div className="flex-1 text-center font-black text-lg text-text-primary tracking-tighter">
                      {article.quantite}
                    </div>
                    <button
                      onClick={() => updateArticle(index, 'quantite', article.quantite + 1)}
                      className="w-12 h-12 rounded-xl bg-surface border border-border/50 flex items-center justify-center transition-all active:scale-90 text-text-muted hover:text-primary-500 shadow-sm"
                    >
                      <Plus size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* DYNAMIC MODE UI */}
                {article.pricingMode === 'SIZE_BASED' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3 text-start">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t('driver.create_order.articles.labels.width')}</label>
                        <div className="relative">
                          <input
                            type="number" step="0.01" placeholder="0.00"
                            value={article.largeur}
                            onChange={(e) => handleDimensionChange(index, 'largeur', e.target.value)}
                            className="w-full bg-background border border-border/60 rounded-2xl px-5 py-4 text-sm font-black focus:border-primary-500 outline-none text-text-primary placeholder:text-text-muted/30"
                          />
                          <span className="absolute end-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase opacity-40">M</span>
                        </div>
                      </div>
                      <div className="space-y-3 text-start">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t('driver.create_order.articles.labels.height')}</label>
                        <div className="relative">
                          <input
                            type="number" step="0.01" placeholder="0.00"
                            value={article.hauteur}
                            onChange={(e) => handleDimensionChange(index, 'hauteur', e.target.value)}
                            className="w-full bg-background border border-border/60 rounded-2xl px-5 py-4 text-sm font-black focus:border-primary-500 outline-none text-text-primary placeholder:text-text-muted/30"
                          />
                          <span className="absolute end-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase opacity-40">M</span>
                        </div>
                      </div>
                    </div>

                    {article.prixCalcule && (
                      <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-5 space-y-5 shadow-sm text-start">
                        <div className="flex items-center justify-between border-b border-primary-500/10 pb-4">
                          <div className="text-start">
                            <p className="text-[9px] font-black text-primary-400 uppercase tracking-widest mb-1">{t('driver.create_order.articles.labels.calculated_price')}</p>
                            <p className="text-[11px] font-black text-primary-600/60 uppercase">Tarif au m²: {article.pricePerM2} DH</p>
                          </div>
                          <div className="bg-surface px-4 py-2 rounded-xl border border-primary-500/20 shadow-sm">
                            <span className="text-lg font-black text-primary-600">{article.prixCalcule}</span>
                            <span className="text-[10px] font-black text-text-muted ms-1 uppercase">DH</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-primary-600 uppercase tracking-widest px-1">{t('driver.create_order.articles.labels.final_price')}</label>
                          <div className="relative">
                            <input
                              type="number" step="0.01"
                              value={article.prixFinal}
                              onChange={(e) => updateArticle(index, 'prixFinal', e.target.value)}
                              className="w-full bg-surface border border-primary-500/30 rounded-2xl px-5 py-4 text-lg font-black focus:border-primary-500 outline-none text-primary-700 shadow-xl shadow-primary-500/5"
                            />
                            <span className="absolute end-5 top-1/2 -translate-y-1/2 text-xs font-black text-primary-600/40 uppercase">Total DH</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 text-start">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t('driver.create_order.articles.labels.estimated_price')}</label>
                    <div className="relative">
                      <input
                        type="number" step="0.01"
                        placeholder={t('driver.pro_ui.dh_unit')}
                        value={article.prixEstime}
                        onChange={(e) => updateArticle(index, 'prixEstime', e.target.value)}
                        className="w-full bg-background border border-border/60 rounded-2xl px-5 py-4 text-lg font-black focus:border-primary-500 outline-none text-text-primary placeholder:text-text-muted/30 h-[64px]"
                      />
                      <span className="absolute end-5 top-1/2 -translate-y-1/2 text-xs font-black text-text-muted uppercase opacity-40">{t('driver.pro_ui.dh_unit')}</span>
                    </div>
                  </div>
                )}

                {/* PHOTOS */}
                <div className="space-y-4 text-start">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                    <Camera size={12} /> {t('driver.create_order.articles.labels.photos', { count: article.photos.length })}
                  </label>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
                    {article.photos.map((photo, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => setMainPhoto(index, pIdx)}
                        className={`w-32 h-28 rounded-2xl shrink-0 cursor-pointer relative overflow-hidden group border-4 transition-all ${photo.isPrincipal ? 'border-primary-500 shadow-xl shadow-primary-500/20' : 'border-background hover:border-primary-500/30 shadow-sm'}`}
                      >
                        <img src={photo.preview} alt="photo" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <CheckCircle size={24} className="text-white shadow-lg" />
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemovePhoto(index, pIdx); }}
                          className="absolute top-2 end-2 w-7 h-7 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg z-20"
                        >
                          <X size={16} strokeWidth={3} />
                        </button>
                        {photo.isPrincipal && (
                          <div className="absolute top-2 start-2 bg-primary-500 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg border border-white/20">
                            {t('driver.create_order.articles.labels.principal')}
                          </div>
                        )}
                      </div>
                    ))}

                    {article.photos.length < 6 && (
                      <>
                        <input
                          ref={el => photoInputRefs.current[index] = el}
                          type="file" accept="image/*" multiple className="hidden"
                          onChange={(e) => handleImageUpload(index, e)}
                        />
                        <button
                          type="button"
                          onClick={() => photoInputRefs.current[index]?.click()}
                          className="w-32 h-28 border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center bg-background hover:border-primary-500 hover:bg-primary-500/5 transition-all group shrink-0"
                        >
                          <div className="w-10 h-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center text-text-muted group-hover:text-primary-500 group-hover:border-primary-500/30 transition-all shadow-sm mb-2">
                            <Camera size={20} />
                          </div>
                          <span className="text-[9px] font-black text-text-muted uppercase tracking-widest group-hover:text-primary-600">{t('driver.pro_ui.capture')}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* NOTES */}
            <div className="mt-8 pt-8 border-t border-border/40 space-y-3 text-start">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                <Info size={12} /> {t('driver.create_order.articles.labels.notes')}
              </label>
              <textarea
                rows={2}
                placeholder={t('driver.create_order.articles.placeholders.notes')}
                value={article.notes}
                onChange={(e) => updateArticle(index, 'notes', e.target.value)}
                className="w-full bg-background border border-border/60 rounded-2xl px-5 py-4 text-sm font-bold focus:border-primary-500 outline-none transition-all resize-none min-h-[80px] text-text-primary placeholder:text-text-muted/30"
              />
            </div>
          </div>
        ))}

        {/* ADD ARTICLE BUTTON */}
        <button
          onClick={handleAddArticle}
          className="w-full border-2 border-dashed border-border/60 py-10 flex flex-col items-center justify-center gap-4 rounded-[2.5rem] text-text-muted hover:border-primary-500 hover:bg-primary-500/5 transition-all group mb-12 shadow-sm"
        >
          <div className="w-14 h-14 bg-background border border-border/50 rounded-[1.5rem] flex items-center justify-center text-text-muted group-hover:text-primary-500 group-hover:border-primary-500/30 transition-all shadow-sm">
            <Plus size={32} strokeWidth={3} />
          </div>
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-[0.2em] block mb-1 group-hover:text-text-primary transition-colors">{t('driver.create_order.buttons.add_article')}</span>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">Ajouter une autre prestation à cette commande</p>
          </div>
        </button>
      </div>

      {/* STICKY BOTTOM BAR */}
      <div className="fixed bottom-[64px] pb-safe md:bottom-0 start-0 end-0 md:start-16 lg:start-64 z-[110] flex justify-center px-4 sm:px-6">
        <div className="w-full max-w-4xl bg-surface/90 backdrop-blur-xl border border-border/50 rounded-[2.5rem] shadow-2xl shadow-primary-500/10 mb-4 md:mb-6 p-4 md:p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-8 px-4 flex-1">
            <div className="text-start border-r border-border/50 pe-8">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Volume</p>
              <p className="text-lg font-black text-text-primary tracking-tighter">{totalUnits} <span className="text-[10px] opacity-40 uppercase ms-0.5">{t('admin.dashboard.carpets')}</span></p>
            </div>
            <div className="text-start">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">{t('driver.pro_ui.estimated_total')}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-primary-600 tracking-tighter">{totalEstime.toLocaleString()}</span>
                <span className="text-[10px] font-black text-primary-600/60 uppercase">DH</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleFinalizeOrder}
            disabled={loading.createOrder || isFinalizing}
            className="w-full sm:w-auto min-w-[240px] bg-primary-600 hover:bg-primary-700 text-white rounded-[1.5rem] py-4 md:py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-60"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>{finalizeStatus === 'compressing' ? t('driver.pro_ui.processing') : finalizeStatus === 'uploading' ? t('driver.pro_ui.uploading') : t('driver.pro_ui.creating')}</span>
              </>
            ) : (
              <>
                <CheckCircle size={20} strokeWidth={3} />
                <span>{t('driver.create_order.finalize_btn')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
