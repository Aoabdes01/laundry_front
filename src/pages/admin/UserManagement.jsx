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

const ROLE_CONFIG = {
  admin: { label: 'admin.users.roles.admin', bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Shield, border: 'border-indigo-100' },
  employe: { label: 'admin.users.roles.employe', bg: 'bg-teal-50', text: 'text-teal-600', icon: Briefcase, border: 'border-teal-100' },
  livreur: { label: 'admin.users.roles.livreur', bg: 'bg-orange-50', text: 'text-orange-600', icon: Users, border: 'border-orange-100' },
};

const UserManagement = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeUsers, inactiveUsers, loading, error, success } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'inactive'
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // null OR { user, action: 'activate'|'deactivate' }
  const [toggleLoading, setToggleLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'employe', password: '' });

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Mobile navigation state
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

    if (!newPassword || !confirmPassword) {
      setPasswordError('Veuillez remplir tous les champs');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Minimum 6 caractères');
      return;
    }

    setPasswordLoading(true);
    try {
      await dispatch(changeUserpassword({ id: selectedUser.id, password: { password: newPassword } })).unwrap();
      toast.success(t('auth.login.success') || "Mot de passe mis à jour avec succès");
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

  const handleToggleClick = (user) => {
    // Robustly check for active status (handle both isActive and active)
    const currentActive = user.isActive !== undefined ? user.isActive : user.active;
    setConfirmModal({
      user,
      action: currentActive ? 'deactivate' : 'activate'
    });
  };

  const handleConfirmToggle = async () => {
    setToggleLoading(true);
    try {
      if (confirmModal.action === 'activate') {
        await dispatch(reactivateUser(confirmModal.user.id)).unwrap();
      } else {
        await dispatch(deactivateUser(confirmModal.user.id)).unwrap();
      }
      setConfirmModal(null);
    } catch (error) {
      console.error('Toggle error:', error);
    } finally {
      setToggleLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    // Trust the Redux arrays which are already separated by status from the backend
    const displayUsers = showInactive ? (inactiveUsers || []) : (activeUsers || []);

    return displayUsers.filter(u => {
      const matchesSearch = !searchQuery ||
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [activeUsers, inactiveUsers, searchQuery, roleFilter, showInactive]);

  const initials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-20 md:pb-8 h-full md:h-[calc(100vh-140px)] animate-fade-in -mt-4 md:mt-0">

      {/* MOBILE TOPBAR */}
      <div className="md:hidden bg-white border-b border-border h-14 px-4 flex items-center justify-between sticky top-0 z-50 -mx-4">
        <button
          onClick={() => isDetailView || isAddingUser ? (setIsDetailView(false), setIsAddingUser(false)) : navigate(-1)}
          className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-lg font-semibold text-text-primary flex-1 text-center">
          {isAddingUser ? t('admin.users.new_member') : isDetailView ? t('admin.users.member_profile') : t('admin.users.title')}
        </span>
        <div className="flex gap-2">
          <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-text-muted">
            <Search size={18} />
          </button>
          <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-text-muted">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* LEFT COLUMN — TEAM LIST */}
      <div className={`${(isDetailView || isAddingUser) ? 'hidden md:flex' : 'flex'} lg:w-96 flex-col bg-surface rounded-3xl shadow-card border border-border/50 overflow-hidden flex-shrink-0`}>

        {/* List Header (Desktop Only) */}
        <div className="hidden md:block p-6 border-b border-border space-y-4 bg-background/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-text-primary tracking-tight">{t('admin.users.new_member')}s</h2>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{(activeUsers?.length || 0) + (inactiveUsers?.length || 0)} {t('admin.users.members_count')}</p>
            </div>
            <button
              onClick={() => { setIsAddingUser(true); setSelectedUser(null); setFormData({ name: '', email: '', phone: '', role: 'employe', password: '' }); }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95"
            >
              <UserPlus size={20} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder={t('admin.users.search_placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 ps-10 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
              />
            </div>

            <div className="flex gap-1.5 p-1 bg-background rounded-xl">
              {['all', 'employe', 'livreur'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${roleFilter === r ? 'bg-surface text-primary-600 shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                >
                  {t(`admin.users.roles.${r}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ROLE TABS (Mobile Only) */}
        <div className="md:hidden grid grid-cols-2 gap-0 mx-4 mt-4 mb-4 bg-gray-100 rounded-2xl p-1 shrink-0">
          <button
            onClick={() => setRoleFilter('livreur')}
            className={`py-2.5 text-sm font-semibold transition-all ${roleFilter === 'livreur' ? 'bg-white rounded-xl shadow-sm text-primary-500' : 'text-text-muted'}`}
          >
            Livreurs
          </button>
          <button
            onClick={() => setRoleFilter('employe')}
            className={`py-2.5 text-sm font-semibold transition-all ${roleFilter === 'employe' ? 'bg-white rounded-xl shadow-sm text-primary-500' : 'text-text-muted'}`}
          >
            {t('admin.users.roles.employe')}s
          </button>
        </div>

        {/* INACTIVE USERS FILTER ROW */}
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 mb-4 mt-2 md:mt-4 shrink-0">
          <span className="text-sm text-text-muted">
            <span className="font-bold text-text-primary">{filteredUsers.length}</span> {showInactive ? t('admin.users.inactive') : t('admin.users.active')}
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-10 h-5 rounded-full relative transition-colors ${showInactive ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              onClick={() => setShowInactive(!showInactive)}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showInactive ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
            </div>
            <span className="text-sm text-text-secondary">{t('admin.users.show_inactive')}</span>
          </label>
        </div>

        {/* Scrollable List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/50 px-4 md:px-0 space-y-3 md:space-y-0 pb-4">
          {loading && !filteredUsers.length ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Loader2 size={32} className="animate-spin text-primary-300 mb-2" />
              <p className="text-xs font-medium text-text-muted">{t('admin.users.loading')}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center text-text-muted/20 mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-1">{t('admin.users.no_members')}</h3>
              <p className="text-xs text-text-muted">{t('admin.users.no_members_sub')}</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const roleCfg = ROLE_CONFIG[user.role] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: Shield };
              const Icon = roleCfg.icon;
              const isSel = selectedUser?.id === user.id;

              return (
                <div key={user.id} className="md:contents">
                  {/* Desktop Item */}
                  <button
                    onClick={() => handleSelectUser(user)}
                    className={`hidden md:flex w-full items-center gap-4 p-4 text-start transition-all ${isSel ? 'bg-primary-50/50' : 'hover:bg-background/50'} ${showInactive ? 'opacity-60 bg-gray-50 hover:bg-gray-100/50' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm shrink-0 transition-transform ${isSel ? 'scale-110' : ''} ${!showInactive ? 'bg-white border border-border text-primary-600' : 'bg-gray-200 text-text-muted'}`}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black truncate ${isSel ? 'text-primary-700' : 'text-text-primary'}`}>{user.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm border ${roleCfg.bg} ${roleCfg.text} ${roleCfg.border}`}>
                          <Icon size={10} />
                          {t(roleCfg.label)}
                        </span>
                        {showInactive && (
                          <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {t('admin.users.inactive')}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className={`text-text-muted transition-all ${isSel ? 'translate-x-1 text-primary-500' : ''}`} />
                  </button>

                  {/* Mobile User Card */}
                  <div className={`md:hidden rounded-2xl shadow-card p-4 mx-4 border border-border/50 ${!showInactive ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-sm ${!showInactive ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'}`}>
                          {initials(user.name)}
                        </div>
                        <div>
                          <p className="text-base font-bold text-text-primary">{user.name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="bg-primary-50 text-primary-500 text-xs font-semibold px-2 py-0.5 rounded-full uppercase">
                              {t(`admin.users.roles.${user.role}`)}
                            </span>
                            {showInactive && (
                              <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                {t('admin.users.inactive')}
                              </span>
                            )}
                            <span className="text-xs text-text-muted">ID: PC-{user.id?.toString().padStart(4, '0')}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        onClick={() => handleToggleClick(user)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-200 ${!showInactive ? 'bg-primary-500' : 'bg-gray-200'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all duration-200 ${!showInactive ? 'end-0.5' : 'start-0.5'}`} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">{t('admin.users.last_activity')}</p>
                        <p className="text-sm font-medium text-text-primary text-start">{t('admin.users.connected')}</p>
                      </div>
                      <button
                        onClick={() => handleSelectUser(user)}
                        className="text-primary-500 text-sm font-bold flex items-center gap-1"
                      >
                        <Edit2 size={14} />
                        {t('admin.users.edit')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MOBILE FAB */}
      <button
        onClick={() => { setIsAddingUser(true); setSelectedUser(null); setFormData({ name: '', email: '', phone: '', role: 'employe', password: '' }); }}
        className="md:hidden fixed bottom-20 end-4 z-50 w-14 h-14 rounded-full bg-primary-500 shadow-modal flex items-center justify-center text-white"
      >
        <UserPlus size={24} />
      </button>

      {/* RIGHT COLUMN — DETAIL / FORM CONTROL */}
      <div className={`${(isDetailView || isAddingUser) ? 'flex' : 'hidden md:flex'} flex-1 overflow-y-auto min-h-0 relative px-4 md:px-0`}>
        {!selectedUser && !isAddingUser ? (
          <div className="bg-surface rounded-3xl shadow-card h-full flex flex-col items-center justify-center text-center p-12 border border-border/50 w-full">
            <div className="w-24 h-24 rounded-3xl bg-background border border-border flex items-center justify-center mb-6 shadow-sm">
              <Shield size={48} className="text-text-muted/20" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">{t('admin.users.access_management')}</h3>
            <p className="text-sm text-text-muted max-w-xs mx-auto">
              {t('admin.users.select_member')}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="bg-background rounded-2xl p-4 border border-border">
                <p className="text-2xl font-black text-primary-600">{activeUsers?.length || 0}</p>
                <p className="text-[10px] font-bold text-text-muted uppercase">{t('admin.users.active')}</p>
              </div>
              <div className="bg-background rounded-2xl p-4 border border-border">
                <p className="text-2xl font-black text-text-muted">{inactiveUsers?.length || 0}</p>
                <p className="text-[10px] font-bold text-text-muted uppercase">{t('admin.users.inactive')}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up w-full">

            {/* Context Header */}
            <div className="hidden md:flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-text-primary tracking-tight">
                  {isAddingUser ? t('admin.users.add_member_title') : t('admin.users.member_profile')}
                </h2>
                {!isAddingUser && <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">ID: {selectedUser?.id}</p>}
              </div>
              <div className="flex gap-2">
                {isAddingUser && (
                  <button
                    onClick={() => setIsAddingUser(false)}
                    className="p-2.5 bg-background text-text-secondary rounded-xl hover:bg-border/50 transition-all shadow-sm"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Error / Success Alerts */}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-emerald-700 animate-slide-up">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check size={14} />
                </div>
                <p className="text-sm font-bold tracking-tight">{t('common.success_msg') || 'Opération effectuée avec succès !'}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-700 animate-slide-up">
                <AlertCircle size={20} />
                <p className="text-sm font-bold tracking-tight">{typeof error === 'string' ? error : t('common.error')}</p>
              </div>
            )}

            {/* Core Identity Card */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Main Identity Info */}
              <div className="xl:col-span-2 bg-surface rounded-3xl shadow-card p-6 md:p-8 border border-border/50 space-y-8">
                <form onSubmit={isAddingUser ? handleCreate : handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2 text-start">
                      <label className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                        <Users size={12} /> {t('admin.users.full_name')}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Jean Dupont"
                        className="w-full bg-background border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 outline-none"
                      />
                    </div>
                    <div className="space-y-2 text-start">
                      <label className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                        <Mail size={12} /> {t('admin.users.email')}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@pureclean.com"
                        className="w-full bg-background border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 outline-none"
                      />
                    </div>
                    <div className="space-y-2 text-start">
                      <label className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                        <Phone size={12} /> {t('admin.users.phone')}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+212 ..."
                        className="w-full bg-background border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 outline-none"
                      />
                    </div>
                    <div className="space-y-2 text-start">
                      <label className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                        <Shield size={12} /> {t('admin.users.role')}
                      </label>
                      <select
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-background border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 outline-none appearance-none"
                      >
                        <option value="employe">{t('admin.users.roles.employe')}</option>
                        <option value="livreur">{t('admin.users.roles.livreur')}</option>
                        <option value="admin">{t('admin.users.roles.admin')}</option>
                      </select>
                    </div>
                    {(isAddingUser || !selectedUser) && (
                      <div className="sm:col-span-2 space-y-2 text-start">
                        <label className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                          <Lock size={12} /> {t('admin.users.password')}
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className="w-full bg-background border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 md:py-3 rounded-2xl text-sm font-black shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <RefreshCw size={18} className="animate-spin" /> : (isAddingUser ? <UserPlus size={18} /> : <Edit2 size={18} />)}
                      {isAddingUser ? t('admin.users.create_account') : t('admin.users.update_account')}
                    </button>
                  </div>
                </form>

                {/* --- PASSWORD SECTION --- */}
                {!isAddingUser && selectedUser && (
                  <>
                    <hr className="border-border/50 border-dashed" />
                    <div>
                      <div className="flex items-center gap-2 mb-6">
                        <Lock size={18} className="text-primary-500" />
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">{t('admin.users.change_password')}</h3>
                      </div>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                              {t('admin.users.new_password')}
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                className={`w-full bg-background border ${passwordError ? 'border-red-300' : 'border-none'} rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 outline-none pe-10`}
                                placeholder="Nouveau mot de passe"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                              />
                              <button
                                type="button"
                                className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                                onClick={() => setShowPassword(p => !p)}
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest">
                              {t('admin.users.confirm_password')}
                            </label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                className={`w-full bg-background border ${passwordError ? 'border-red-300' : 'border-none'} rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 outline-none pe-10`}
                                placeholder="Confirmer le mot de passe"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                              />
                              <button
                                type="button"
                                className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                                onClick={() => setShowConfirmPassword(p => !p)}
                              >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {passwordError && (
                          <p className="text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1">{passwordError}</p>
                        )}

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={passwordLoading}
                            className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                          >
                            {passwordLoading && <Loader2 size={16} className="animate-spin" />}
                            {t('admin.users.update_password_btn')}
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                )}
              </div>

              {/* Secondary Security Actions */}
              {selectedUser?.role !== 'admin' ? <>
                {!isAddingUser && selectedUser && (
                  <div className="bg-surface rounded-3xl shadow-card p-8 border border-border/50 flex flex-col items-center justify-center text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm border ${!showInactive ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-green-50 text-green-500 border-green-100'}`}>
                      <Power size={32} />
                    </div>
                    <h4 className="text-lg font-black text-text-primary mb-2">{t('admin.users.security')}</h4>
                    <p className="text-xs text-text-muted font-medium mb-8 leading-relaxed">
                      {!showInactive
                        ? t('admin.users.modals.deactivate_body')
                        : t('admin.users.modals.activate_body')}
                    </p>

                    <div className="w-full flex flex-col gap-3">
                      <button
                        onClick={() => handleToggleClick(selectedUser)}
                        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all ${!showInactive ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-700' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700'}`}
                      >
                        <Power size={18} />
                        {!showInactive ? t('admin.users.suspend') : t('admin.users.restore')}
                      </button>

                      {showInactive && (
                        <button
                          onClick={() => setConfirmModal({
                            action: 'delete',
                            user: selectedUser
                          })}
                          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black bg-background border border-border text-red-400 hover:bg-red-50 hover:text-red-600 transition-all group"
                        >
                          <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
                          {t('admin.users.delete')}
                        </button>
                      )}
                    </div>
                  </div>
                )}</> : <></>}
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget && !toggleLoading)
              setConfirmModal(null);
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div className="relative bg-white rounded-3xl shadow-modal max-w-sm w-full p-8 z-10 animate-in zoom-in-95 duration-300">
            {confirmModal.action === 'delete' ? (
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-red-500" />
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${confirmModal.action === 'activate' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                {confirmModal.action === 'activate'
                  ? <UserCheck className="w-8 h-8 text-green-500" />
                  : <UserX className="w-8 h-8 text-red-500" />
                }
              </div>
            )}

            <h3 className="text-xl font-black text-center text-text-primary mb-2 uppercase tracking-tight">
              {confirmModal.action === 'activate' ? t('admin.users.modals.activate_title') :
                confirmModal.action === 'delete' ? t('admin.users.modals.delete_title') : t('admin.users.modals.deactivate_title')}
            </h3>

            <div className="bg-gray-50 rounded-2xl p-4 mb-4 text-center border border-border/50">
              <p className="text-sm font-black text-text-primary uppercase tracking-tight">
                {confirmModal.user.name || confirmModal.user.nom}
              </p>
              <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest">
                {t(`admin.users.roles.${confirmModal.user.role}`)} • ID: PC-{confirmModal.user.id?.toString().padStart(4, '0')}
              </p>
            </div>

            <p className="text-xs font-medium text-text-muted text-center mb-8 px-4">
              {confirmModal.action === 'activate'
                ? t('admin.users.modals.activate_body')
                : confirmModal.action === 'delete'
                  ? t('admin.users.modals.delete_body')
                  : t('admin.users.modals.deactivate_body')
              }
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-primary rounded-2xl py-4 text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                onClick={() => setConfirmModal(null)}
                disabled={toggleLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                className={`flex-1 text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 ${confirmModal.action === 'activate'
                  ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20'
                  : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                  }`}
                onClick={confirmModal.action === 'delete' ? () => { dispatch(removeUser(confirmModal.user.id)); setSelectedUser(null); setConfirmModal(null); } : handleConfirmToggle}
                disabled={toggleLoading}
              >
                {toggleLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  confirmModal.action === 'activate' ? t('common.confirm') :
                    confirmModal.action === 'delete' ? t('common.delete') : t('admin.users.suspend')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

