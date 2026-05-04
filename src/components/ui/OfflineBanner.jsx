import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * OfflineBanner
 *
 * Appears as a fixed banner at the very top of the screen when the browser
 * loses network connectivity. Disappears automatically when back online.
 *
 * Uses `navigator.onLine` for initial state and listens to the `online` /
 * `offline` window events for real-time updates.
 *
 * Shows the last time data was successfully synced so the user knows how
 * stale their cached data might be.
 */
const OfflineBanner = () => {
  const { t, i18n } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastSync, setLastSync] = useState(() => {
    // Persist last sync time in localStorage so it survives page refreshes.
    const stored = localStorage.getItem('pwa_last_sync');
    return stored ? new Date(stored) : null;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Record the moment connectivity was restored as the new "last sync".
      const now = new Date();
      setLastSync(now);
      localStorage.setItem('pwa_last_sync', now.toISOString());
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update last sync on every successful navigation while online.
    if (navigator.onLine) {
      const now = new Date();
      setLastSync(now);
      localStorage.setItem('pwa_last_sync', now.toISOString());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format "last sync" in the user's locale (FR or AR).
  const formatLastSync = (date) => {
    if (!date) return null;
    return date.toLocaleTimeString(i18n.language === 'ar' ? 'ar-MA' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOffline) return null;

  return (
    // Fixed banner just below the OS status bar — slides down from the top.
    <div
      className="fixed top-0 start-0 end-0 z-[200] flex items-center justify-center gap-3
        bg-[#F59E0B]/90 backdrop-blur-md text-white px-4 py-3 text-[11px] font-bold uppercase tracking-wider
        shadow-lg animate-in slide-in-from-top duration-500"
      role="status"
      aria-live="polite"
    >
      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
        <WifiOff size={14} className="text-white" />
      </div>
      <span>
        {/* Arabic: وضع بدون اتصال | French: Mode hors-ligne */}
        {i18n.language === 'ar' ? 'وضع بدون اتصال' : 'Mode hors-ligne'}
      </span>
      {lastSync && (
        <span className="opacity-80 font-medium normal-case tracking-tight border-l border-white/20 ps-3 ms-1 hidden sm:inline-block">
          {i18n.language === 'ar'
            ? `آخر مزامنة: ${formatLastSync(lastSync)}`
            : `Dernière sync: ${formatLastSync(lastSync)}`}
        </span>
      )}
    </div>
  );
};

export default OfflineBanner;
