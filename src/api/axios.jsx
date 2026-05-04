import axios from "axios"
import { store } from "../store/store"
import { logOut, setCredentials } from "../store/auth/authSlice"
import { toast } from "react-toastify"

// ── Base URL Strategy ──────────────────────────────────────────────────────
// DEV mode  → empty string = requests go to the same origin (Vite dev server)
//             Vite's proxy then forwards /api/* and /auth/* to localhost:8080
//             This means only ONE ngrok tunnel is needed for phone testing!
//
// PROD mode → VITE_API_URL = full backend URL (e.g. Railway deployment URL)
//             Requests go directly to the Spring Boot server.
const BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '')

// ── ngrok Free Tier Fix ────────────────────────────────────────────────────
// ngrok free tier shows an HTML interstitial warning page for XHR/fetch
// requests made through the tunnel. This causes API calls to fail with
// unexpected HTML responses instead of JSON. The header below tells ngrok
// to skip the interstitial and forward the request directly.
const NGROK_HEADER = { 'ngrok-skip-browser-warning': 'true' }

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: NGROK_HEADER,
})

const refreshApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: NGROK_HEADER,
})

api.interceptors.request.use((config) => {
  const token = store.getState()?.auth?.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config


    if (error.response?.status === 403) {
      if (error.response?.data?.error === "ACCOUNT_DISABLED") {
        store.dispatch(logOut())
        localStorage.removeItem('user')
        window.location.href = '/compte-suspendu'
        return Promise.reject(error)
      }

      // Check if inactive natively via cache
      const user = JSON.parse(
        localStorage.getItem('user') || 'null'
      )
      store.dispatch(logOut())
      if (user?.isActive === false) {
        window.location.href = '/compte-suspendu'
      } else {
        window.location.href = '/interdit'
      }
      return Promise.reject(error)
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true

      try {
        const res = await refreshApi.post("/auth/refresh")
        const token = res.data.token   // Fixed: was res.data.tocken (typo)

        store.dispatch(setCredentials({ token }))
        originalRequest.headers.Authorization = `Bearer ${token}`

        return api(originalRequest)
      } catch (err) {
        store.dispatch(logOut())
        localStorage.removeItem('user')
        window.location.href = '/'
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  }
)

export { refreshApi }

