import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// ── Service Worker Registration ─────────────────────────────────────────────
//
// registerSW() is provided by vite-plugin-pwa at build time.
// - onNeedRefresh: a new SW is waiting. In autoUpdate mode this fires after
//   the new SW has already been installed — we can show a toast if we want.
// - onOfflineReady: the app shell is fully cached and works offline.
// - onRegisteredSW: fires once the SW is registered (for debugging).
//
const updateSW = registerSW({
  onNeedRefresh() {
    // autoUpdate mode handles this automatically; no user action needed.
    // Call updateSW(true) here if you ever want to force a reload prompt.
    updateSW(true)
  },
  onOfflineReady() {
    // The app is fully cached and ready to work offline.
    // You could show a toast here: "App ready for offline use".
    console.info('[PWA] App ready for offline use.')
  },
  onRegisteredSW(swUrl, r) {
    console.info(`[PWA] Service Worker registered: ${swUrl}`)
    // In development, check for SW updates every 30s so you see changes fast.
    if (import.meta.env.DEV && r) {
      setInterval(async () => {
        if (!(!r.installing && navigator)) return
        if (('connection' in navigator) && !navigator.onLine) return
        const resp = await fetch(swUrl, { cache: 'no-store', headers: { 'cache': 'no-store', 'cache-control': 'no-cache' } })
        if (resp?.status === 200) await r.update()
      }, 30000) // Every 30s in dev
    }
  },
  onRegisterError(error) {
    console.error('[PWA] Service Worker registration error:', error)
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
