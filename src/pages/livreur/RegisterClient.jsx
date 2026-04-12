import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  UserPlus, Search, QrCode, UserCircle, MapPin, 
  Target, Info, Phone, Send, ChevronRight,
  Loader2, X, AlertCircle
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
    <div className="max-w-5xl mx-auto space-y-6 pb-32 animate-fade-in px-4">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 text-start mt-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t('driver.register_client.title')}</h1>
          <p className="text-sm font-medium text-text-secondary mt-1">{t('driver.register_client.subtitle')}</p>
        </div>
        <button 
          onClick={handleShowForm}
          className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-500/10 active:scale-95 whitespace-nowrap"
        >
          <UserPlus size={18} strokeWidth={2.5} /> {t('driver.register_client.new_client_btn')}
        </button>
      </div>

      {/* SEARCH SECTION */}
      <div className="bg-surface rounded-2xl shadow-card p-2 flex items-center gap-3 border border-border/60 text-start">
        <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500 ms-1 shrink-0 border border-primary-500/20">
          <Search size={18} strokeWidth={2.5} />
        </div>
        <input 
          type="tel"
          placeholder={t('driver.register_client.search_placeholder')}
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="flex-1 py-3 text-sm font-semibold placeholder:font-medium placeholder:text-text-muted outline-none bg-transparent text-text-primary"
        />
        <button 
          onClick={() => alert(t('driver.register_client.scanner_unavailable'))}
          className="bg-background hover:bg-border/50 rounded-xl px-5 py-2.5 text-xs font-bold text-text-secondary transition-colors flex items-center gap-2 border border-border"
        >
          <QrCode size={16} />
          <span className="hidden sm:inline uppercase tracking-wide">{t('driver.register_client.scanner')}</span>
        </button>
      </div>

      {/* SEARCH RESULT CARD */}
      {searchResult && (
        <div className="border-2 border-primary-500 rounded-2xl p-6 mb-8 bg-surface flex flex-col sm:flex-row items-center gap-6 shadow-xl animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-500 flex items-center justify-center shrink-0 border border-primary-500/20">
            <span className="text-2xl font-bold">{searchResult.name?.[0]?.toUpperCase()}</span>
          </div>
          
          <div className="flex-1 text-center sm:text-start min-w-0">
             <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-text-primary tracking-tight truncate">{searchResult.name}</h3>
                <span className="bg-teal-500/10 text-teal-700 dark:text-teal-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-teal-500/20">
                   {t('driver.register_client.found_badge')}
                </span>
             </div>
             <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-text-secondary text-sm font-medium">
                   <Phone size={14} className="text-primary-500" />
                   {searchResult.phones?.[0]?.phoneNumber}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-text-secondary text-sm font-medium">
                   <MapPin size={14} className="text-primary-500" />
                   <span className="line-clamp-1">{searchResult.addresses?.[0]?.address || t('driver.register_client.no_address')}</span>
                </div>
             </div>
          </div>

          <button 
            onClick={() => handleSelectExisting(searchResult)}
            className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-8 py-3.5 text-sm font-bold shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2.5 transition-all active:scale-95"
          >
            {t('driver.register_client.choose_btn')} <ChevronRight size={18} strokeWidth={2.5} className="rtl:rotate-180" />
          </button>
        </div>
      )}

      {/* NOT FOUND TEXT */}
      {!searchResult && searchPhone.length >= 8 && !loading.search && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl py-4 px-6 text-center animate-in fade-in duration-300">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest flex items-center justify-center gap-2">
             <AlertCircle size={14} /> {t('driver.register_client.not_found')}
          </p>
        </div>
      )}

      {/* NEW CLIENT FORM SECTION */}
       <div ref={formRef} className={`space-y-6 transition-all duration-700 text-start ${showForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="flex items-center gap-4 mb-2">
           <h2 className="text-xl font-bold text-text-primary tracking-tight">{t('driver.register_client.form.title')}</h2>
           <div className="h-px flex-1 bg-border/60"></div>
        </div>

        {/* INFO BANNER */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-6 py-4 flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-blue-500 shadow-sm border border-border shrink-0">
              <Info size={20} />
           </div>
           <p className="text-sm font-medium text-blue-800 dark:text-blue-400 leading-relaxed">
              <span className="font-bold">{t('admin.details.manual_warning_title')}:</span> {t('driver.register_client.form.note')}
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT CARD — Informations Personnelles */}
          <div className="bg-surface rounded-2xl shadow-card border border-border/60 overflow-hidden">
             <div className="bg-background/50 px-6 py-4 border-b border-border/50 flex items-center gap-3">
                <UserCircle className="text-primary-500" size={18} strokeWidth={2.5} />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">{t('driver.register_client.form.personal_info')}</h3>
             </div>
             
             <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider px-1">{t('driver.register_client.form.labels.fullname')}</label>
                   <input 
                     type="text" 
                     placeholder="Ex: Jean Dupont"
                     value={formData.name}
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                     className="w-full bg-background border border-border rounded-xl px-5 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none transition-all h-[52px] text-text-primary"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider px-1">{t('driver.register_client.form.labels.phone_primary')}</label>
                   <input 
                     type="tel" 
                     placeholder="06 00 00 00 00"
                     value={formData.phone1}
                     onChange={(e) => setFormData({...formData, phone1: e.target.value})}
                     className="w-full bg-background border border-border rounded-xl px-5 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none transition-all h-[52px] text-text-primary"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider px-1">{t('driver.register_client.form.labels.phone_secondary')}</label>
                   <input 
                     type="tel" 
                     placeholder="05 00 00 00 00"
                     value={formData.phone2}
                     onChange={(e) => setFormData({...formData, phone2: e.target.value})}
                     className="w-full bg-background border border-border rounded-xl px-5 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none transition-all h-[52px] text-text-primary"
                   />
                </div>
             </div>
          </div>

          {/* RIGHT CARD — Adresse de Livraison */}
          <div className="bg-surface rounded-2xl shadow-card border border-border/60 overflow-hidden">
             <div className="bg-background/50 px-6 py-4 border-b border-border/50 flex items-center gap-3">
                <MapPin className="text-primary-500" size={18} strokeWidth={2.5} />
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">{t('driver.register_client.form.delivery_address')}</h3>
             </div>

             <div className="p-6 sm:p-8 space-y-6">
                <div className="bg-primary-500/5 border border-primary-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-primary-500 shadow-sm shrink-0">
                         <Target size={20} />
                      </div>
                       <div>
                         <p className="text-[10px] font-bold text-primary-400 uppercase tracking-wider mb-0.5">{t('driver.register_client.form.labels.gps')}</p>
                         <p className={`text-sm font-bold ${formData.latitude ? 'text-primary-700 dark:text-primary-500' : 'text-text-muted'}`}>
                            {formData.latitude ? `${formData.latitude}, ${formData.longitude}` : t('driver.register_client.form.gps_actions.not_captured')}
                         </p>
                      </div>
                   </div>
                   <button 
                     type="button"
                     onClick={handleCaptureGPS}
                     disabled={isLocating}
                     className="w-full sm:w-auto text-primary-600 dark:text-primary-500 text-xs font-bold uppercase tracking-wider hover:opacity-80 bg-surface px-4 py-2 rounded-lg shadow-sm border border-border active:scale-95 transition-all"
                   >
                     {isLocating ? <Loader2 className="animate-spin" size={16} /> : formData.latitude ? t('driver.register_client.form.gps_actions.recapture') : t('driver.register_client.form.gps_actions.capture')}
                   </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider px-1">{t('driver.register_client.form.labels.neighborhood')}</label>
                      <input 
                        type="text" placeholder="Ex: Maarif" 
                        value={formData.quartier}
                        onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none h-[52px] text-text-primary"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider px-1">{t('driver.register_client.form.labels.street')}</label>
                      <input 
                        type="text" placeholder={t('driver.register_client.form.placeholders.street')}
                        value={formData.rue}
                        onChange={(e) => setFormData({...formData, rue: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none h-[52px] text-text-primary"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider px-1">{t('driver.register_client.form.labels.building')}</label>
                      <input 
                        type="text" placeholder={t('driver.register_client.form.placeholders.building')}
                        value={formData.immeuble}
                        onChange={(e) => setFormData({...formData, immeuble: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none h-[52px] text-text-primary"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider px-1">{t('driver.register_client.form.labels.apartment')}</label>
                      <input 
                        type="text" placeholder={t('driver.register_client.form.placeholders.apartment')}
                        value={formData.appartement}
                        onChange={(e) => setFormData({...formData, appartement: e.target.value})}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none h-[52px] text-text-primary"
                      />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider px-1">{t('driver.register_client.form.labels.notes')}</label>
                   <textarea 
                     rows={3} 
                     placeholder={t('driver.register_client.form.placeholders.notes')}
                     value={formData.notes}
                     onChange={(e) => setFormData({...formData, notes: e.target.value})}
                     className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-semibold focus:bg-surface focus:border-primary-400 outline-none transition-all resize-none min-h-[100px] text-text-primary"
                   />
                </div>
             </div>
          </div>
        </div>

        {/* SUBMIT BUTTON - MOBILE: STICKY AT BOTTOM */}
        <div className="pt-6 w-full pb-32 md:pb-0">
          <div className="hidden md:block">
             <button
               onClick={handleSubmit}
               disabled={loading.createClient}
               className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-4 text-sm font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
             >
               {loading.createClient ? (
                 <Loader2 className="animate-spin" size={20} />
               ) : (
                 <>
                   <Send size={18} className="rtl:rotate-180" />
                   {t('driver.register_client.form.submit')}
                 </>
               )}
             </button>
          </div>

          <div className="md:hidden fixed bottom-[64px] pb-safe start-0 end-0 z-[110] flex justify-center px-4 sm:px-6">
             <div className="w-full max-w-5xl bg-surface/95 backdrop-blur-lg border-t border-x border-border/60 rounded-t-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.1)] py-3 md:py-4 px-5">
                <button
                  onClick={handleSubmit}
                  disabled={loading.createClient}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-xl h-[48px] flex items-center justify-center gap-3 text-sm font-bold shadow-lg shadow-primary-500/10 active:scale-95"
                >
                  {loading.createClient ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Send size={18} className="rtl:rotate-180" />
                      {t('driver.register_client.form.submit')}
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>

      </div>

    </div>
  );
}
