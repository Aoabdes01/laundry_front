import { createAsyncThunk } from '@reduxjs/toolkit'
import { loginRequest, Logout } from './authService'
import { jwtDecode } from 'jwt-decode'
import { logOut, setCredentials } from './authSlice'

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      const res = await loginRequest(credentials)

      const accessToken = res.data.token;

      const decoded = jwtDecode(accessToken)

      dispatch(setCredentials({
        user: {
          id:decoded.sub,
          name:decoded.name,
          email:decoded.email,
          role:decoded.role
        },
        token: accessToken
      }))
    } catch (error) {
      if (error.response?.data?.error === "ACCOUNT_DISABLED") {
        window.location.href = '/compte-suspendu'
        return rejectWithValue("Compte désactivé") // will not display because of redirect but good practice
      }
      return rejectWithValue(error.response?.data || "Erreur de connexion")
    }
  }
)

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    await Logout()
    dispatch(logOut())
  }
)


// // Change password thunk
// export const changePassword = createAsyncThunk(
//   'auth/changePassword',
//   async (passwordData, { rejectWithValue }) => {
//     try {
//       const response = await updateUserP(passwordData)
//       return response.data
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data?.message || 'Erreur lors du changement de mot de passe'
//       )
//     }
//   }
// )

// // Load user from token (pour l'initialisation de l'app)
// export const loadUserFromToken = createAsyncThunk(
//   'auth/loadUserFromToken',
//   async (_, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('accessToken')
      
//       if (!token) {
//         return rejectWithValue('No token found')
//       }
      
//       // Décoder le token
//       const decodedToken = jwtDecode(token)
      
//       // Vérifier si le token est expiré
//       const currentTime = Date.now() / 1000
//       if (decodedToken.exp < currentTime) {
//         localStorage.removeItem('accessToken')
//         return rejectWithValue('Token expired')
//       }
      
//       return {
//         token,
//         user: {
//           id: decodedToken.sub,
//           name: decodedToken.name,
//           email: decodedToken.email,
//           role: decodedToken.role
//         }
//       }
//     } catch (error) {
//       localStorage.removeItem('accessToken')
//       return rejectWithValue('Invalid token')
//     }
//   }
// )
