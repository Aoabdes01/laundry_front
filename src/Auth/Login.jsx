import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { 
  User, Lock, Eye, EyeOff, Check, AlertCircle, AlertTriangle, Languages 
} from 'lucide-react'
import { useTranslation } from "react-i18next"
import { login } from "../store/auth/authThunk"
import { selectCurrentUser } from "../store/auth/authSelector"

const Login = () => {
    const { t, i18n } = useTranslation()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const userFromStore = useSelector(selectCurrentUser)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState('')
    const [rateLimitMessage, setRateLimitMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const toggleLanguage = () => {
        const newLang = i18n.language === 'fr' ? 'ar' : 'fr'
        i18n.changeLanguage(newLang)
    }

    const currentLang = i18n.language || 'fr'

    useEffect(() => {
        const msg = sessionStorage.getItem('rateLimitMessage')
        if (msg) {
            setRateLimitMessage(msg)
            sessionStorage.removeItem('rateLimitMessage')
        }

        if (!userFromStore?.role) return
        const paths = {
            admin: '/admin/dashboard',
            employe: '/employe/dashboard',
            livreur: '/livreur'
        }
        navigate(paths[userFromStore.role] || '/unauthorized', { replace: true })
    }, [userFromStore, navigate])

    const handleLogin = async (e) => {
        e?.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            await dispatch(login({ email, password })).unwrap()
        } catch (err) {
            if (err === "Compte désactivé") return; // Let the redirect happen silently
            setError(t('auth.login.error_invalid'))
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-[#EDE8E0] min-h-screen flex flex-col w-full font-sans items-center">
            {/* Topbar: branding text only */}
            <nav className="w-full px-6 sm:px-10 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#1A1A2E]">
                        PureClean
                    </span>
                </div>
                <button 
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 hover:bg-white transition-all text-xs font-bold text-[#1A1A2E] shadow-sm border border-white/20"
                >
                    <Languages size={16} className="text-primary-500" />
                    <span className="hidden sm:inline">
                        {currentLang === 'fr' ? 'العربية' : 'Français'}
                    </span>
                    <span className="sm:hidden uppercase">
                        {currentLang === 'fr' ? 'AR' : 'FR'}
                    </span>
                </button>
            </nav>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-4 pt-4 pb-8 sm:pt-0 sm:pb-0 sm:-mt-10">
                {/* Title Section */}
                <div className="text-center mb-6 sm:mb-10">
                    <h1 className="text-4xl sm:text-6xl font-black text-[#1A1A2E] tracking-tight flex items-end justify-center gap-1">
                        {t('auth.login.title')}
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary-500 mb-1.5 sm:mb-2 inline-block flex-shrink-0" />
                    </h1>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-sm w-full p-8 sm:p-10 mx-auto border border-white/20">
                    <h2 className="text-2xl font-bold text-[#1A1A2E] mb-1">
                        {t('auth.login.welcome')}
                    </h2>
                    <p className="text-sm text-[#9CA3AF] mb-10">
                        {t('auth.login.subtitle')}
                    </p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email field */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#1A1A2E] px-1 block">
                                {t('auth.login.email_label')}
                            </label>
                            <div className="relative group">
                                <div className="absolute start-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-primary-500 transition-colors">
                                    <User size={18} strokeWidth={2.5} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('auth.login.email_placeholder')}
                                    required
                                    className="w-full bg-[#F4F2EE] border-0 rounded-2xl ps-12 pe-4 py-4 text-sm font-bold text-[#1A1A2E] placeholder:text-[#9CA3AF]/50 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all font-sans"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#1A1A2E] px-1 block">
                                {t('auth.login.password_label')}
                            </label>
                            <div className="relative group">
                                <div className="absolute start-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-primary-500 transition-colors">
                                    <Lock size={18} strokeWidth={2.5} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('auth.login.password_placeholder')}
                                    required
                                    className="w-full bg-[#F4F2EE] border-0 rounded-2xl ps-12 pe-12 py-4 text-sm font-bold text-[#1A1A2E] placeholder:text-[#9CA3AF]/50 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all font-sans"
                                />
                                <button
                                    type="button"
                                    className="absolute end-4 top-1/2 -translate-y-1/2 p-1 text-[#9CA3AF] hover:text-[#1A1A2E] transition-all active:scale-90"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>
                        </div>

                        {/* Remember me + forgot password */}
                        <div className="flex items-center justify-between py-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div
                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                        rememberMe
                                            ? 'bg-primary-500 border-primary-500 shadow-sm'
                                            : 'border-gray-200 bg-white group-hover:border-primary-300'
                                    }`}
                                    onClick={() => setRememberMe(!rememberMe)}
                                >
                                    {rememberMe && <Check className="w-4 h-4 text-white stroke-[3.5px]"/>}
                                </div>
                                <span className="text-sm font-bold text-[#9CA3AF] select-none tracking-tight">
                                    {t('auth.login.remember_me')}
                                </span>
                            </label>
                            
                            <button
                                type="button"
                                className="text-sm text-primary-500 font-bold hover:text-primary-600 transition-colors"
                                onClick={() => {/* forgot password logic here */}}
                            >
                                {t('auth.login.forgot_password')}
                            </button>
                        </div>

                        {/* Alerts */}
                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex items-center gap-3 text-red-600 animate-shake">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        {rateLimitMessage && (
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 flex items-center gap-3 text-amber-700 animate-pulse">
                                <AlertTriangle size={20} className="shrink-0" />
                                <p className="text-sm font-bold">{rateLimitMessage}</p>
                            </div>
                        )}

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white rounded-full py-4 text-sm font-bold uppercase tracking-widest transition-all shadow-md active:scale-[0.98] disabled:opacity-60"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    <span>{t('auth.login.submitting')}</span>
                                </div>
                            ) : (
                                t('auth.login.submit')
                            )}
                        </button>
                    </form>
                </div>
            </main>

            {/* Final Single Footer */}
            <footer className="w-full py-12 flex flex-col items-center justify-center gap-4 mt-auto">
                <div className="text-center">
                    <p className="text-[10px] sm:text-xs font-black text-[#A09A8D] uppercase tracking-[0.3em]">
                        {t('auth.login.footer_title')}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-[#B1AB9D] uppercase tracking-[0.2em] mt-1 opacity-70">
                        {t('auth.login.footer_subtitle')}
                    </p>
                </div>
            </footer>
        </div>
    )
}

export default Login

