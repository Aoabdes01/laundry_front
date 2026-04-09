import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { LogOut, Power } from 'lucide-react';
import { logoutThunk } from "../store/auth/authThunk";
import { useTranslation } from 'react-i18next';

const LogoutButton = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await dispatch(logoutThunk())
    navigate("/")
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center lg:justify-start gap-2 px-2 lg:px-4 py-2.5 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-all group/logout active:scale-95"
      title={t('common.logout')}
    >
      <LogOut size={20} strokeWidth={3} className="transition-transform group-hover/logout:rotate-12 shrink-0 ltr:rotate-0 rtl:rotate-180" />
      <span className="hidden lg:inline uppercase tracking-widest">{t('common.logout')}</span>
    </button>
  );
}

export default LogoutButton
