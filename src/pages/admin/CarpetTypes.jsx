import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  Plus, Pencil, Trash2, Loader2, AlertCircle,
  CheckCircle, XCircle, Layers, X, DollarSign
} from 'lucide-react';
import {
  fetchAdminCarpetTypes,
  createAdminCarpetType,
  updateAdminCarpetType,
  deleteAdminCarpetType,
} from '../../store/admin/adminThunk';

const EMPTY_FORM = { nom: '', prixParM2: '', actif: true };

const CarpetTypeModal = ({ show, editTarget, form, setForm, saving, closeModal, handleSubmit, t }) => {
  if (!show) return null;

  const content = (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="bg-white rounded-[20px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] w-full max-w-md animate-in zoom-in-95 duration-300 border border-[rgba(0,0,0,0.06)] overflow-hidden text-start">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(0,0,0,0.06)] bg-[var(--bg)]">
          <div>
            <p className="font-['Inter'] text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider mb-1">{t('admin.carpet_types.title')}</p>
            <h2 className="font-['Plus_Jakarta_Sans'] text-[20px] font-bold text-[var(--text)] tracking-tight">{editTarget ? t('admin.carpet_types.edit_type') : t('admin.carpet_types.new_type')}</h2>
          </div>
          <button onClick={closeModal} className="w-10 h-10 rounded-[10px] bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#EF4444] transition-all"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1.5 text-start">
            <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('admin.carpet_types.type_name')}</label>
            <input type="text" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 text-sm font-medium text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all" required />
          </div>

          <div className="space-y-1.5 text-start">
            <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">{t('admin.carpet_types.price_label')}</label>
            <div className="relative">
              <input type="number" step="0.01" min="0.01" value={form.prixParM2} onChange={e => setForm({...form, prixParM2: e.target.value})} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3.5 pe-16 text-sm font-medium text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all" required />
              <span className="absolute end-4 top-1/2 -translate-y-1/2 font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">DH/m²</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--bg)] rounded-[16px] border border-[rgba(0,0,0,0.04)]">
            <div className="text-start">
              <p className="font-['Inter'] text-[14px] font-bold text-[var(--text)]">{t('admin.carpet_types.visible_to_driver')}</p>
              <p className="font-['Inter'] text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-0.5">{t('admin.pro_ui.visibility')}</p>
            </div>
            <button type="button" onClick={() => setForm({...form, actif: !form.actif})} className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.actif ? 'bg-[var(--primary)]' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${form.actif ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="flex-1 py-3.5 rounded-[12px] text-[13px] font-bold uppercase tracking-wider border border-[rgba(0,0,0,0.08)] text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-all">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="flex-1 py-3.5 bg-[var(--primary)] text-white rounded-[12px] text-[13px] font-bold uppercase tracking-wider shadow-[var(--shadow-teal)] hover:bg-[var(--primary-dark)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} 
              {editTarget ? t('common.save') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default function CarpetTypes() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { carpetTypes, carpetTypesLoading, carpetTypesError } = useSelector(s => s.admin);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { dispatch(fetchAdminCarpetTypes()); }, [dispatch]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (type) => {
    setEditTarget(type);
    setForm({ nom: type.nom, prixParM2: type.prixParM2, actif: type.actif });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTarget(null); setForm(EMPTY_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.prixParM2) return toast.warning(t('carpet_types.toasts.fill_all'));
    setSaving(true);
    try {
      const payload = { nom: form.nom.trim(), prixParM2: parseFloat(form.prixParM2), actif: form.actif };
      if (editTarget) {
        await dispatch(updateAdminCarpetType({ id: editTarget.id, data: payload })).unwrap();
        toast.success(t('carpet_types.toasts.updated'));
      } else {
        await dispatch(createAdminCarpetType(payload)).unwrap();
        toast.success(t('carpet_types.toasts.created'));
      }
      closeModal();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : t('carpet_types.toasts.save_error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('carpet_types.toasts.delete_confirm'))) return;
    setDeletingId(id);
    try {
      await dispatch(deleteAdminCarpetType(id)).unwrap();
      toast.success(t('carpet_types.toasts.deleted'));
    } catch (err) {
      toast.error(t('carpet_types.toasts.delete_error'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-start px-4 md:px-0">

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[var(--text)] tracking-[-0.02em]">
            {t('admin.carpet_types.title')}
          </h1>
          <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] mt-1">
            {t('admin.carpet_types.subtitle')}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-white px-5 py-3 rounded-[12px] text-[13px] font-bold uppercase tracking-wider transition-all shadow-[var(--shadow-teal)] active:scale-95"
        >
          <Plus size={16} strokeWidth={3} />
          {t('admin.carpet_types.new_type')}
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('admin.pro_ui.active_prestations'), value: carpetTypes.filter(t => t.actif).length, icon: CheckCircle, type: 'active' },
          { label: t('admin.pro_ui.hidden_prestations'), value: carpetTypes.filter(t => !t.actif).length, icon: XCircle, type: 'hidden' },
          { label: t('admin.pro_ui.avg_price'), value: `${carpetTypes.length > 0 ? Math.round(carpetTypes.reduce((acc, t) => acc + t.prixParM2, 0) / carpetTypes.length) : 0}`, suffix: 'DH', icon: DollarSign, type: 'price' },
          { label: t('admin.pro_ui.catalog_total'), value: carpetTypes.length, icon: Layers, type: 'total' },
        ].map((kpi, i) => {
          const colors = {
            active: { accent: '#10B981', bg: 'rgba(16,185,129,0.1)' },
            hidden: { accent: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
            price: { accent: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
            total: { accent: '#0D7377', bg: 'rgba(13,115,119,0.1)' }
          }[kpi.type] || { accent: '#0D7377', bg: 'rgba(13,115,119,0.1)' };

          return (
            <div key={i} className="bg-white rounded-[16px] border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-sm)] p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: colors.accent }} />
              <div className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3" style={{ backgroundColor: colors.bg }}>
                <kpi.icon size={18} style={{ color: colors.accent }} />
              </div>
              <p className="font-['Inter'] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em] truncate">{kpi.label}</p>
              <p className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)] tracking-tight truncate mt-1">
                {kpi.value} {kpi.suffix && <span className="text-[11px] font-bold text-[var(--text-muted)]">{kpi.suffix}</span>}
              </p>
            </div>
          );
        })}
      </div>

      {/* LIST CONTAINER */}
      <div className="bg-white rounded-[20px] border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-sm)] overflow-hidden">
        {carpetTypesLoading && carpetTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-40">
            <Loader2 size={32} className="animate-spin mb-4 text-[var(--primary)]" />
            <p className="text-[11px] font-bold uppercase tracking-wider">{t('common.loading')}</p>
          </div>
        ) : carpetTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-16 h-16 bg-[var(--bg)] rounded-[16px] flex items-center justify-center mb-6 border border-dashed border-[rgba(0,0,0,0.1)]">
              <Layers size={32} className="text-[var(--text-muted)] opacity-30" />
            </div>
            <p className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)]">{t('admin.carpet_types.no_types')}</p>
            <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] mt-1">{t('admin.carpet_types.create_first')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(0,0,0,0.05)]">
            {carpetTypes.map(type => (
              <div key={type.id} className="p-5 flex flex-col gap-4 active:bg-[var(--bg)] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--primary-surface)] text-[var(--primary)] rounded-[10px] flex items-center justify-center shrink-0 border border-[rgba(13,115,119,0.1)]">
                      <Layers size={20} />
                    </div>
                    <div className="text-start">
                      <p className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)] leading-tight">{type.nom}</p>
                      <div className="mt-1">
                        {type.actif ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#10B981]"><CheckCircle size={10} /> {t('admin.carpet_types.active')}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]"><XCircle size={10} /> {t('admin.carpet_types.inactive')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-['Inter'] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">{t('admin.pro_ui.standard_rate')}</p>
                    <p className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--primary)] tracking-tight">{type.prixParM2} <span className="text-[10px] font-bold text-[var(--text-muted)]">DH/M²</span></p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button 
                    onClick={() => openEdit(type)} 
                    className="flex-1 h-11 flex items-center justify-center gap-2 bg-white border border-[rgba(0,0,0,0.08)] rounded-[10px] text-[12px] font-bold uppercase tracking-wider text-[var(--text-secondary)] active:scale-95 transition-all shadow-sm"
                  >
                    <Pencil size={14} /> {t('common.edit')}
                  </button>
                  <button 
                    onClick={() => handleDelete(type.id)} 
                    disabled={deletingId === type.id}
                    className="w-11 h-11 flex items-center justify-center bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-[#EF4444] active:scale-95 transition-all shadow-sm disabled:opacity-50"
                  >
                    {deletingId === type.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CarpetTypeModal 
        show={showModal} 
        editTarget={editTarget} 
        form={form} 
        setForm={setForm} 
        saving={saving} 
        closeModal={closeModal} 
        handleSubmit={handleSubmit} 
        t={t} 
      />
    </div>
  );
}
