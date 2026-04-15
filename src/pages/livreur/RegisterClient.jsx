import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  UserPlus, Search, QrCode, UserCircle, MapPin, 
  Target, Info, Phone, Send, ChevronRight,
  Loader2, X, AlertCircle, Navigation
} from 'lucide-react';
import { registerClient, searchClient } from '../../store/livreur/livreurThunk';
import { useTranslation } from 'react-i18next';
import { selectLoading, selectSearchResult } from '../../store/livreur/livreurSelectors';
import { setPendingClient, clearSearchResult } from '../../store/livreur/livreurSlice';

export default function RegisterClient() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectLoading);
  const searchResult = useSelector(selectSearchResult);
  const formRef = useRef(null);

  const [searchPhone, setSearchPhone] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone1: '',
    phone2: '',
    quartier: '',
    rue: '',
    immeuble: '',
    appartement: '',
    notes: '',
    latitude: '',
    longitude: ''
  });
  const [isLocating, setIsLocating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchPhone.length >= 8) {
        dispatch(searchClient(searchPhone));
      } else {
        dispatch(clearSearchResult());
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchPhone, dispatch]);

  const handleSelectExisting = (client) => {
    dispatch(setPendingClient(client));
    toast.success(t('driver.register_client.toasts.selected', { name: client.name }));
    navigate('/livreur/orders');
  };

  const handleCaptureGPS = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      toast.error(t('driver.register_client.toasts.geo_unsupported'));
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(4),
          longitude: pos.coords.longitude.toFixed(4)
        }));
        setIsLocating(false);
        toast.success(t('driver.register_client.toasts.gps_captured'));
      },
      (err) => {
        toast.error(t('driver.register_client.toasts.geo_error', { error: err.message }));
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleShowForm = () => {
    setShowForm(true);
    if (!formData.latitude) {
      handleCaptureGPS();
    }
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone1 || !formData.quartier || !formData.rue) {
      return toast.warning(t('driver.register_client.toasts.required_fields'));
    }

    const clientData = {
      name: formData.name,
      phones: [
        { phoneNumber: formData.phone1 },
        ...(formData.phone2 ? [{ phoneNumber: formData.phone2 }] : [])
      ],
      addresses: [
        {
          address: `${formData.immeuble ? 'Imm ' + formData.immeuble + ', ' : ''}${formData.appartement ? 'Appt ' + formData.appartement + ', ' : ''}${formData.rue}, ${formData.quartier}`,
          latitude: formData.latitude,
          longitude: formData.longitude,
          notes: formData.notes
        }
      ]
    };

    try {
      await dispatch(registerClient(clientData)).unwrap();
      toast.success(t('driver.register_client.toasts.registered'));
      navigate('/livreur/orders');
    } catch (err) {
      toast.error(err || t('driver.register_client.toasts.create_error'));
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-32 animate-fade-in px-4 md:px-0 text-start">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 mt-2">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">{t('driver.register_client.title')}</h1>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60 mt-1">{t('driver.register_client.subtitle')}</p>
        </div>
        <button 
          onClick={handleShowForm}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20 active:scale-95 whitespace-nowrap"
        >
          <UserPlus size={18} /> {t('driver.register_client.new_client_btn')}
        </button>
      </div>

      {/* SEARCH SECTION */}
      <div className="bg-surface rounded-3xl shadow-card p-2 flex items-center gap-3 border border-border/50 group focus-within:border-primary-500/50 transition-all">
        <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-primary-500 shrink-0 border border-border/50">
          <Search size={20} strokeWidth={3} />
        </div>
        <input 
          type="tel"
          placeholder={t('driver.register_client.search_placeholder')}
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="flex-1 py-3 text-sm font-black placeholder:font-bold placeholder:text-text-muted/50 outline-none bg-transparent text-text-primary"
        />
        <button 
          onClick={() => alert(t('driver.register_client.scanner_unavailable'))}
          className="bg-background hover:bg-surface rounded-2xl px-5 h-12 text-[9px] font-black text-text-muted uppercase tracking-widest transition-all flex items-center gap-2 border border-border/50 shadow-sm"
        >
          <QrCode size={16} />
          <span className="hidden sm:inline">{t('driver.register_client.scanner')}</span>
        </button>
      </div>

      {/* SEARCH RESULT CARD */}
      {searchResult && (
        <div className="border border-primary-500/30 rounded-[2.5rem] p-6 md:p-8 mt-8 bg-surface flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-primary-500/10 animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 end-0 p-8 opacity-5">
             <UserCircle size={120} className="text-primary-500" />
          </div>
          
          <div className="w-20 h-20 rounded-[2rem] bg-primary-500 text-white flex items-center justify-center shrink-0 shadow-xl shadow-primary-500/20 border-4 border-surface ring-1 ring-primary-500/10">
            <span className="text-3xl font-black">{searchResult.name?.[0]?.toUpperCase()}</span>
          </div>
          
          <div className="flex-1 text-center md:text-start min-w-0 relative z-10">
             <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                <h3 className="text-2xl font-black text-text-primary tracking-tight truncate">{searchResult.name}</h3>
                <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                   {t('driver.register_client.found_badge')}
                </span>
             </div>
             <div className="flex flex-wrap justify-center md:justify-start gap-y-2 gap-x-6">
                <div className="flex items-center gap-2 text-text-muted text-xs font-bold">
                   <Phone size={14} className="text-primary-500" />
                   {searchResult.phones?.[0]?.phoneNumber}
                </div>
                <div className="flex items-center gap-2 text-text-muted text-xs font-bold">
                   <MapPin size={14} className="text-primary-500" />
                   <span className="truncate max-w-[200px]">{searchResult.addresses?.[0]?.address || t('driver.register_client.no_address')}</span>
                </div>
             </div>
          </div>

          <button 
            onClick={() => handleSelectExisting(searchResult)}
            className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white rounded-2xl px-10 py-4 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 relative z-10"
          >
            {t('driver.register_client.choose_btn')} <ChevronRight size={18} strokeWidth={3} className="rtl:rotate-180" />
          </button>
        </div>
      )}

      {/* NOT FOUND TEXT */}
      {!searchResult && searchPhone.length >= 8 && !loading.search && (
        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl py-4 px-6 text-center mt-6 animate-in fade-in duration-300">
          <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center justify-center gap-2">
             <AlertCircle size={14} /> {t('driver.register_client.not_found')}
          </p>
        </div>
      )}

      {/* NEW CLIENT FORM SECTION */}
       <div ref={formRef} className={`space-y-8 transition-all duration-700 mt-12 ${showForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="flex items-center gap-4">
           <h2 className="text-xl font-black text-text-primary tracking-tight uppercase">{t('driver.register_client.form.title')}</h2>
           <div className="h-px flex-1 bg-border/40"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* LEFT CARD — Informations Personnelles */}
          <div className="bg-surface rounded-[2rem] shadow-card border border-border/50 overflow-hidden flex flex-col">
             <div className="bg-background/30 px-8 py-5 border-b border-border/50 flex items-center gap-3">
                <UserCircle className="text-primary-500" size={18} strokeWidth={3} />
                <h3 className="text-[10px] font-black text-text-primary uppercase tracking-widest">{t('driver.register_client.form.personal_info')}</h3>
             </div>
             
             <div className="p-6 md:p-10 space-y-8 flex-1">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                      <UserCircle size={12} /> {t('driver.register_client.form.labels.fullname')}
                   </label>
                   <input 
                     type="text" 
                     placeholder={t('driver.pro_ui.placeholder_fullname')}
                     value={formData.name}
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                     className="w-full bg-background border border-border/60 rounded-2xl px-5 py-4 text-sm font-black focus:border-primary-500 outline-none transition-all text-text-primary placeholder:text-text-muted/30"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                      <Phone size={12} /> {t('driver.register_client.form.labels.phone_primary')}
                   </label>
                   <input 
                     type="tel" 
                     placeholder={t('driver.pro_ui.placeholder_phone')}
                     value={formData.phone1}
                     onChange={(e) => setFormData({...formData, phone1: e.target.value})}
                     className="w-full bg-background border border-border/60 rounded-2xl px-5 py-4 text-sm font-black focus:border-primary-500 outline-none transition-all text-text-primary placeholder:text-text-muted/30"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                      <Phone size={12} className="opacity-40" /> {t('driver.register_client.form.labels.phone_secondary')}
                   </label>
                   <input 
                     type="tel" 
                     placeholder={t('driver.pro_ui.placeholder_phone_opt')}
                     value={formData.phone2}
                     onChange={(e) => setFormData({...formData, phone2: e.target.value})}
                     className="w-full bg-background border border-border/60 rounded-2xl px-5 py-4 text-sm font-black focus:border-primary-500 outline-none transition-all text-text-primary placeholder:text-text-muted/30"
                   />
                </div>
             </div>
          </div>

          {/* RIGHT CARD — Adresse de Livraison */}
          <div className="bg-surface rounded-[2rem] shadow-card border border-border/50 overflow-hidden flex flex-col">
             <div className="bg-background/30 px-8 py-5 border-b border-border/50 flex items-center gap-3">
                <MapPin className="text-primary-500" size={18} strokeWidth={3} />
                <h3 className="text-[10px] font-black text-text-primary uppercase tracking-widest">{t('driver.register_client.form.delivery_address')}</h3>
             </div>

             <div className="p-6 md:p-10 space-y-8 flex-1">
                <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface border border-border/50 flex items-center justify-center text-primary-500 shadow-sm shrink-0">
                         <Target size={22} strokeWidth={2.5} />
                      </div>
                       <div>
                         <p className="text-[9px] font-black text-primary-400 uppercase tracking-[0.2em] mb-0.5">{t('driver.register_client.form.labels.gps')}</p>
                         <p className={`text-sm font-black ${formData.latitude ? 'text-primary-600' : 'text-text-muted/40'}`}>
                            {formData.latitude ? `${formData.latitude}, ${formData.longitude}` : t('driver.register_client.form.gps_actions.not_captured')}
                         </p>
                      </div>
                   </div>
                   <button 
                     type="button"
                     onClick={handleCaptureGPS}
                     disabled={isLocating}
                     className="w-full sm:w-auto px-5 py-2.5 bg-surface text-primary-600 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm border border-border/50 active:scale-95 transition-all hover:bg-primary-50"
                   >
                     {isLocating ? <Loader2 className="animate-spin" size={16} /> : formData.latitude ? t('driver.register_client.form.gps_actions.recapture') : t('driver.register_client.form.gps_actions.capture')}
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2 text-start">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t('driver.register_client.form.labels.neighborhood')}</label>
                      <input 
                        type="text" placeholder={t('driver.pro_ui.placeholder_neighborhood')}
                        value={formData.quartier}
                        onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                        className="w-full bg-background border border-border/60 rounded-2xl px-4 py-4 text-sm font-black focus:border-primary-500 outline-none text-text-primary placeholder:text-text-muted/30"
                      />
                   </div>
                   <div className="space-y-2 text-start">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t('driver.register_client.form.labels.street')}</label>
                      <input 
                        type="text" placeholder={t('driver.register_client.form.placeholders.street')}
                        value={formData.rue}
                        onChange={(e) => setFormData({...formData, rue: e.target.value})}
                        className="w-full bg-background border border-border/60 rounded-2xl px-4 py-4 text-sm font-black focus:border-primary-500 outline-none text-text-primary placeholder:text-text-muted/30"
                      />
                   </div>
                   <div className="space-y-2 text-start">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t('driver.register_client.form.labels.building')}</label>
                      <input 
                        type="text" placeholder={t('driver.register_client.form.placeholders.building')}
                        value={formData.immeuble}
                        onChange={(e) => setFormData({...formData, immeuble: e.target.value})}
                        className="w-full bg-background border border-border/60 rounded-2xl px-4 py-4 text-sm font-black focus:border-primary-500 outline-none text-text-primary placeholder:text-text-muted/30"
                      />
                   </div>
                   <div className="space-y-2 text-start">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t('driver.register_client.form.labels.apartment')}</label>
                      <input 
                        type="text" placeholder={t('driver.register_client.form.placeholders.apartment')}
                        value={formData.appartement}
                        onChange={(e) => setFormData({...formData, appartement: e.target.value})}
                        className="w-full bg-background border border-border/60 rounded-2xl px-4 py-4 text-sm font-black focus:border-primary-500 outline-none text-text-primary placeholder:text-text-muted/30"
                      />
                   </div>
                </div>

                <div className="space-y-2 text-start">
                   <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">{t('driver.register_client.form.labels.notes')}</label>
                   <textarea 
                     rows={2} 
                     placeholder={t('driver.register_client.form.placeholders.notes')}
                     value={formData.notes}
                     onChange={(e) => setFormData({...formData, notes: e.target.value})}
                     className="w-full bg-background border border-border/60 rounded-2xl px-4 py-4 text-sm font-black focus:border-primary-500 outline-none transition-all resize-none min-h-[100px] text-text-primary placeholder:text-text-muted/30"
                   />
                </div>
             </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-6 w-full pb-12">
           <button
             onClick={handleSubmit}
             disabled={loading.createClient}
             className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-[1.5rem] py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
           >
             {loading.createClient ? (
               <Loader2 className="animate-spin" size={20} />
             ) : (
               <>
                 <Send size={18} strokeWidth={3} className="rtl:rotate-180" />
                 {t('driver.register_client.form.submit')}
               </>
             )}
           </button>
        </div>

      </div>

    </div>
  );
}
