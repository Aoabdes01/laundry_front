import { Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import { selectCurrentUser } from "../store/auth/authSelector"


const RequireRole = ({ allowedRoles }) => {
  const user = useSelector(selectCurrentUser)

  if (!user?.role) {
    return <Navigate to="/" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default RequireRole

