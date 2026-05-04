import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * InstallPWA
 *
 * Listens for the browser's `beforeinstallprompt` event — fired by Chrome/Edge
 * on Android when the PWA install criteria are met. Shows a bottom sheet
 * prompting the user to install PureClean to their home screen.
 *
 * NOT shown on iOS (Safari doesn't fire beforeinstallprompt — iOS users
 * must use "Share → Add to Home Screen" manually).
 *
 * Once dismissed, writes to localStorage so it never shows again for this
 * user on this device.
 */
const InstallPWA = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  // The deferred prompt saved from the beforeinstallprompt event.
  const [installPrompt, setInstallPrompt] = useState(null);
  // Whether the sheet is visible.
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If the user already dismissed this, never show again.
    if (localStorage.getItem('pwa_install_dismissed')) return;

    // If already installed (running in standalone mode), don't show.
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      // Prevent the default mini-infobar from appearing on mobile.
      e.preventDefault();
      // Save the event so we can trigger it later.
      setInstallPrompt(e);
      // Show the custom install UI after a short delay (feels more natural).
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    // Show the browser's native install dialog.
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.info('[PWA] User accepted the install prompt.');
    }
    // Whether accepted or dismissed, hide the banner and clean up.
    setIsVisible(false);
    setInstallPrompt(null);
    localStorage.setItem('pwa_install_dismissed', '1');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember the dismissal so we don't bother the user again.
    localStorage.setItem('pwa_install_dismissed', '1');
  };

  if (!isVisible || !installPrompt) return null;

  return (
    // Bottom sheet — slides up from the bottom.
    <div
      className="fixed bottom-0 start-0 end-0 z-[150] p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-slide-up"
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'تثبيت التطبيق' : "Installer l'application"}
    >
      <div className="bg-white border border-[rgba(0,0,0,0.06)] rounded-[20px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] p-5 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--primary)]" />
        
        {/* App icon */}
        <div className="w-14 h-14 rounded-[14px] bg-[var(--primary-surface)] border border-[rgba(13,115,119,0.1)] flex items-center justify-center shrink-0 shadow-sm">
          <img
            src="/icons/icon-72x72.png"
            alt="PureClean"
            className="w-10 h-10 object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 text-start">
          <p className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[var(--text)] tracking-tight">
            {isArabic ? 'ثبّت PureClean' : 'Installer PureClean'}
          </p>
          <p className="font-['Inter'] text-[12px] text-[var(--text-muted)] font-medium mt-0.5 leading-snug">
            {isArabic
              ? 'أضف التطبيق إلى شاشتك الرئيسية للوصول السريع'
              : "Accédez rapidement depuis votre écran d'accueil"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 ps-2">
          <button
            onClick={handleInstall}
            id="pwa-install-btn"
            className="flex items-center gap-1.5 bg-[var(--primary)] text-white text-[12px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-[10px] shadow-[var(--shadow-teal)] active:scale-95 transition-all"
          >
            <Download size={14} />
            {isArabic ? 'تثبيت' : 'Installer'}
          </button>
          <button
            onClick={handleDismiss}
            id="pwa-dismiss-btn"
            className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[var(--bg)] border border-[rgba(0,0,0,0.06)] text-[var(--text-muted)] active:scale-95 transition-all"
            aria-label={isArabic ? 'لا، شكراً' : 'Plus tard'}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
