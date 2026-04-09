import { useSelector } from "react-redux"
import { Navigate, Outlet } from "react-router-dom"

const ProtectedRoute = ({ allowedRoles }) => {
  const user = useSelector(state => state.auth.user)

  // not logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // role check (if roles are specified)
  if (allowedRoles && !allowedRoles.some(role => user.roles.includes(role))) {
    return <Navigate to="/forbidden" replace />
  }

  // authorized
  return <Outlet />
}

export default ProtectedRoute

