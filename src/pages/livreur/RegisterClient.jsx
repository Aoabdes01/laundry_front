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

  const validateMoroccanPhone = (phone) => {
    if (!phone) return true; // Optional or handled by NotBlank
    const sanitized = phone.replace(/[\s-]/g, '');
    
    // Local: 0[567]XXXXXXXX
    if (sanitized.startsWith('0')) {
      return sanitized.length === 10 && /^[567]/.test(sanitized[1]);
    }
    
    // International: +212[567]XXXXXXXX or 212[567]XXXXXXXX
    if (sanitized.startsWith('+212')) {
      return sanitized.length === 13 && /^[567]/.test(sanitized[4]);
    } else if (sanitized.startsWith('212')) {
      return sanitized.length === 12 && /^[567]/.test(sanitized[3]);
    }
    
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone1 || !formData.quartier || !formData.rue) {
      return toast.warning(t('driver.register_client.toasts.required_fields'));
    }

    if (!validateMoroccanPhone(formData.phone1)) {
      return toast.error("Format de téléphone invalide (Ex: 0612345678 ou +212612345678)");
    }
    
    if (formData.phone2 && !validateMoroccanPhone(formData.phone2)) {
      return toast.error("Format de téléphone secondaire invalide");
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
    <div className="max-w-2xl mx-auto pb-32 animate-fade-in px-5 text-start">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 mb-6 mt-2">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[var(--text)] tracking-tight uppercase">
            {t('driver.register_client.title')}
          </h1>
          <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] mt-1">
            {t('driver.register_client.subtitle')}
          </p>
        </div>
        <button 
          onClick={handleShowForm}
          className="w-full bg-[var(--primary)] text-white rounded-[12px] py-4 text-[14px] font-bold uppercase tracking-wider shadow-[var(--shadow-teal)] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <UserPlus size={18} /> {t('driver.register_client.new_client_btn')}
        </button>
      </div>

      {/* SEARCH SECTION */}
      <div className="bg-white rounded-[16px] shadow-[var(--shadow-sm)] p-1.5 flex items-center gap-3 border border-[rgba(0,0,0,0.06)] group focus-within:ring-4 focus-within:ring-[var(--primary-glow)] focus-within:border-[var(--primary)] transition-all">
        <div className="w-11 h-11 bg-[var(--bg)] rounded-[12px] flex items-center justify-center text-[var(--text-secondary)] shrink-0 border border-[rgba(0,0,0,0.06)]">
          <Search size={20} />
        </div>
        <input 
          type="tel"
          placeholder={t('driver.register_client.search_placeholder')}
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="flex-1 py-3 text-sm font-bold placeholder:text-[var(--text-muted)] outline-none bg-transparent text-[var(--text)]"
        />
        <button 
          onClick={() => alert(t('driver.register_client.scanner_unavailable'))}
          className="bg-[var(--bg)] hover:bg-white rounded-[12px] px-4 h-11 text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-wider transition-all flex items-center gap-2 border border-[rgba(0,0,0,0.06)] active:scale-95"
        >
          <QrCode size={18} />
          <span className="hidden sm:inline">{t('driver.register_client.scanner')}</span>
        </button>
      </div>

      {/* SEARCH RESULT CARD */}
      {searchResult && (
        <div className="border border-[var(--primary)] rounded-[20px] p-6 mt-6 bg-white flex flex-col items-center gap-6 shadow-[var(--shadow-md)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
             <UserCircle size={100} className="text-[var(--primary)]" />
          </div>
          
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0D7377] to-[#14A3A8] text-white flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(13,115,119,0.3)]">
            <span className="text-3xl font-bold font-['Plus_Jakarta_Sans']">{searchResult.name?.[0]?.toUpperCase()}</span>
          </div>
          
          <div className="text-center min-w-0 relative z-10 w-full">
             <div className="flex flex-col items-center gap-2 mb-4">
                <h3 className="font-['Plus_Jakarta_Sans'] text-[22px] font-bold text-[var(--text)] tracking-tight truncate">{searchResult.name}</h3>
                <span className="bg-[#ECFDF5] text-[#10B981] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-[#A7F3D0]">
                   {t('driver.register_client.found_badge')}
                </span>
             </div>
             <div className="flex flex-col gap-3 px-2">
                <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)] font-['Inter'] text-[13px] font-medium">
                   <Phone size={14} className="text-[#10B981]" />
                   {searchResult.phones?.[0]?.phoneNumber}
                </div>
                <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)] font-['Inter'] text-[13px] font-medium">
                   <MapPin size={14} className="text-[var(--primary)]" />
                   <span className="truncate">{searchResult.addresses?.[0]?.address || t('driver.register_client.no_address')}</span>
                </div>
             </div>
          </div>

          <button 
            onClick={() => handleSelectExisting(searchResult)}
            className="w-full bg-[var(--primary)] text-white rounded-[12px] py-4 text-[14px] font-bold uppercase tracking-wider shadow-[var(--shadow-teal)] flex items-center justify-center gap-2 active:scale-95 transition-all relative z-10"
          >
            {t('driver.register_client.choose_btn')} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* NOT FOUND TEXT */}
      {!searchResult && searchPhone.length >= 8 && !loading.search && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px] py-4 px-6 text-center mt-6 animate-in fade-in duration-300">
          <p className="font-['Inter'] text-[12px] font-bold text-[#D97706] uppercase tracking-wider flex items-center justify-center gap-2">
             <AlertCircle size={16} /> {t('driver.register_client.not_found')}
          </p>
        </div>
      )}

      {/* NEW CLIENT FORM SECTION */}
       <div ref={formRef} className={`space-y-6 transition-all duration-700 mt-10 ${showForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="flex items-center gap-3">
           <h2 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)] uppercase tracking-tight">{t('driver.register_client.form.title')}</h2>
           <div className="h-px flex-1 bg-[rgba(0,0,0,0.06)]"></div>
        </div>

        <div className="space-y-6">
          
          {/* INFORMATIONS PERSONNELLES */}
          <div className="bg-white rounded-[20px] shadow-[var(--shadow-sm)] border border-[rgba(0,0,0,0.06)] overflow-hidden">
             <div className="bg-[var(--bg)] px-6 py-4 border-b border-[rgba(0,0,0,0.06)] flex items-center gap-3">
                <UserCircle className="text-[var(--primary)]" size={18} />
                <h3 className="font-['Inter'] text-[12px] font-bold text-[var(--text)] uppercase tracking-wider">{t('driver.register_client.form.personal_info')}</h3>
             </div>
             
             <div className="p-6 space-y-6">
                <div className="space-y-1.5">
                   <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.register_client.form.labels.fullname')}</label>
                   <input 
                     type="text" 
                     placeholder={t('driver.pro_ui.placeholder_fullname')}
                     value={formData.name}
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                     className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-bold text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all"
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.register_client.form.labels.phone_primary')}</label>
                    <input 
                      type="tel" 
                      placeholder="Ex: 0612345678"
                      value={formData.phone1}
                      onChange={(e) => setFormData({...formData, phone1: e.target.value})}
                      className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-bold text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all"
                    />
                </div>

                <div className="space-y-1.5">
                   <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.register_client.form.labels.phone_secondary')}</label>
                    <input 
                      type="tel" 
                      placeholder="Optionnel"
                      value={formData.phone2}
                      onChange={(e) => setFormData({...formData, phone2: e.target.value})}
                      className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-bold text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all"
                    />
                </div>
             </div>
          </div>

          {/* ADRESSE DE LIVRAISON */}
          <div className="bg-white rounded-[20px] shadow-[var(--shadow-sm)] border border-[rgba(0,0,0,0.06)] overflow-hidden">
             <div className="bg-[var(--bg)] px-6 py-4 border-b border-[rgba(0,0,0,0.06)] flex items-center gap-3">
                <MapPin className="text-[var(--primary)]" size={18} />
                <h3 className="font-['Inter'] text-[12px] font-bold text-[var(--text)] uppercase tracking-wider">{t('driver.register_client.form.delivery_address')}</h3>
             </div>

             <div className="p-6 space-y-6">
                <div className="bg-[var(--primary-surface)] border border-[rgba(13,115,119,0.1)] rounded-[16px] p-4 flex flex-col items-center gap-4">
                   <div className="flex items-center gap-4 w-full">
                      <div className="w-11 h-11 rounded-[10px] bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-[var(--primary)] shadow-sm shrink-0">
                         <Target size={22} />
                      </div>
                       <div className="flex-1">
                         <p className="font-['Inter'] text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider mb-0.5">{t('driver.register_client.form.labels.gps')}</p>
                         <p className={`font-['Inter'] text-[13px] font-bold ${formData.latitude ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                            {formData.latitude ? `${formData.latitude}, ${formData.longitude}` : t('driver.register_client.form.gps_actions.not_captured')}
                         </p>
                      </div>
                   </div>
                   <button 
                     type="button"
                     onClick={handleCaptureGPS}
                     disabled={isLocating}
                     className="w-full py-3 bg-white text-[var(--primary)] text-[12px] font-bold uppercase tracking-wider rounded-[10px] shadow-sm border border-[rgba(13,115,119,0.15)] active:scale-95 transition-all hover:bg-[var(--bg)]"
                   >
                     {isLocating ? <Loader2 className="animate-spin mx-auto" size={18} /> : formData.latitude ? t('driver.register_client.form.gps_actions.recapture') : t('driver.register_client.form.gps_actions.capture')}
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.register_client.form.labels.neighborhood')}</label>
                      <input 
                        type="text" placeholder={t('driver.pro_ui.placeholder_neighborhood')}
                        value={formData.quartier}
                        onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                        className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-bold text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.register_client.form.labels.street')}</label>
                      <input 
                        type="text" placeholder={t('driver.register_client.form.placeholders.street')}
                        value={formData.rue}
                        onChange={(e) => setFormData({...formData, rue: e.target.value})}
                        className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-bold text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.register_client.form.labels.building')}</label>
                      <input 
                        type="text" placeholder="Ex: A2"
                        value={formData.immeuble}
                        onChange={(e) => setFormData({...formData, immeuble: e.target.value})}
                        className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-bold text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.register_client.form.labels.apartment')}</label>
                      <input 
                        type="text" placeholder="Ex: 12"
                        value={formData.appartement}
                        onChange={(e) => setFormData({...formData, appartement: e.target.value})}
                        className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-bold text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none"
                      />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('driver.register_client.form.labels.notes')}</label>
                   <textarea 
                     rows={2} 
                     placeholder={t('driver.register_client.form.placeholders.notes')}
                     value={formData.notes}
                     onChange={(e) => setFormData({...formData, notes: e.target.value})}
                     className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-medium focus:bg-white focus:border-[var(--primary)] outline-none transition-all resize-none min-h-[80px] text-[var(--text)]"
                   />
                </div>
             </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-6 w-full">
           <button
             onClick={handleSubmit}
             disabled={loading.createClient}
             className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[12px] py-4.5 text-[15px] font-bold uppercase tracking-wider shadow-[var(--shadow-teal)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 h-[56px]"
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
  );
}
