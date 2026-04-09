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
  const { t } = useTranslation();
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
    <div className="space-y-6 animate-fade-in pb-12">

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-primary-50 rounded-2xl flex items-center justify-center">
              <Layers size={20} className="text-primary-500" />
            </div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">{t('carpet_types.title')}</h1>
          </div>
          <p className="text-xs text-text-muted font-medium ms-13 ps-13 text-start">
            {t('carpet_types.subtitle')}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 active:scale-95"
        >
          <Plus size={16} strokeWidth={3} />
          <span className="hidden sm:inline">{t('carpet_types.new_type')}</span>
        </button>
      </div>

      {/* ERROR */}
      {carpetTypesError && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle size={18} />
          <p className="text-sm font-semibold">{carpetTypesError}</p>
        </div>
      )}

      {/* TABLE CARD */}
      <div className="bg-white rounded-3xl shadow-card border border-border/50 overflow-hidden">
        {/* TABLE HEADER */}
        <div className="px-6 py-4 border-b border-border bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-black text-text-primary uppercase tracking-widest">
            {t('carpet_types.catalog')} ({carpetTypes.length})
          </h2>
          {carpetTypesLoading && <Loader2 size={16} className="animate-spin text-primary-400" />}
        </div>

        {/* LOADING STATE */}
        {carpetTypesLoading && carpetTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-300 mb-3" />
            <p className="text-xs font-black text-text-muted uppercase tracking-widest">{t('common.loading')}</p>
          </div>
        ) : carpetTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
              <Layers size={28} className="text-primary-300" />
            </div>
            <p className="text-sm font-black text-text-muted uppercase tracking-widest mb-1">{t('carpet_types.no_types')}</p>
            <p className="text-xs text-text-muted">{t('carpet_types.get_started')}</p>
            <button
              onClick={openCreate}
              className="mt-4 flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all"
            >
              <Plus size={14} strokeWidth={3} /> {t('carpet_types.create_first')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead className="bg-gray-50/40">
                <tr>
                  {[
                    t('carpet_types.table.name'),
                    t('carpet_types.table.price_m2'),
                    t('carpet_types.table.status'),
                    t('carpet_types.table.actions')
                  ].map(h => (
                    <th key={h} className="px-6 py-3.5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-start">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {carpetTypes.map(type => (
                  <tr key={type.id} className="hover:bg-gray-50/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                          <Layers size={16} className="text-primary-500" />
                        </div>
                        <span className="text-sm font-bold text-text-primary text-start">{type.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-xl">
                        <DollarSign size={12} className="text-primary-500" />
                        <span className="text-sm font-black text-primary-600">{type.prixParM2}</span>
                        <span className="text-[10px] font-black text-primary-400 uppercase">DH/m²</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {type.actif ? (
                        <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 border border-green-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle size={11} /> {t('carpet_types.active')}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-gray-50 text-text-muted border border-border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                          <XCircle size={11} /> {t('carpet_types.inactive')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(type)}
                          className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center transition-all text-text-muted border border-border/50"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
                          disabled={deletingId === type.id}
                          className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-text-muted border border-border/50 disabled:opacity-50"
                        >
                          {deletingId === type.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                  <Layers size={18} className="text-primary-500" />
                </div>
                <h2 className="text-base font-black text-text-primary uppercase tracking-tight">
                  {editTarget ? t('carpet_types.edit_type') : t('carpet_types.new_type')}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors text-text-muted"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Nom */}
              <div className="space-y-1.5 text-start">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                  {t('carpet_types.type_name')}
                </label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Tapis Berbère"
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-primary-400 outline-none transition-colors"
                  required
                />
              </div>

              {/* Prix par m² */}
              <div className="space-y-1.5 text-start">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                  {t('carpet_types.price_label')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.prixParM2}
                    onChange={e => setForm(f => ({ ...f, prixParM2: e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3 pe-16 text-sm font-bold focus:bg-white focus:border-primary-400 outline-none transition-colors"
                    required
                  />
                  <span className="absolute end-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase">
                    DH/m²
                  </span>
                </div>
              </div>

              {/* Statut toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-border/50">
                <div className="text-start">
                  <p className="text-sm font-bold text-text-primary">{t('carpet_types.active')}</p>
                  <p className="text-xs text-text-muted">{t('carpet_types.visible_to_driver')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, actif: !f.actif }))}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    form.actif ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 start-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    form.actif ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 border border-border rounded-xl text-sm font-black text-text-secondary hover:bg-gray-50 uppercase tracking-widest transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {editTarget ? t('common.save') : t('carpet_types.create_first').split(' ')[0]}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

