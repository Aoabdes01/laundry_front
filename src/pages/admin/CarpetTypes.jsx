import React, { useEffect, useState } from 'react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-primary-500/10 rounded-2xl flex items-center justify-center border border-primary-500/20">
              <Layers size={20} className="text-primary-500" />
            </div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">{t('admin.carpet_types.title')}</h1>
          </div>
          <p className="text-sm text-text-muted font-bold uppercase tracking-widest opacity-60">
            {t('admin.carpet_types.subtitle')}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 active:scale-95"
        >
          <Plus size={16} strokeWidth={3} />
          <span className="hidden sm:inline">{t('admin.carpet_types.new_type')}</span>
        </button>
      </div>

      {/* ERROR */}
      {carpetTypesError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle size={18} />
          <p className="text-sm font-semibold">{carpetTypesError}</p>
        </div>
      )}

      {/* KPI QUICK STATS (Visible on all) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('admin.pro_ui.active_prestations'), value: carpetTypes.filter(t => t.actif).length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: t('admin.pro_ui.hidden_prestations'), value: carpetTypes.filter(t => !t.actif).length, icon: XCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: t('admin.pro_ui.avg_price'), value: `${carpetTypes.length > 0 ? Math.round(carpetTypes.reduce((acc, t) => acc + t.prixParM2, 0) / carpetTypes.length) : 0} DH`, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t('admin.pro_ui.catalog_total'), value: carpetTypes.length, icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        ].map((kpi, i) => (
          <div key={i} className="bg-surface p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-2 transition-all hover:shadow-md">
            <div className={`w-7 h-7 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
              <kpi.icon size={14} />
            </div>
            <div>
              <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">{kpi.label}</p>
              <p className="text-sm font-black text-text-primary tracking-tight">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TABLE/CARD CONTAINER */}
      <div className="bg-surface rounded-[2rem] shadow-card border border-border/50 overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-border/50 bg-background/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
              {t('admin.pro_ui.active_catalog')} ({carpetTypes.length})
            </h2>
          </div>
          {carpetTypesLoading && <Loader2 size={16} className="animate-spin text-primary-400" />}
        </div>

        {carpetTypesLoading && carpetTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-40">
            <Loader2 size={32} className="animate-spin mb-4 text-primary-500" />
            <p className="text-[10px] font-black uppercase tracking-widest">{t('common.loading')}</p>
          </div>
        ) : carpetTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-20 h-20 bg-background rounded-[2rem] flex items-center justify-center mb-6 border border-dashed border-border shadow-inner">
              <Layers size={32} className="text-text-muted/30" />
            </div>
            <p className="text-sm font-black text-text-primary uppercase tracking-widest mb-1">{t('admin.carpet_types.no_types')}</p>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60">{t('admin.carpet_types.create_first')}</p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-start">
                <thead>
                  <tr className="bg-background/50">
                    <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('admin.carpet_types.table.name')}</th>
                    <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{t('admin.pro_ui.unit_price')}</th>
                    <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">{t('admin.pro_ui.visibility')}</th>
                    <th className="px-8 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-end">{t('admin.carpet_types.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {carpetTypes.map(type => (
                    <tr key={type.id} className="hover:bg-background/40 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4 text-start">
                          <div className="w-10 h-10 bg-background border border-border/50 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            <Layers size={18} className="text-primary-500" />
                          </div>
                          <span className="text-sm font-black text-text-primary tracking-tight">{type.nom}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-start">
                        <div className="inline-flex items-center gap-2 bg-primary-500/5 px-3 py-1.5 rounded-xl border border-primary-500/10 font-black text-primary-600">
                          <span className="text-sm">{type.prixParM2}</span>
                          <span className="text-[10px] uppercase opacity-60">DH/m²</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex justify-center">
                          {type.actif ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20"><CheckCircle size={10} /> {t('admin.carpet_types.active')}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-50 dark:bg-background text-text-muted border border-border"><XCircle size={10} /> {t('admin.carpet_types.inactive')}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(type)} className="w-9 h-9 rounded-xl bg-background border border-border/50 flex items-center justify-center text-text-muted hover:text-primary-500 transition-all active:scale-90 shadow-sm"><Pencil size={14}/></button>
                          <button onClick={() => handleDelete(type.id)} disabled={deletingId === type.id} className="w-9 h-9 rounded-xl bg-background border border-border/50 flex items-center justify-center text-text-muted hover:text-red-500 transition-all active:scale-90 shadow-sm disabled:opacity-50">{deletingId === type.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden divide-y divide-border/30">
              {carpetTypes.map(type => (
                <div key={type.id} className="p-5 flex flex-col gap-4 active:bg-background transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-background border border-border/50 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                        <Layers size={18} className="text-primary-500" />
                      </div>
                      <div className="text-start">
                        <p className="text-sm font-black text-text-primary leading-tight">{type.nom}</p>
                        <div className="mt-1">
                          {type.actif ? (
                            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-green-600"><CheckCircle size={8} /> {t('admin.carpet_types.active')}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-text-muted"><XCircle size={8} /> {t('admin.carpet_types.inactive')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">{t('admin.pro_ui.standard_rate')}</p>
                      <p className="text-sm font-black text-primary-600 tracking-tight">{type.prixParM2} <span className="text-[8px] font-bold opacity-60">DH/M²</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/20">
                    <button 
                      onClick={() => openEdit(type)} 
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-background border border-border/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-primary-500 transition-all active:scale-95 shadow-sm"
                    >
                      <Pencil size={12} /> {t('common.edit')}
                    </button>
                    <button 
                      onClick={() => handleDelete(type.id)} 
                      disabled={deletingId === type.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-background border border-border/50 rounded-xl text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-red-500 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                    >
                      {deletingId === type.id ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="bg-surface rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300 border border-border/50 overflow-hidden text-start">
            <div className="flex items-center justify-between px-8 py-6 border-b border-border/50 bg-background/30">
              <div>
                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1">{t('admin.carpet_types.title')}</p>
                <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">{editTarget ? t('admin.carpet_types.edit_type') : t('admin.carpet_types.new_type')}</h2>
              </div>
              <button onClick={closeModal} className="w-10 h-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center text-text-muted hover:text-red-500 transition-all"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2 text-start">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('admin.carpet_types.type_name')}</label>
                <input type="text" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className="w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-sm font-bold text-text-primary focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all" required />
              </div>

              <div className="space-y-2 text-start">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">{t('admin.carpet_types.price_label')}</label>
                <div className="relative">
                  <input type="number" step="0.01" min="0.01" value={form.prixParM2} onChange={e => setForm({...form, prixParM2: e.target.value})} className="w-full bg-background border border-border rounded-2xl px-4 py-3.5 pe-16 text-sm font-bold text-text-primary focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all" required />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase tracking-widest">DH/m²</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-5 bg-background rounded-3xl border border-border/50">
                <div className="text-start">
                  <p className="text-sm font-black text-text-primary uppercase tracking-tight">{t('admin.carpet_types.visible_to_driver')}</p>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{t('admin.pro_ui.visibility')}</p>
                </div>
                <button type="button" onClick={() => setForm({...form, actif: !form.actif})} className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.actif ? 'bg-primary-500 shadow-lg shadow-primary-500/30' : 'bg-border'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.actif ? 'translate-x-7' : 'translate-x-1'}`} /></button>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-border text-text-secondary hover:bg-background transition-all">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} {editTarget ? t('common.save') : t('common.create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
