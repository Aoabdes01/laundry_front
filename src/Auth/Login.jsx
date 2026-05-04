import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { 
  User, Lock, Eye, EyeOff, Check, AlertCircle, AlertTriangle, Languages, Loader2 
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
        <div className="bg-[var(--bg)] min-h-screen flex flex-col w-full items-center text-start">
            {/* Topbar: branding text only */}
            <nav className="w-full px-6 sm:px-10 py-5 flex items-center justify-between max-w-7xl">
                <div className="flex items-center gap-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-[18px] font-bold text-[var(--text)] tracking-tight">
                        PureClean
                    </span>
                </div>
                <button 
                    onClick={toggleLanguage}
                    className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-white border border-[rgba(0,0,0,0.06)] text-[var(--text-secondary)] shadow-sm active:scale-95 transition-all"
                >
                    <Languages size={18} />
                </button>
            </nav>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-5 py-12">
                {/* Title Section */}
                <div className="text-center mb-10">
                    <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold text-[var(--text)] tracking-tight">
                        {t('auth.login.title')}
                    </h1>
                    <p className="font-['Inter'] text-[14px] text-[var(--text-muted)] mt-2 uppercase tracking-[0.06em]">
                        PureClean Management
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[20px] shadow-[var(--shadow-md)] w-full p-8 border border-[rgba(0,0,0,0.06)]">
                    <div className="mb-8">
                        <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[var(--text)]">
                            {t('auth.login.welcome')}
                        </h2>
                        <p className="font-['Inter'] text-[14px] text-[var(--text-secondary)] mt-1">
                            {t('auth.login.subtitle')}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email field */}
                        <div className="space-y-2">
                            <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block px-1">
                                {t('auth.login.email_label')}
                            </label>
                            <div className="relative group">
                                <div className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('auth.login.email_placeholder')}
                                    required
                                    className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] ps-12 pe-4 py-4 text-[14px] font-medium text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--primary-glow)] focus:border-[var(--primary)] focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <label className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block px-1">
                                {t('auth.login.password_label')}
                            </label>
                            <div className="relative group">
                                <div className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('auth.login.password_placeholder')}
                                    required
                                    className="w-full bg-[var(--bg)] border border-[rgba(0,0,0,0.08)] rounded-[12px] ps-12 pe-12 py-4 text-[14px] font-medium text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-4 focus:ring-[var(--primary-glow)] focus:border-[var(--primary)] focus:bg-white transition-all"
                                />
                                <button
                                    type="button"
                                    className="absolute end-4 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all"
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
                                    className={`w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center transition-all ${
                                        rememberMe
                                            ? 'bg-[var(--primary)] border-[var(--primary)] shadow-sm'
                                            : 'border-[rgba(0,0,0,0.15)] bg-white group-hover:border-[var(--primary)]'
                                    }`}
                                    onClick={() => setRememberMe(!rememberMe)}
                                >
                                    {rememberMe && <Check className="w-3.5 h-3.5 text-white stroke-[3px]"/>}
                                </div>
                                <span className="font-['Inter'] text-[13px] font-semibold text-[var(--text-secondary)] select-none">
                                    {t('auth.login.remember_me')}
                                </span>
                            </label>
                            
                            <button
                                type="button"
                                className="font-['Inter'] text-[13px] font-bold text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                            >
                                {t('auth.login.forgot_password')}
                            </button>
                        </div>

                        {/* Alerts */}
                        {error && (
                            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] px-4 py-3 flex items-center gap-3 text-[#EF4444]">
                                <AlertCircle size={18} className="shrink-0" />
                                <p className="text-[13px] font-bold">{error}</p>
                            </div>
                        )}

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[12px] py-4 text-[14px] font-bold uppercase tracking-wider transition-all shadow-[var(--shadow-teal)] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{t('auth.login.submitting')}</span>
                                </div>
                            ) : (
                                t('auth.login.submit')
                            )}
                        </button>
                    </form>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-8 mt-auto text-center">
                <p className="font-['Inter'] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">
                    {t('auth.login.footer_title')}
                </p>
            </footer>
        </div>
    )
}

export default Login

