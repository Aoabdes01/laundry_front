import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"

const RequireAuth = ({ allowedRoles }) => {
  const { user, token } = useSelector(
    state => state.auth
  )
  const location = useLocation()

  // Not authenticated
  if (!token || !user) {
    return <Navigate to="/"
      state={{ from: location }}
      replace />
  }

  // Authenticated but INACTIVE
  if (user.isActive === false) {
    return <Navigate to="/compte-suspendu" replace />
  }

  // Wrong role
  if (allowedRoles &&
    !allowedRoles.includes(user.role)) {
    return <Navigate to="/interdit" replace />
  }

  return <Outlet />
}

export default RequireAuth

