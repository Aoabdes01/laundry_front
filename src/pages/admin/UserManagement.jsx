import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchActiveUsers, fetchInactiveUsers, createNewUser,
  updateExistingUser, deactivateUser, reactivateUser, removeUser, changeUserpassword
} from '../../store/admin/adminThunk';
import {
  UserPlus, Edit2, Shield, Power, Search, Users,
  ChevronRight, Lock, Loader2, Trash2, Mail,
  Phone, Briefcase, RefreshCw, X, Check,
  ChevronLeft, SlidersHorizontal, UserCheck, UserX,
  AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { clearError, clearSuccess } from '../../store/admin/adminSlice';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { StatusBadge } from '../../components/StatusBadge';

const ROLE_CONFIG = {
  admin: { label: 'admin.users.roles.admin', bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', icon: Shield, border: 'border-indigo-100 dark:border-indigo-500/20' },
  employe: { label: 'admin.users.roles.employe', bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', icon: Briefcase, border: 'border-teal-100 dark:border-teal-500/20' },
  livreur: { label: 'admin.users.roles.livreur', bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', icon: Users, border: 'border-orange-100 dark:border-orange-500/20' },
};

const UserManagement = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeUsers, inactiveUsers, loading, error, success } = useSelector((state) => state.admin);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'employe', password: '' });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [isDetailView, setIsDetailView] = useState(false);

  useEffect(() => {
    dispatch(fetchActiveUsers());
    dispatch(fetchInactiveUsers());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      dispatch(fetchActiveUsers());
      dispatch(fetchInactiveUsers());
      setIsAddingUser(false);
      setIsDetailView(false);
      setConfirmModal(null);
      const timer = setTimeout(() => dispatch(clearSuccess()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setIsAddingUser(false);
    setIsDetailView(true);
    setFormData({ name: user.name, email: user.email, phone: user.phone, role: user.role, password: '' });
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (!newPassword || !confirmPassword) return setPasswordError('Veuillez remplir tous les champs');
    if (newPassword !== confirmPassword) return setPasswordError('Les mots de passe ne correspondent pas');
    if (newPassword.length < 6) return setPasswordError('Minimum 6 caractères');

    setPasswordLoading(true);
    try {
      await dispatch(changeUserpassword({ id: selectedUser.id, password: { password: newPassword } })).unwrap();
      toast.success("Mot de passe mis à jour avec succès");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : t('common.error'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const { password, ...rest } = formData;
    dispatch(updateExistingUser({ id: selectedUser.id, data: rest }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    dispatch(createNewUser(formData));
  };

  const filteredUsers = useMemo(() => {
    const displayUsers = showInactive ? (inactiveUsers || []) : (activeUsers || []);
    return displayUsers.filter(u => {
      const matchesSearch = !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [activeUsers, inactiveUsers, searchQuery, roleFilter, showInactive]);

  return (
    <div className="flex flex-col md:flex-row gap-4 lg:gap-6 pb-12 h-full md:h-[calc(100vh-140px)] animate-fade-in text-start">

      {/* MOBILE HEADER - Only visible when an item is selected on mobile */}
      {(isDetailView || isAddingUser) && (
        <div className="md:hidden bg-surface border-b border-border h-14 px-4 flex items-center gap-4 sticky top-0 z-50 -mx-4 mb-4">
          <button onClick={() => { setIsDetailView(false); setIsAddingUser(false); }} className="w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-text-primary shadow-sm"><ChevronLeft size={20} /></button>
          <div className="flex flex-col">
            <span className="font-black text-xs uppercase tracking-tight text-text-primary">{isAddingUser ? "Nouveau Membre" : "Profil Membre"}</span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{isAddingUser ? "Création" : selectedUser?.name}</span>
          </div>
        </div>
      )}

      {/* LIST COLUMN */}
      <div className={`${(isDetailView || isAddingUser) ? 'hidden md:flex' : 'flex'} md:w-72 lg:w-96 flex-col bg-surface rounded-3xl shadow-card border border-border/50 overflow-hidden shrink-0`}>
        <div className="p-5 lg:p-6 border-b border-border space-y-4 bg-background/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg lg:text-xl font-black text-text-primary tracking-tight uppercase">Équipe</h2>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{filteredUsers.length} membres</p>
            </div>
            <button onClick={() => { setIsAddingUser(true); setSelectedUser(null); setFormData({ name: '', email: '', phone: '', role: 'employe', password: '' }); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all active:scale-95"><UserPlus size={20} /></button>
          </div>
          <div className="relative group">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-500 transition-colors" />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-background border border-border/50 rounded-xl py-2 text-sm font-bold text-text-primary outline-none focus:ring-4 focus:ring-primary-500/5 transition-all" />
          </div>
          <div className="flex bg-background p-1 rounded-xl border border-border/50 overflow-x-auto no-scrollbar">
            {['all', 'employe', 'livreur', 'admin'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} className={`flex-1 min-w-[60px] py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${roleFilter === r ? 'bg-surface text-primary-600 shadow-sm border border-border/50' : 'text-text-muted hover:text-text-primary'}`}>{r}</button>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${showInactive ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{showInactive ? "Inactifs" : "Actifs"}</span>
          </div>
          <button onClick={() => setShowInactive(!showInactive)} className={`w-9 h-5 rounded-full relative transition-all ${showInactive ? 'bg-primary-500' : 'bg-border'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${showInactive ? 'translate-x-4.5' : 'translate-x-0.5'}`} /></button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/30">
          {loading && !filteredUsers.length ? (
            <div className="py-20 flex flex-col items-center opacity-40"><Loader2 size={32} className="animate-spin mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">Chargement...</p></div>
          ) : filteredUsers.length > 0 ? filteredUsers.map(user => {
            const isSel = selectedUser?.id === user.id;
            const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.employe;
            return (
              <button key={user.id} onClick={() => handleSelectUser(user)} className={`w-full flex items-center gap-3 lg:gap-4 p-4 lg:p-5 text-start transition-all ${isSel ? 'bg-primary-500/5 border-l-4 border-l-primary-500' : 'hover:bg-background/50 border-l-4 border-l-transparent'} ${showInactive ? 'opacity-60 grayscale' : ''}`}>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-background border border-border flex items-center justify-center font-black text-primary-600 shadow-sm text-sm shrink-0">{(user.name || 'U')[0]?.toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-text-primary truncate">{user.name}</p>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-tighter mt-1 ${role.bg} ${role.text} border ${role.border}`}>{user.role}</div>
                </div>
                <ChevronRight size={14} className={`text-text-muted transition-transform ${isSel ? 'text-primary-500 translate-x-1' : ''}`} />
              </button>
            );
          }) : (
            <div className="py-20 flex flex-col items-center opacity-40 text-center px-6">
              <Users size={32} className="mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest">Aucun membre trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL COLUMN */}
      <div className={`${(isDetailView || isAddingUser) ? 'flex' : 'hidden md:flex'} flex-1 overflow-y-auto`}>
        {!selectedUser && !isAddingUser ? (
          <div className="bg-surface rounded-3xl border border-border/50 border-dashed w-full flex flex-col items-center justify-center text-center p-12 opacity-40">
            <Users size={48} className="mb-4 text-primary-500" />
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight mb-1">Détails du membre</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sélectionnez un profil pour commencer</p>
          </div>
        ) : (
          <div className="w-full space-y-4 lg:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-surface rounded-3xl p-5 sm:p-6 lg:p-8 border border-border/50 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">{isAddingUser ? "Nouveau Membre" : "Paramètres du Compte"}</h3>
                  {!isAddingUser && <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">ID Unique: #{selectedUser?.id}</p>}
                </div>
                {!isAddingUser && <div className="self-start sm:self-center"><StatusBadge status={selectedUser?.isActive || selectedUser?.active ? 'VALIDEE' : 'ANNULEE'} /></div>}
              </div>

              <form onSubmit={isAddingUser ? handleCreate : handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] lg:text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><Mail size={12}/> Email professionnel</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-500 outline-none transition-all shadow-sm" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] lg:text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><UserCheck size={12}/> Nom Complet</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-500 outline-none transition-all shadow-sm" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] lg:text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><Phone size={12}/> Contact mobile</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-500 outline-none transition-all shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] lg:text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><Shield size={12}/> Attribution du Rôle</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-500 outline-none transition-all appearance-none shadow-sm cursor-pointer">
                      <option value="employe">Atelier (Employé)</option>
                      <option value="livreur">Livreur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  {isAddingUser && (
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-[9px] lg:text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><Lock size={12}/> Mot de passe temporaire</label>
                      <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-primary focus:border-primary-500 outline-none transition-all shadow-sm" required />
                    </div>
                  )}
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                  {(isAddingUser || isDetailView) && <button type="button" onClick={() => { setIsAddingUser(false); setIsDetailView(false); }} className="w-full sm:w-auto px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-border text-text-secondary hover:bg-background transition-all">Annuler</button>}
                  <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : (isAddingUser ? "Créer le compte" : "Enregistrer les modifications")}
                  </button>
                </div>
              </form>

              {!isAddingUser && (
                <div className="mt-12 pt-8 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-6">
                    <Lock size={18} className="text-primary-500" />
                    <h4 className="text-sm font-black text-text-primary uppercase tracking-widest">Sécurité & Accès</h4>
                  </div>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} placeholder="Nouveau mot de passe" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-primary-500 transition-all shadow-sm" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition-colors">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                      </div>
                      <div className="relative">
                        <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirmer le mot de passe" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-primary-500 transition-all shadow-sm" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition-colors">{showConfirmPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                      </div>
                    </div>
                    {passwordError && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1"><AlertCircle size={10}/> {passwordError}</p>}
                    <div className="flex justify-end">
                      <button type="submit" disabled={passwordLoading} className="w-full sm:w-auto px-6 py-3 bg-background border border-border text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface transition-all active:scale-95 disabled:opacity-50">Réinitialiser le mot de passe</button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {!isAddingUser && selectedUser?.role !== 'admin' && (
              <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border/50 shadow-card flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                <div className="absolute inset-y-0 start-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-center sm:text-start">
                  <h4 className="text-lg font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Zone Administrative</h4>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Actions de restriction et suppression</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button onClick={() => setConfirmModal({ user: selectedUser, action: selectedUser.isActive || selectedUser.active ? 'deactivate' : 'activate' })} className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedUser.isActive || selectedUser.active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
                    {selectedUser.isActive || selectedUser.active ? "Suspendre l'accès" : "Réactiver le compte"}
                  </button>
                  {showInactive && (
                    <button onClick={() => setConfirmModal({ action: 'delete', user: selectedUser })} className="flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-background border border-red-200 text-red-600 hover:bg-red-50 transition-all">Supprimer</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.action === 'delete' ? () => { dispatch(removeUser(confirmModal.user.id)); setSelectedUser(null); } : async () => {
          if (confirmModal?.action === 'activate') await dispatch(reactivateUser(confirmModal.user.id)).unwrap();
          else await dispatch(deactivateUser(confirmModal.user.id)).unwrap();
        }}
        title={confirmModal?.action === 'delete' ? "Supprimer le compte" : confirmModal?.action === 'activate' ? "Réactiver le compte" : "Suspendre le compte"}
        message={confirmModal?.action === 'delete' ? "Êtes-vous sûr ? Cette action supprimera définitivement l'utilisateur et toutes ses données associées." : "Souhaitez-vous modifier l'état d'accès de cet utilisateur ?"}
        type={confirmModal?.action === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
};

export default UserManagement;
