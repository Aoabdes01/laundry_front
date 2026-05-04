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
  AlertCircle, Eye, EyeOff, MoreVertical
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { clearError, clearSuccess } from '../../store/admin/adminSlice';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { StatusBadge } from '../../components/StatusBadge';

const ROLE_CONFIG = {
  admin: { 
    label: 'admin.users.roles.admin', 
    gradient: 'from-[#0D7377] to-[#14A3A8]', 
    pill: 'bg-[var(--primary-surface)] text-[var(--primary)] border-[rgba(13,115,119,0.1)]'
  },
  employe: { 
    label: 'admin.users.roles.employe', 
    gradient: 'from-[#3B82F6] to-[#60A5FA]', 
    pill: 'bg-blue-50 text-blue-600 border-blue-100'
  },
  livreur: { 
    label: 'admin.users.roles.livreur', 
    gradient: 'from-[#C9A84C] to-[#E2C06E]', 
    pill: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
  },
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
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleActionConfirm = async () => {
    if (!confirmModal) return;
    const { user, action } = confirmModal;
    setActionLoading(true);
    try {
      if (action === 'delete') {
        await dispatch(removeUser(user.id)).unwrap();
        toast.success("Utilisateur supprimé");
        setSelectedUser(null);
      } else if (action === 'activate') {
        await dispatch(reactivateUser(user.id)).unwrap();
        toast.success("Compte réactivé");
      } else {
        await dispatch(deactivateUser(user.id)).unwrap();
        toast.success("Accès suspendu");
      }
      setConfirmModal(null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : "Une erreur est survenue");
    } finally {
      setActionLoading(false);
    }
  };

  const validatePhone = (phone) => {
    if (!phone) return true;
    const sanitized = phone.replace(/[\s-]/g, '');
    if (sanitized.startsWith('0')) {
      return sanitized.length === 10 && /^[567]/.test(sanitized[1]);
    }
    if (sanitized.startsWith('+212')) {
      return sanitized.length === 13 && /^[567]/.test(sanitized[4]);
    } else if (sanitized.startsWith('212')) {
      return sanitized.length === 12 && /^[567]/.test(sanitized[3]);
    }
    return false;
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
    if (formData.phone && !validatePhone(formData.phone)) {
      return toast.error("Format de numéro de téléphone invalide");
    }
    const { password, ...rest } = formData;
    dispatch(updateExistingUser({ id: selectedUser.id, data: rest }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (formData.phone && !validatePhone(formData.phone)) {
      return toast.error("Format de numéro de téléphone invalide");
    }
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

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setIsAddingUser(false);
    setIsDetailView(true);
    setFormData({ name: user.name, email: user.email, phone: user.phone, role: user.role, password: '' });
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  return (
      <div className="flex flex-col md:flex-row gap-6 pb-12 h-full md:h-[calc(100vh-140px)] animate-fade-in text-start">

        {/* LIST COLUMN */}
        <div className={`${(isDetailView || isAddingUser) ? 'hidden md:flex' : 'flex'} md:w-[360px] flex-col bg-white rounded-[20px] shadow-[var(--shadow-md)] border border-[rgba(0,0,0,0.06)] overflow-hidden shrink-0`}>
          
          {/* HEADER CARD */}
          <div className="p-5 bg-gradient-to-br from-[#0D7377] to-[#14A3A8] text-white relative">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-[22px] font-bold tracking-tight uppercase">
                  {t('admin.pro_ui.team')}
                </h2>
                <p className="font-['Inter'] text-[13px] text-[rgba(255,255,255,0.7)] uppercase font-medium">
                  {filteredUsers.length} {t('admin.pro_ui.members')}
                </p>
              </div>
              <button 
                onClick={() => { setIsAddingUser(true); setSelectedUser(null); setFormData({ name: '', email: '', phone: '', role: 'employe', password: '' }); }}
                className="w-11 h-11 flex items-center justify-center rounded-[12px] bg-[rgba(255,255,255,0.2)] border border-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.3)] transition-all active:scale-95"
              >
                <UserPlus size={20} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* SEARCH BAR */}
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder={t('common.search_placeholder')} 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] py-3 pl-11 pr-4 text-sm font-medium text-[var(--text)] outline-none focus:ring-4 focus:ring-[var(--primary-glow)] focus:border-[var(--primary)] transition-all" 
              />
            </div>

            {/* ROLE FILTERS */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {['all', 'employe', 'livreur', 'admin'].map(r => (
                <button 
                  key={r} 
                  onClick={() => setRoleFilter(r)} 
                  className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-all duration-200 ${
                    roleFilter === r 
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_2px_8px_rgba(13,115,119,0.2)]' 
                      : 'bg-white text-[var(--text-muted)] border-[rgba(0,0,0,0.08)]'
                  }`}
                >
                  {r === 'all' ? t('admin.users.roles.all').toUpperCase() : t(ROLE_CONFIG[r].label).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-3 border-y border-[rgba(0,0,0,0.05)] flex items-center justify-between bg-[var(--bg)]">
            <div className="flex items-center gap-2">
              <div className={`w-[6px] h-[6px] rounded-full ${showInactive ? 'bg-[var(--danger)]' : 'bg-[var(--success)]'}`} />
              <span className="font-['Inter'] text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.06em]">
                {showInactive ? t('admin.users.inactive') : t('admin.users.active')}
              </span>
            </div>
            <button 
              onClick={() => setShowInactive(!showInactive)}
              className={`w-10 h-6 rounded-full relative transition-all duration-300 ${showInactive ? 'bg-[var(--primary)]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${showInactive ? 'left-5' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && !filteredUsers.length ? (
              <div className="py-20 flex flex-col items-center opacity-40">
                <Loader2 size={32} className="animate-spin mb-4 text-[var(--primary)]" />
                <p className="text-[11px] font-bold uppercase tracking-wider">{t('common.loading')}</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="divide-y divide-[rgba(0,0,0,0.05)]">
                {filteredUsers.map(user => {
                  const isSel = selectedUser?.id === user.id;
                  const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.employe;
                  return (
                    <button 
                      key={user.id} 
                      onClick={() => handleSelectUser(user)} 
                      className={`w-full flex items-center gap-3 p-4 text-start transition-all active:bg-[var(--bg)] ${
                        isSel ? 'bg-[var(--primary-surface)]' : ''
                      } ${showInactive ? 'opacity-60 grayscale' : ''}`}
                    >
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${role.gradient} text-white flex items-center justify-center font-['Plus_Jakarta_Sans'] font-bold text-[16px] shadow-sm shrink-0`}>
                        {(user.name || 'U')[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-['Plus_Jakarta_Sans'] text-[15px] font-semibold text-[var(--text)] truncate">{user.name}</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border mt-1 ${role.pill}`}>
                          {t(role.label)}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-[#CBD5E1]" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center opacity-40 px-6">
                <Users size={32} className="mx-auto mb-3" />
                <p className="text-[11px] font-bold uppercase tracking-wider">{t('admin.users.no_users')}</p>
              </div>
            )}
          </div>
        </div>

        {/* DETAIL COLUMN */}
        <div className={`${(isDetailView || isAddingUser) ? 'flex' : 'hidden md:flex'} flex-1 overflow-y-auto`}>
          {!selectedUser && !isAddingUser ? (
            <div className="bg-white rounded-[20px] border border-dashed border-[rgba(0,0,0,0.1)] w-full flex flex-col items-center justify-center text-center p-12 opacity-40">
              <Users size={64} className="mb-4 text-[#CBD5E1]" />
              <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-semibold text-[var(--text-secondary)]">{t('admin.users.member_profile')}</h3>
              <p className="font-['Inter'] text-[14px] text-[var(--text-muted)] mt-1">{t('admin.users.select_member')}</p>
            </div>
          ) : (
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-md)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[20px] font-bold text-[var(--text)] uppercase tracking-tight">
                      {isAddingUser ? t('admin.pro_ui.new_member') : t('admin.users.member_profile')}
                    </h3>
                    {!isAddingUser && <p className="font-['Inter'] text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">ID: #{selectedUser?.id}</p>}
                  </div>
                  {!isAddingUser && <StatusBadge status={selectedUser?.isActive || selectedUser?.active ? 'VALIDEE' : 'ANNULEE'} />}
                </div>

                <form onSubmit={isAddingUser ? handleCreate : handleUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2"><Mail size={12} /> {t('admin.users.email')}</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3 text-sm font-medium text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all" required />
                    </div>
                    <div className="space-y-2">
                      <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2"><UserCheck size={12} /> {t('admin.users.full_name')}</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3 text-sm font-medium text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all" required />
                    </div>
                    <div className="space-y-2">
                      <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2"><Phone size={12} /> {t('admin.users.phone')}</label>
                      <input type="tel" placeholder="Ex: 06XXXXXXXX" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3 text-sm font-medium text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2"><Shield size={12} /> {t('admin.users.role')}</label>
                      <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3 text-sm font-medium text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all appearance-none cursor-pointer">
                        <option value="employe">{t('admin.users.roles.employe')}</option>
                        <option value="livreur">{t('admin.users.roles.livreur')}</option>
                        <option value="admin">{t('admin.users.roles.admin')}</option>
                      </select>
                    </div>
                    {isAddingUser && (
                      <div className="sm:col-span-2 space-y-2">
                        <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2"><Lock size={12} /> {t('admin.users.password')}</label>
                        <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3 text-sm font-medium text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all" required />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                    {(isAddingUser || isDetailView) && (
                      <button 
                        type="button" 
                        onClick={() => { setIsAddingUser(false); setIsDetailView(false); }} 
                        className="px-6 py-3 rounded-[12px] text-[14px] font-semibold border-[1.5px] border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-surface)] transition-all"
                      >
                        {t('common.cancel')}
                      </button>
                    )}
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="px-8 py-3 bg-[var(--primary)] text-white rounded-[12px] text-[14px] font-semibold shadow-[var(--shadow-teal)] hover:bg-[var(--primary-dark)] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : (isAddingUser ? t('admin.users.create_account') : t('admin.users.update_account'))}
                    </button>
                  </div>
                </form>

                {!isAddingUser && (
                  <div className="mt-10 pt-8 border-t border-[rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-2 mb-6">
                      <Lock size={18} className="text-[var(--primary)]" />
                      <h4 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[var(--text)] uppercase tracking-tight">{t('admin.pro_ui.security_access')}</h4>
                    </div>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <input type={showPassword ? 'text' : 'password'} placeholder={t('admin.users.new_password')} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3 text-sm font-medium text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                        <div className="relative">
                          <input type={showConfirmPassword ? 'text' : 'password'} placeholder={t('admin.users.confirm_password')} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-4 py-3 text-sm font-medium text-[var(--text)] focus:bg-white focus:border-[var(--primary)] outline-none transition-all" />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                      </div>
                      {passwordError && <p className="text-[12px] font-semibold text-[var(--danger)] flex items-center gap-1"><AlertCircle size={14} /> {passwordError}</p>}
                      <div className="flex justify-end">
                        <button type="submit" disabled={passwordLoading} className="px-6 py-2.5 bg-white border-[1.5px] border-[var(--primary)] text-[var(--primary)] rounded-[12px] text-[13px] font-bold hover:bg-[var(--primary-surface)] transition-all active:scale-95 disabled:opacity-50">{t('admin.users.update_password_btn')}</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {!isAddingUser && selectedUser?.role !== 'admin' && (
                <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-[rgba(0,0,0,0.06)] shadow-[var(--shadow-md)] flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[var(--danger)]" />
                  <div className="text-center sm:text-start">
                    <h4 className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--danger)] uppercase tracking-tight">{t('admin.pro_ui.admin_zone')}</h4>
                    <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] mt-1">{t('admin.pro_ui.restriction_actions')}</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => setConfirmModal({ user: selectedUser, action: selectedUser.isActive || selectedUser.active ? 'deactivate' : 'activate' })} 
                      className={`flex-1 sm:flex-none px-6 py-3 rounded-[12px] text-[13px] font-bold transition-all ${
                        selectedUser.isActive || selectedUser.active 
                          ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]' 
                          : 'bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]'
                      }`}
                    >
                      {selectedUser.isActive || selectedUser.active ? t('admin.users.suspend').toUpperCase() : t('admin.users.restore').toUpperCase()}
                    </button>
                    {showInactive && (
                      <button 
                        onClick={() => setConfirmModal({ action: 'delete', user: selectedUser })} 
                        className="flex-1 sm:flex-none px-6 py-3 rounded-[12px] text-[13px] font-bold bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] active:scale-95 transition-all"
                      >
                        {t('common.delete').toUpperCase()}
                      </button>
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
          onConfirm={handleActionConfirm}
          loading={actionLoading}
          title={confirmModal?.action === 'delete' ? "Supprimer le compte" : confirmModal?.action === 'activate' ? "Réactiver le compte" : "Suspendre le compte"}
          message={confirmModal?.action === 'delete' ? "Êtes-vous sûr ? Cette action supprimera définitivement l'utilisateur et toutes ses données associées." : "Souhaitez-vous modifier l'état d'accès de cet utilisateur ?"}
          type={confirmModal?.action === 'delete' ? 'danger' : 'warning'}
        />
      </div>
  );
};

export default UserManagement;
