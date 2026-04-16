import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { setCredentials } from "../store/auth/authSlice"
import { refreshApi } from "../api/axios"  
import { jwtDecode } from "jwt-decode"
import LoadingScreen from "../components/ui/LoadingScreen"


const PersistLogin = () => {
  const dispatch = useDispatch()
  const { token } = useSelector(state => state.auth)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const verifyRefreshToken = async () => {
      try {
        const res = await refreshApi.post("/auth/refresh")
        const newToken = res.data.token
        const decoded = jwtDecode(newToken)
        if (isMounted) {
          dispatch(setCredentials({
            token: newToken,
            user: {
              id: decoded.sub,
              email: decoded.email,
              name: decoded.name,
              role: decoded.role
            }
          }))
        }
      } catch (err) {
        // Silent catch for token refresh failure
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (!token) {
      verifyRefreshToken()
    } else {
      setLoading(false)
    }

    return () => { isMounted = false }
  }, [dispatch])

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg">P</span>
        </div>
        <span className="text-xl font-bold text-text-primary">PureClean</span>
      </div>
      <div className="w-8 h-8 border-3 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
      <p className="text-sm text-text-muted">Chargement en cours...</p>
    </div>
  )
  return <Outlet />
}

export default PersistLogin

